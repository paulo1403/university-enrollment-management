import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { signJwt } from '@/lib/jwt';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required.' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { error: 'Invalid credentials.' },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json(
      { error: 'Invalid credentials.' },
      { status: 401 }
    );
  }

  if (user.twoFactorEnabled) {
    return NextResponse.json({ twoFactorRequired: true, email: user.email });
  }

  const token = signJwt({ id: user.id, email: user.email, role: user.role });
  return NextResponse.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, role: user.role },
  });
}
