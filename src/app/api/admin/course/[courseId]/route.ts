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

// GET: Get a specific course by id
export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  const adminId = await getAdminId(req);
  if (!adminId) {
    return NextResponse.json(
      { error: 'Unauthorized. Admins only.' },
      { status: 403 }
    );
  }

  const { courseId } = params;

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
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
        classTimes: {
          include: {
            room: true,
          },
        },
        coursePrerequisites: {
          include: {
            prerequisite: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course. Please try again.' },
      { status: 500 }
    );
  }
}

// PUT: Update a course
export async function PUT(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  const adminId = await getAdminId(req);
  if (!adminId) {
    return NextResponse.json(
      { error: 'Unauthorized. Admins only.' },
      { status: 403 }
    );
  }

  const { courseId } = params;
  const {
    code,
    name,
    description,
    credits,
    capacity,
    professorId,
    campusId,
    modality,
    academicPeriodId,
  } = await req.json();

  // Fetch the original course to store in audit log
  const originalCourse = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      professor: true,
      campus: true,
      academicPeriod: true,
    },
  });

  if (!originalCourse) {
    return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
  }

  // Validate modality if provided
  if (
    modality &&
    !Object.values(CourseModality).includes(modality as CourseModality)
  ) {
    return NextResponse.json(
      { error: 'Invalid course modality.' },
      { status: 400 }
    );
  }

  // Check if updating code and if new code already exists
  if (code && code !== originalCourse.code) {
    const existingCourse = await prisma.course.findUnique({
      where: { code },
    });

    if (existingCourse && existingCourse.id !== courseId) {
      return NextResponse.json(
        { error: 'A course with this code already exists.' },
        { status: 409 }
      );
    }
  }

  // Validate campus exists if provided
  if (campusId) {
    const campus = await prisma.campus.findUnique({
      where: { id: campusId },
    });

    if (!campus) {
      return NextResponse.json({ error: 'Campus not found.' }, { status: 404 });
    }
  }

  // Validate academic period exists if provided
  if (academicPeriodId) {
    const academicPeriod = await prisma.academicPeriod.findUnique({
      where: { id: academicPeriodId },
    });

    if (!academicPeriod) {
      return NextResponse.json(
        { error: 'Academic period not found.' },
        { status: 404 }
      );
    }
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
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        code,
        name,
        description,
        credits: credits ? Number(credits) : undefined,
        capacity: capacity ? Number(capacity) : undefined,
        professorId,
        campusId,
        modality: modality as CourseModality | undefined,
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
        action: 'UPDATE',
        entityType: 'Course',
        entityId: updatedCourse.id,
        oldValue: originalCourse,
        newValue: updatedCourse,
      },
    });

    return NextResponse.json({ success: true, course: updatedCourse });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course. Please try again.' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a course
export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  const adminId = await getAdminId(req);
  if (!adminId) {
    return NextResponse.json(
      { error: 'Unauthorized. Admins only.' },
      { status: 403 }
    );
  }

  const { courseId } = params;

  // Check if course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      enrollments: true,
      classTimes: true,
      coursePrerequisites: true,
      prerequisiteFor: true,
    },
  });

  if (!course) {
    return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
  }

  // Check if course has enrollments
  if (course.enrollments.length > 0) {
    return NextResponse.json(
      { error: 'Cannot delete course with existing enrollments.' },
      { status: 400 }
    );
  }

  try {
    // Delete class times
    if (course.classTimes.length > 0) {
      await prisma.classTime.deleteMany({
        where: { courseId: courseId },
      });
    }

    // Delete prerequisites
    if (course.coursePrerequisites.length > 0) {
      await prisma.coursePrerequisite.deleteMany({
        where: { courseId: courseId },
      });
    }

    // Delete references where this course is a prerequisite
    if (course.prerequisiteFor.length > 0) {
      await prisma.coursePrerequisite.deleteMany({
        where: { prerequisiteId: courseId },
      });
    }

    // Delete the course
    await prisma.course.delete({ where: { id: courseId } });

    // Log in audit
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'DELETE',
        entityType: 'Course',
        entityId: courseId,
        oldValue: course,
        newValue: undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course. Please try again.' },
      { status: 500 }
    );
  }
}
