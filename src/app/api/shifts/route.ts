import { NextResponse } from 'next/server';
import { listShifts, createShift, updateShift, deleteShift } from '@/server/queries/shifts';
import { prisma } from '@/server/db';
import { getPayloadFromRequest } from '@/lib/auth';

async function getRequestUser(request: Request) {
  const payload = getPayloadFromRequest(request);
  if (!payload?.userId) return null;
  const userId = typeof payload.userId === 'string' ? Number(payload.userId) : (payload.userId as number);
  if (!userId || Number.isNaN(userId)) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return null;
  return { id: userId, role: user.role };
}

export async function GET(request: Request) {
  const requester = await getRequestUser(request);
  if (!requester) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const status = searchParams.getAll('status').filter(Boolean);
  const filters = {
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
    shiftSlot: (searchParams.get('shiftSlot') as ShiftSlot | null) ?? undefined,
    assigneeId: requester.role === 'ADMIN' ? Number(searchParams.get('assigneeId')) || undefined : undefined,
    status: status.length ? (status as any) : undefined,
  };

  try {
    const data = await listShifts(filters, requester.role === 'ADMIN' ? {} : { assignedToUserId: requester.id });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to load shifts', error);
    return NextResponse.json({ error: 'Failed to load shifts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const requester = await getRequestUser(request);
  if (!requester) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (requester.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const payload = await request.json();
    const data = await createShift(payload);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Failed to create shift', error);
    return NextResponse.json({ error: 'Failed to create shift' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const requester = await getRequestUser(request);
  if (!requester) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (requester.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const payload = await request.json();
    const data = await updateShift(payload);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to update shift', error);
    return NextResponse.json({ error: 'Failed to update shift' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const requester = await getRequestUser(request);
  if (!requester) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (requester.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const { id } = await request.json();
    const numericId = Number(id);
    if (!numericId || Number.isNaN(numericId)) {
      return NextResponse.json({ error: 'Shift id is required' }, { status: 400 });
    }
    await deleteShift(numericId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete shift', error);
    return NextResponse.json({ error: 'Failed to delete shift' }, { status: 400 });
  }
}
