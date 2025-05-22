import { NextResponse } from 'next/server';
import { PrismaClient, CourseModality } from '@prisma/client';
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

// GET: List all courses (admins only)
export async function GET(req: Request) {
  const adminId = await getAdminId(req);
  if (!adminId) {
    return NextResponse.json(
      { error: 'Unauthorized. Admins only.' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const modality = searchParams.get('modality');
  const campusId = searchParams.get('campusId');
  const academicPeriodId = searchParams.get('academicPeriodId');
  const professorId = searchParams.get('professorId');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Math.min(
    parseInt(searchParams.get('pageSize') || '50', 10),
    200
  );

  let where: any = {};
  if (search) {
    where.OR = [{ code: { contains: search } }, { name: { contains: search } }];
  }
  if (modality && ['PRESENCIAL', 'VIRTUAL'].includes(modality)) {
    where.modality = modality;
  }
  if (campusId) {
    where.campusId = campusId;
  }
  if (academicPeriodId) {
    where.academicPeriodId = academicPeriodId;
  }  if (professorId) {
    where.courseProfessors = {
      some: {
        professorId: professorId
      }
    };
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      include: {
        courseProfessors: {
          include: {
            professor: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        campus: true,
        academicPeriod: true,
      },
      orderBy: { code: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.course.count({ where }),
  ]);

  return NextResponse.json({
    courses,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

// POST: Create a new course (admins only)
export async function POST(req: Request) {
  const adminId = await getAdminId(req);
  if (!adminId) {
    return NextResponse.json(
      { error: 'Unauthorized. Admins only.' },
      { status: 403 }
    );
  }

  const {
    code,
    name,
    description,
    credits,
    capacity,
    professorIds,
    campusId,
    modality,
    academicPeriodId,
  } = await req.json();

  // Validate required fields
  if (
    !code ||
    !name ||
    !credits ||
    !capacity ||
    !campusId ||
    !academicPeriodId
  ) {
    return NextResponse.json(
      {
        error:
          'Code, name, credits, capacity, campus and academic period are required.',
      },
      { status: 400 }
    );
  }

  // Validate modality
  if (
    modality &&
    !Object.values(CourseModality).includes(modality as CourseModality)
  ) {
    return NextResponse.json(
      { error: 'Invalid course modality.' },
      { status: 400 }
    );
  }

  // Check if course code already exists
  const existingCourse = await prisma.course.findUnique({ where: { code } });
  if (existingCourse) {
    return NextResponse.json(
      { error: 'A course with this code already exists.' },
      { status: 409 }
    );
  }

  // Validate campus exists
  const campus = await prisma.campus.findUnique({ where: { id: campusId } });
  if (!campus) {
    return NextResponse.json({ error: 'Campus not found.' }, { status: 404 });
  }

  // Validate academic period exists
  const academicPeriod = await prisma.academicPeriod.findUnique({
    where: { id: academicPeriodId },
  });
  if (!academicPeriod) {
    return NextResponse.json(
      { error: 'Academic period not found.' },
      { status: 404 }
    );
  }

  // Validate professor exists if provided
  if (professorId) {
    const professor = await prisma.professor.findUnique({
      where: { userId: professorId },
    });
    if (!professor) {
      return NextResponse.json(
        { error: 'Professor not found.' },
        { status: 404 }
      );
    }
  }

  try {
    const course = await prisma.course.create({
      data: {
        code,
        name,
        description,
        credits: Number(credits),
        capacity: Number(capacity),
        professorId,
        campusId,
        modality: (modality as CourseModality) || CourseModality.PRESENCIAL,
        academicPeriodId,
      },
      include: {
        professor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        campus: true,
        academicPeriod: true,
      },
    });

    // Log in audit
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'CREATE',
        entityType: 'Course',
        entityId: course.id,
        oldValue: undefined,
        newValue: course,
      },
    });

    return NextResponse.json({ success: true, course });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course. Please try again.' },
      { status: 500 }
    );
  }
}
