import { NextResponse } from 'next/server';
import { RequestStatus } from '@prisma/client';
import { getPayloadFromRequest } from '@/lib/auth';
import { prisma } from '@/server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const payload = getPayloadFromRequest(request);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = typeof payload.userId === 'string' ? Number(payload.userId) : (payload.userId as number);
    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requests = await prisma.unavailabilityRequest.findMany({
      where: { status: RequestStatus.OPEN },
      orderBy: { date: 'asc' },
      include: { user: { select: { name: true, email: true } } },
    });

    return NextResponse.json({
      data: requests.map((request) => ({
        id: request.id,
        date: request.date,
        shiftSlot: request.shiftSlot,
        reason: request.reason,
        documentUrl: request.documentUrl,
        requester: request.user.name ?? request.user.email,
      })),
    });
  } catch (error) {
    console.error('Failed to load pending unavailability', error);
    return NextResponse.json({ error: 'Failed to load requests' }, { status: 500 });
  }
}
