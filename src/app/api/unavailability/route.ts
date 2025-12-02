import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { createUnavailability, listUnavailability } from '@/server/queries/unavailability';
import { ShiftSlot, RequestStatus } from '@prisma/client';
import { getPayloadFromRequest } from '@/lib/auth';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const payload = getPayloadFromRequest(request);
  if (!payload?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = typeof payload.userId === 'string' ? Number(payload.userId) : (payload.userId as number);
  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const requester = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!requester) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? undefined;
    const shiftSlotParam = searchParams.get('shiftSlot');
    const statusParam = searchParams.get('status');
    const data = await listUnavailability(requester.role === 'ADMIN' ? null : userId, {
      search,
      shiftSlot: shiftSlotParam ? (shiftSlotParam as ShiftSlot) : undefined,
      status: statusParam ? (statusParam as RequestStatus) : undefined,
      from: searchParams.get('from') ? new Date(searchParams.get('from') as string) : undefined,
      to: searchParams.get('to') ? new Date(searchParams.get('to') as string) : undefined,
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to load unavailability', error);
    return NextResponse.json({ error: 'Failed to load unavailability' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = getPayloadFromRequest(request);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = typeof payload.userId === 'string' ? Number(payload.userId) : (payload.userId as number);
    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const formData = await request.formData();
    const date = formData.get('date')?.toString();
    const shiftSlot = formData.get('shiftSlot')?.toString() as ShiftSlot;
    const reason = formData.get('reason')?.toString();
    const file = formData.get('document');

    if (!date || !shiftSlot) {
      return NextResponse.json({ error: 'date and shiftSlot are required' }, { status: 400 });
    }

    let documentUrl: string | undefined;
    if (file && file instanceof File) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadDir, { recursive: true });
      const filename = `${Date.now()}_${file.name}`;
      const filepath = path.join(uploadDir, filename);
      await fs.writeFile(filepath, buffer);
      documentUrl = `/uploads/${filename}`;
    }

    const data = await createUnavailability({
      userId,
      date: new Date(date),
      shiftSlot,
      reason,
      documentUrl,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Failed to submit unavailability', error);
    return NextResponse.json({ error: 'Failed to submit unavailability' }, { status: 500 });
  }
}

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
    const requestId = Number(body.id);
    if (!requestId || Number.isNaN(requestId)) {
      return NextResponse.json({ error: 'Invalid request id' }, { status: 400 });
    }
    const existing = await prisma.unavailabilityRequest.findUnique({ where: { id: requestId } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (existing.status !== RequestStatus.OPEN) {
      return NextResponse.json({ error: 'Only pending requests can be updated' }, { status: 400 });
    }
    const dateInput = body.date?.toString();
    const shiftSlot = body.shiftSlot as ShiftSlot | undefined;
    const reason = body.reason?.toString();
    if (!dateInput || !shiftSlot) {
      return NextResponse.json({ error: 'date and shiftSlot are required' }, { status: 400 });
    }

    const data = await prisma.unavailabilityRequest.update({
      where: { id: requestId },
      data: {
        date: new Date(dateInput),
        shiftSlot,
        reason,
      },
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to update unavailability', error);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}
