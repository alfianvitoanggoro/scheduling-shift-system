import { cookies } from 'next/headers';
import { AUTH_COOKIE, verifyAuthToken } from '@/lib/auth';
import { prisma } from '@/server/db';
import type { SessionUser } from '@/types/auth';

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const payload = verifyAuthToken(token);
  if (!payload?.userId) {
    return null;
  }

  const userId = typeof payload.userId === 'string' ? Number(payload.userId) : (payload.userId as number);
  if (!userId || Number.isNaN(userId)) {
    return null;
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

  return user ?? null;
}
