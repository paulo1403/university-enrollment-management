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

// GET: List audit logs (admins only)
export async function GET(req: Request) {
  const adminId = await getAdminId(req);
  if (!adminId) {
    return NextResponse.json(
      { error: 'Unauthorized. Admins only.' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Math.min(
    parseInt(searchParams.get('pageSize') || '50', 10),
    200
  );
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const where: any = {};
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = new Date(startDate);
    if (endDate) where.timestamp.lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      select: {
        id: true,
        userId: true,
        action: true,
        entityType: true,
        entityId: true,
        timestamp: true,
      },
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    logs,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}
