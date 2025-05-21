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

// GET: List all academic periods (admins only)
export async function GET(req: Request) {
  const adminId = await getAdminId(req);
  if (!adminId) {
    return NextResponse.json(
      { error: 'Unauthorized. Admins only.' },
      { status: 403 }
    );
  }

  try {
    const academicPeriods = await prisma.academicPeriod.findMany({
      orderBy: [{ startDate: 'desc' }, { name: 'asc' }],
    });

    return NextResponse.json({ academicPeriods });
  } catch (error) {
    console.error('Error fetching academic periods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch academic periods. Please try again.' },
      { status: 500 }
    );
  }
}

// POST: Create a new academic period (admins only)
export async function POST(req: Request) {
  const adminId = await getAdminId(req);
  if (!adminId) {
    return NextResponse.json(
      { error: 'Unauthorized. Admins only.' },
      { status: 403 }
    );
  }

  const { name, startDate, endDate, isEnrollmentOpen } = await req.json();

  // Validate required fields
  if (!name || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'Name, start date, and end date are required.' },
      { status: 400 }
    );
  }

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json(
      { error: 'Invalid date format.' },
      { status: 400 }
    );
  }

  if (end <= start) {
    return NextResponse.json(
      { error: 'End date must be after start date.' },
      { status: 400 }
    );
  }

  try {
    const academicPeriod = await prisma.academicPeriod.create({
      data: {
        name,
        startDate: start,
        endDate: end,
        isEnrollmentOpen: isEnrollmentOpen || false,
      },
    });

    // Log in audit
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'CREATE',
        entityType: 'AcademicPeriod',
        entityId: academicPeriod.id,
        oldValue: undefined,
        newValue: academicPeriod,
      },
    });

    return NextResponse.json({ success: true, academicPeriod });
  } catch (error) {
    console.error('Error creating academic period:', error);
    return NextResponse.json(
      { error: 'Failed to create academic period. Please try again.' },
      { status: 500 }
    );
  }
}
