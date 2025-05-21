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

// POST: Add a class time to a course
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
  const { day, startTime, endTime, roomId } = await req.json();

  // Validate required fields
  if (!day || !startTime || !endTime) {
    return NextResponse.json(
      { error: 'Day, start time, and end time are required.' },
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

  // Validate room if provided
  if (roomId) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found.' }, { status: 404 });
    }

    // Ensure room is in the same campus as the course
    if (room.campusId !== course.campusId) {
      return NextResponse.json(
        { error: 'Room must be in the same campus as the course.' },
        { status: 400 }
      );
    }
  }

  // Format the times properly
  const formatTimeString = (timeStr: string) => {
    // If it's already a date string, return it
    if (timeStr.includes('T') || timeStr.includes('-')) {
      return new Date(timeStr);
    }

    // If it's just a time (HH:MM), create a date object with it
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const startDateTime = formatTimeString(startTime);
  const endDateTime = formatTimeString(endTime);

  // Validate time range
  if (startDateTime >= endDateTime) {
    return NextResponse.json(
      { error: 'End time must be after start time.' },
      { status: 400 }
    );
  }

  try {
    // Check for conflicting class times in the same room
    if (roomId) {
      const conflictingClassTimes = await prisma.classTime.findMany({
        where: {
          day: day,
          roomId: roomId,
          NOT: {
            courseId: courseId, // Exclude the current course's existing times when checking
          },
          OR: [
            {
              // New class starts during an existing class
              startTime: {
                lte: endDateTime,
              },
              endTime: {
                gt: startDateTime,
              },
            },
            {
              // New class ends during an existing class
              startTime: {
                lt: endDateTime,
              },
              endTime: {
                gte: startDateTime,
              },
            },
            {
              // New class encompasses an existing class
              startTime: {
                gte: startDateTime,
              },
              endTime: {
                lte: endDateTime,
              },
            },
          ],
        },
      });

      if (conflictingClassTimes.length > 0) {
        return NextResponse.json(
          { error: 'The room is already booked during this time.' },
          { status: 409 }
        );
      }
    }

    const classTime = await prisma.classTime.create({
      data: {
        courseId: courseId,
        day: day,
        startTime: startDateTime,
        endTime: endDateTime,
        roomId: roomId || null,
      },
      include: {
        room: true,
      },
    });

    // Log in audit
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'CREATE',
        entityType: 'ClassTime',
        entityId: classTime.id,
        oldValue: undefined,
        newValue: classTime,
      },
    });

    return NextResponse.json({ success: true, classTime });
  } catch (error) {
    console.error('Error adding class time:', error);
    return NextResponse.json(
      { error: 'Failed to add class time. Please try again.' },
      { status: 500 }
    );
  }
}
