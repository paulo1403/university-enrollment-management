import { NextResponse } from 'next/server';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function isAdmin(req: Request) {
  const role = req.headers.get('x-user-role');
  return role === 'ADMIN';
}

export async function POST(req: Request) {
  if (!(await isAdmin(req))) {
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
    data: {
      email,
      password: hashed,
      name,
      role: role as UserRole,
    },
  });

  return NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email, role: user.role },
  });
}
