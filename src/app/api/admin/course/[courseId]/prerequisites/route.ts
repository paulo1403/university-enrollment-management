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

// POST: Add a prerequisite to a course
export async function POST(
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
  const { prerequisiteId } = await req.json();

  if (!prerequisiteId) {
    return NextResponse.json(
      { error: 'Prerequisite ID is required.' },
      { status: 400 }
    );
  }

  // Check if course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
  }

  // Check if prerequisite course exists
  const prerequisite = await prisma.course.findUnique({
    where: { id: prerequisiteId },
  });

  if (!prerequisite) {
    return NextResponse.json(
      { error: 'Prerequisite course not found.' },
      { status: 404 }
    );
  }

  // Check if prerequisite already exists
  const existingPrerequisite = await prisma.coursePrerequisite.findUnique({
    where: {
      courseId_prerequisiteId: {
        courseId: courseId,
        prerequisiteId: prerequisiteId,
      },
    },
  });

  if (existingPrerequisite) {
    return NextResponse.json(
      { error: 'This prerequisite is already added to the course.' },
      { status: 409 }
    );
  }

  // Check for circular reference
  if (courseId === prerequisiteId) {
    return NextResponse.json(
      { error: 'A course cannot be its own prerequisite.' },
      { status: 400 }
    );
  }

  // Check if this would create a circular reference
  const circularCheck = await checkForCircularReference(
    prerequisiteId,
    courseId
  );

  if (circularCheck) {
    return NextResponse.json(
      { error: 'Adding this prerequisite would create a circular reference.' },
      { status: 400 }
    );
  }

  try {
    const coursePrerequisite = await prisma.coursePrerequisite.create({
      data: {
        courseId: courseId,
        prerequisiteId: prerequisiteId,
      },
      include: {
        course: true,
        prerequisite: true,
      },
    });

    // Log in audit
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'CREATE',
        entityType: 'CoursePrerequisite',
        entityId: `${courseId}_${prerequisiteId}`,
        oldValue: undefined,
        newValue: coursePrerequisite,
      },
    });

    return NextResponse.json({
      success: true,
      prerequisite: coursePrerequisite,
    });
  } catch (error) {
    console.error('Error adding prerequisite:', error);
    return NextResponse.json(
      { error: 'Failed to add prerequisite. Please try again.' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a prerequisite from a course
export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string; prerequisiteId: string } }
) {
  const adminId = await getAdminId(req);
  if (!adminId) {
    return NextResponse.json(
      { error: 'Unauthorized. Admins only.' },
      { status: 403 }
    );
  }

  const { courseId, prerequisiteId } = params;

  // Check if the prerequisite relationship exists
  const coursePrerequisite = await prisma.coursePrerequisite.findUnique({
    where: {
      courseId_prerequisiteId: {
        courseId: courseId,
        prerequisiteId: prerequisiteId,
      },
    },
    include: {
      course: true,
      prerequisite: true,
    },
  });

  if (!coursePrerequisite) {
    return NextResponse.json(
      { error: 'Prerequisite relationship not found.' },
      { status: 404 }
    );
  }

  try {
    await prisma.coursePrerequisite.delete({
      where: {
        courseId_prerequisiteId: {
          courseId: courseId,
          prerequisiteId: prerequisiteId,
        },
      },
    });

    // Log in audit
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'DELETE',
        entityType: 'CoursePrerequisite',
        entityId: `${courseId}_${prerequisiteId}`,
        oldValue: coursePrerequisite,
        newValue: undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing prerequisite:', error);
    return NextResponse.json(
      { error: 'Failed to remove prerequisite. Please try again.' },
      { status: 500 }
    );
  }
}

// Helper function to check for circular references
async function checkForCircularReference(
  courseId: string,
  potentialPrereqId: string,
  visited: Set<string> = new Set()
): Promise<boolean> {
  // If we've already visited this course in this path, stop to prevent infinite loops
  if (visited.has(courseId)) {
    return false;
  }

  // Add current course to visited set
  visited.add(courseId);

  // Get all prerequisites of the current course
  const prerequisites = await prisma.coursePrerequisite.findMany({
    where: { courseId: courseId },
    select: { prerequisiteId: true },
  });

  // Check each prerequisite
  for (const prereq of prerequisites) {
    // If any prerequisite is the potential prerequisite, we have a circular reference
    if (prereq.prerequisiteId === potentialPrereqId) {
      return true;
    }

    // Recursively check prerequisites of this prerequisite
    const isCircular = await checkForCircularReference(
      prereq.prerequisiteId,
      potentialPrereqId,
      new Set(visited)
    );

    if (isCircular) {
      return true;
    }
  }

  // No circular reference found
  return false;
}
