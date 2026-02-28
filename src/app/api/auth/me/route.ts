import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/server/db';
import { AUTH_COOKIE, verifyAuthToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const token = cookies().get(AUTH_COOKIE)?.value;
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload?.userId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const userId = typeof payload.userId === 'string' ? Number(payload.userId) : (payload.userId as number);
    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        timezone: true,
        phone: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Failed to load user', error);
    return NextResponse.json({ error: 'Failed to load user' }, { status: 500 });
  }
}
