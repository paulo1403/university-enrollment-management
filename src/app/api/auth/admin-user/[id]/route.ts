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

// GET, POST are in route.ts. This handles PUT and DELETE for /api/auth/admin-user/[id]
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const adminId = await getAdminId(req);
  if (!adminId) {
    return NextResponse.json(
      { error: 'Unauthorized. Admins only.' },
      { status: 403 }
    );
  }
  const { id } = params;
  const { email, name, role, twoFactorEnabled } = await req.json();
  const oldUser = await prisma.user.findUnique({ where: { id } });
  if (!oldUser) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }
  if (role && !['STUDENT', 'PROFESSOR', 'ADMIN'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
  }
  const user = await prisma.user.update({
    where: { id },
    data: { email, name, role, twoFactorEnabled },
  });
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'UPDATE',
      entityType: 'User',
      entityId: user.id,
      oldValue: oldUser,
      newValue: user,
    },
  });
  return NextResponse.json({ success: true, user });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const adminId = await getAdminId(req);
  if (!adminId) {
    return NextResponse.json(
      { error: 'Unauthorized. Admins only.' },
      { status: 403 }
    );
  }
  const { id } = params;
  const oldUser = await prisma.user.findUnique({ where: { id } });
  if (!oldUser) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }
  await prisma.user.delete({ where: { id } });
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'DELETE',
      entityType: 'User',
      entityId: id,
      oldValue: oldUser,
      newValue: undefined,
    },
  });
  return NextResponse.json({ success: true });
}
