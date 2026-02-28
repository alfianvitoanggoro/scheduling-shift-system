import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { hashPassword, signAuthToken, AUTH_COOKIE } from '@/lib/auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { email, username, password, name } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        username,
        name,
        passwordHash: await hashPassword(password),
      },
    });

    const token = signAuthToken({ userId: user.id });
    cookies().set({
      name: AUTH_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ user: { id: user.id, email: user.email, username: user.username, name: user.name } }, { status: 201 });
  } catch (error) {
    console.error('Registration failed', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
