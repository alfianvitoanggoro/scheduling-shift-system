import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getTokenFromRequest } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/register'];
const JWT_SECRET = process.env.AUTH_JWT_SECRET ?? 'dev-secret';
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

async function verifyToken(token: string) {
  try {
    await jwtVerify(token, SECRET_KEY);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = getTokenFromRequest(request);
  const isAuth = token ? await verifyToken(token) : false;

  const isAuthPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const isAsset =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico';
  const isAuthApi = pathname.startsWith('/api/auth/');

  if (isAsset || isAuthApi) {
    return NextResponse.next();
  }

  if (isAuthPath) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (!isAuth) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
