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

// DELETE: Remove a class time
export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string; classTimeId: string } }
) {
  const adminId = await getAdminId(req);
  if (!adminId) {
    return NextResponse.json(
      { error: 'Unauthorized. Admins only.' },
      { status: 403 }
    );
  }

  const { courseId, classTimeId } = params;

  // Check if class time exists and belongs to the course
  const classTime = await prisma.classTime.findFirst({
    where: {
      id: classTimeId,
      courseId: courseId,
    },
    include: {
      course: true,
      room: true,
    },
  });

  if (!classTime) {
    return NextResponse.json(
      { error: 'Class time not found or does not belong to this course.' },
      { status: 404 }
    );
  }

  try {
    await prisma.classTime.delete({
      where: {
        id: classTimeId,
      },
    });

    // Log in audit
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'DELETE',
        entityType: 'ClassTime',
        entityId: classTimeId,
        oldValue: classTime,
        newValue: undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting class time:', error);
    return NextResponse.json(
      { error: 'Failed to delete class time. Please try again.' },
      { status: 500 }
    );
  }
}
