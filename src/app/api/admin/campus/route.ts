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

// GET: List all campuses (admins only)
export async function GET(req: Request) {
  const adminId = await getAdminId(req);
  if (!adminId) {
    return NextResponse.json(
      { error: 'Unauthorized. Admins only.' },
      { status: 403 }
    );
  }

  try {
    const campuses = await prisma.campus.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ campuses });
  } catch (error) {
    console.error('Error fetching campuses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campuses. Please try again.' },
      { status: 500 }
    );
  }
}

// POST: Create a new campus (admins only)
export async function POST(req: Request) {
  const adminId = await getAdminId(req);
  if (!adminId) {
    return NextResponse.json(
      { error: 'Unauthorized. Admins only.' },
      { status: 403 }
    );
  }

  const { name, address, city, district, phone, email } = await req.json();

  // Validate required fields
  if (!name) {
    return NextResponse.json(
      { error: 'Campus name is required.' },
      { status: 400 }
    );
  }

  // Check if campus with the same name already exists
  const existingCampus = await prisma.campus.findUnique({
    where: { name },
  });

  if (existingCampus) {
    return NextResponse.json(
      { error: 'A campus with this name already exists.' },
      { status: 409 }
    );
  }

  try {
    const campus = await prisma.campus.create({
      data: {
        name,
        address,
        city,
        district,
        phone,
        email,
      },
    });

    // Log in audit
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'CREATE',
        entityType: 'Campus',
        entityId: campus.id,
        oldValue: undefined,
        newValue: campus,
      },
    });

    return NextResponse.json({ success: true, campus });
  } catch (error) {
    console.error('Error creating campus:', error);
    return NextResponse.json(
      { error: 'Failed to create campus. Please try again.' },
      { status: 500 }
    );
  }
}
