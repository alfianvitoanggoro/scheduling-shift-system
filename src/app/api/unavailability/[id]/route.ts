import { NextResponse } from 'next/server';
import { RequestStatus } from '@prisma/client';
import { getPayloadFromRequest } from '@/lib/auth';
import { prisma } from '@/server/db';
import { updateUnavailabilityStatus } from '@/server/queries/unavailability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteParams = {
  params: { id: string };
};

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const payload = getPayloadFromRequest(request);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reviewerId = typeof payload.userId === 'string' ? Number(payload.userId) : (payload.userId as number);
    if (!reviewerId || Number.isNaN(reviewerId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reviewer = await prisma.user.findUnique({
      where: { id: reviewerId },
      select: { role: true },
    });
    if (!reviewer || reviewer.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const status = body.status as RequestStatus;
    const reviewNote = body.reviewNote as string | undefined;

    if (!status || !['APPROVED', 'DECLINED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const requestId = Number(params.id);
    if (!requestId || Number.isNaN(requestId)) {
      return NextResponse.json({ error: 'Invalid request id' }, { status: 400 });
    }

    const updated = await updateUnavailabilityStatus(requestId, status, reviewerId, reviewNote);
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Failed to review unavailability', error);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}
