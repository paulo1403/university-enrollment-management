import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { token, password } = await req.json();
  if (!token || !password) {
    return NextResponse.json(
      { error: 'Token y nueva contraseña requeridos.' },
      { status: 400 }
    );
  }
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: { gt: new Date() },
    },
  });
  if (!user) {
    return NextResponse.json(
      { error: 'Token inválido o expirado.' },
      { status: 400 }
    );
  }
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });
  return NextResponse.json({ success: true });
}
