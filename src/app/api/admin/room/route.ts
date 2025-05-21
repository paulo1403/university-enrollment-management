import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyJwt } from '@/lib/jwt';

const prisma = new PrismaClient();

async function getAdminId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  const payload = token ? verifyJwt(token) : null;
  if (
    payload &&
    typeof payload === 'object' &&
    'role' in payload &&
    payload.role === 'ADMIN'
  ) {
    return payload.id as string;
  }
  return null;
}

// GET: List all rooms (admins only)
export async function GET(req: Request) {
  const adminId = await getAdminId(req);
  if (!adminId) {
    return NextResponse.json(
      { error: 'Unauthorized. Admins only.' },
      { status: 403 }
    );
  }

  // Get query parameters
  const url = new URL(req.url);
  const campusId = url.searchParams.get('campusId');

  try {
    const rooms = await prisma.room.findMany({
      where: campusId ? { campusId } : undefined,
      include: {
        campus: true,
      },
      orderBy: [{ campus: { name: 'asc' } }, { name: 'asc' }],
    });

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms. Please try again.' },
      { status: 500 }
    );
  }
}

// POST: Create a new room (admins only)
export async function POST(req: Request) {
  const adminId = await getAdminId(req);
  if (!adminId) {
    return NextResponse.json(
      { error: 'Unauthorized. Admins only.' },
      { status: 403 }
    );
  }

  const { name, capacity, campusId } = await req.json();

  // Validate required fields
  if (!name || !campusId) {
    return NextResponse.json(
      { error: 'Room name and campus are required.' },
      { status: 400 }
    );
  }

  // Validate campus exists
  const campus = await prisma.campus.findUnique({
    where: { id: campusId },
  });

  if (!campus) {
    return NextResponse.json({ error: 'Campus not found.' }, { status: 404 });
  }

  try {
    const room = await prisma.room.create({
      data: {
        name,
        capacity: capacity ? Number(capacity) : null,
        campusId,
      },
      include: {
        campus: true,
      },
    });

    // Log in audit
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'CREATE',
        entityType: 'Room',
        entityId: room.id,
        oldValue: undefined,
        newValue: room,
      },
    });

    return NextResponse.json({ success: true, room });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room. Please try again.' },
      { status: 500 }
    );
  }
}
