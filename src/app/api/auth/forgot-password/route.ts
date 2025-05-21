import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: 'Email requerido.' }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // No revelar si el usuario existe o no
    return NextResponse.json({ success: true });
  }
  // Generar token seguro
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutos
  await prisma.user.update({
    where: { email },
    data: {
      // Puedes crear un modelo PasswordResetToken si prefieres no guardar en User
      passwordResetToken: token,
      passwordResetExpires: expires,
    },
  });
  // Aquí deberías enviar el email con el link de recuperación
  // Por ahora solo devolvemos el token para pruebas
  return NextResponse.json({ success: true, token });
}
