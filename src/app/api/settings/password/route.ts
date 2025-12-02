import { NextResponse } from 'next/server';
import { getPayloadFromRequest } from '@/lib/auth';
import { changePassword } from '@/server/queries/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request: Request) {
  try {
    const payload = getPayloadFromRequest(request);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = typeof payload.userId === 'string' ? Number(payload.userId) : (payload.userId as number);
    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    await changePassword(userId, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to change password', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 400 });
  }
}
