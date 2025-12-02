import { RequestStatus, ShiftSlot } from '@prisma/client';
import { prisma } from '@/server/db';

export type PendingUnavailabilitySummary = {
  id: number;
  employee: string;
  date: Date;
  shiftSlot: ShiftSlot;
  reason?: string | null;
  documentUrl?: string | null;
};

export type RecentUnavailabilityDecision = {
  id: number;
  employee: string;
  date: Date;
  shiftSlot: ShiftSlot;
  status: RequestStatus;
  reviewNote?: string | null;
  updatedAt: Date;
};

export type PendingRequestsSummary = {
  pending: PendingUnavailabilitySummary[];
  recent: RecentUnavailabilityDecision[];
};

export async function getPendingRequestsSummary(): Promise<PendingRequestsSummary> {
  try {
    const [pending, recent] = await Promise.all([
      prisma.unavailabilityRequest.findMany({
        where: { status: RequestStatus.OPEN },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { date: 'asc' },
        take: 6,
      }),
      prisma.unavailabilityRequest.findMany({
        where: { status: { in: [RequestStatus.APPROVED, RequestStatus.DECLINED] } },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 6,
      }),
    ]);

    return {
      pending: pending.map((request) => ({
        id: request.id,
        employee: request.user.name ?? request.user.email,
        date: request.date,
        shiftSlot: request.shiftSlot,
        reason: request.reason,
        documentUrl: request.documentUrl,
      })),
      recent: recent.map((request) => ({
        id: request.id,
        employee: request.user.name ?? request.user.email,
        date: request.date,
        shiftSlot: request.shiftSlot,
        status: request.status,
        reviewNote: request.reviewNote,
        updatedAt: request.updatedAt,
      })),
    };
  } catch (error) {
    console.warn('Unable to load unavailability summary', error);
    return { pending: [], recent: [] };
  }
}
