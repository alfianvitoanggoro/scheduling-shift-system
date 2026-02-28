import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const AUTH_COOKIE = 'shift_jwt';
const JWT_SECRET = process.env.AUTH_JWT_SECRET ?? 'dev-secret';

export { AUTH_COOKIE };

export function signAuthToken(payload: { userId: number }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyAuthToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function getTokenFromRequest(request: NextRequest | Request) {
  if ('cookies' in request) {
    // NextRequest
    // @ts-ignore
    const nextCookies = (request as NextRequest).cookies?.get?.(AUTH_COOKIE)?.value;
    if (nextCookies) return nextCookies;
  }
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(';').map((part) => part.trim());
  for (const part of parts) {
    if (part.startsWith(`${AUTH_COOKIE}=`)) {
      return part.split('=')[1];
    }
  }
  return undefined;
}

export function getPayloadFromRequest(request: NextRequest | Request): JwtPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyAuthToken(token);
}
