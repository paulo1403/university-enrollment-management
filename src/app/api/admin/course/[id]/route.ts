import { NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';

/**
 * IMPORTANT: This file is a temporary adapter for backward compatibility.
 *
 * This file redirects requests from the old [id] route to the new [courseId] route.
 *
 * Once the application is fully tested, this file should be removed to avoid
 * the Next.js error: "You cannot use different slug names for the same dynamic path"
 */

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

// This file redirects requests from the old [id] route to the new [courseId] route
async function forwardRequest(req: Request, id: string, method: string) {
  // Construct the new URL using the courseId format
  const url = new URL(req.url);
  const newUrl = new URL(`/api/admin/course/${id}`, url.origin);

  // Forward the request to the new endpoint with the same method and headers
  const response = await fetch(newUrl, {
    method: method,
    headers: req.headers,
    body: method !== 'GET' ? req.body : undefined,
  });

  return response;
}

// GET: Get a specific course by id
export async function GET(
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
  return forwardRequest(req, id, 'GET');
}

// PUT: Update a course
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
  return forwardRequest(req, id, 'PUT');
}

// DELETE: Delete a course
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
  return forwardRequest(req, id, 'DELETE');
}
