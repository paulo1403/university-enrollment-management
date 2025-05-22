import { NextResponse } from 'next/server';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
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

// GET: List all users (admins only)
export async function GET(req: Request) {
  const adminId = await getAdminId(req);
  if (!adminId) {
    return NextResponse.json(
      { error: 'Unauthorized. Admins only.' },
      { status: 403 }
    );
  }
  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');
  const search = searchParams.get('search');

  let where: any = {};
  if (role && ['STUDENT', 'PROFESSOR', 'ADMIN'].includes(role)) {
    where.role = role;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      twoFactorEnabled: true,
    },
    orderBy: { email: 'asc' },
  });

  if (role === 'PROFESSOR') {
    return NextResponse.json({ professors: users });
  }
  return NextResponse.json({ users });
}

// POST: Create a new user (admins only)
export async function POST(req: Request) {
  const adminId = await getAdminId(req);
  if (!adminId) {
    return NextResponse.json(
      { error: 'Unauthorized. Admins only.' },
      { status: 403 }
    );
  }
  const { email, password, name, role } = await req.json();
  if (!email || !password || !role) {
    return NextResponse.json(
      { error: 'Email, password, and role are required.' },
      { status: 400 }
    );
  }
  if (!['STUDENT', 'PROFESSOR', 'ADMIN'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: 'User already exists.' },
      { status: 409 }
    );
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashed, name, role },
  });

  if (role === 'PROFESSOR') {
    await prisma.professor.create({ data: { userId: user.id } });
  } else if (role === 'STUDENT') {
    await prisma.student.create({ data: { userId: user.id } });
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      oldValue: undefined,
      newValue: user,
    },
  });
  return NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email, role: user.role },
  });
}
