import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import speakeasy from 'speakeasy';
import { signJwt } from '@/lib/jwt';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { email, code } = await req.json();
  if (!email || !code) {
    return NextResponse.json(
      { error: 'Email and 2FA code are required.' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json(
      { error: '2FA not enabled or user not found.' },
      { status: 401 }
    );
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: code,
    window: 1,
  });

  if (!verified) {
    return NextResponse.json({ error: 'Invalid 2FA code.' }, { status: 401 });
  }

  const token = signJwt({ id: user.id, email: user.email, role: user.role });
  return NextResponse.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, role: user.role },
  });
}
