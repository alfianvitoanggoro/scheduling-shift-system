import { prisma } from "@/server/db";
import { RequestStatus, ShiftSlot } from "@prisma/client";

export type UnavailabilityRequestDTO = {
  id: number;
  userId: number;
  requester: string;
  date: Date;
  shiftSlot: ShiftSlot;
  reason?: string | null;
  documentUrl?: string | null;
  status: RequestStatus;
  reviewNote?: string | null;
};

type UnavailabilityFilters = {
  search?: string;
  shiftSlot?: ShiftSlot;
  status?: RequestStatus;
  from?: Date;
  to?: Date;
};

export async function listUnavailability(
  userId: number | null,
  filters: UnavailabilityFilters = {},
): Promise<UnavailabilityRequestDTO[]> {
  const requests = await prisma.unavailabilityRequest.findMany({
    where: {
      ...(userId ? { userId } : {}),
      ...(filters.shiftSlot ? { shiftSlot: filters.shiftSlot } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search
        ? {
            reason: { contains: filters.search, mode: "insensitive" },
          }
        : {}),
      ...(filters.from || filters.to
        ? {
            date: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return requests.map((req) => ({
    id: req.id,
    userId: req.userId,
    requester: req.user?.name ?? req.user?.email ?? "Unknown",
    date: req.date,
    shiftSlot: req.shiftSlot,
    reason: req.reason,
    documentUrl: req.documentUrl,
    status: req.status,
    reviewNote: req.reviewNote,
  }));
}

export async function createUnavailability(input: {
  userId: number;
  date: Date;
  shiftSlot: ShiftSlot;
  reason?: string;
  documentUrl?: string;
}): Promise<UnavailabilityRequestDTO> {
  const created = await prisma.unavailabilityRequest.create({
    data: {
      userId: input.userId,
      date: input.date,
      shiftSlot: input.shiftSlot,
      reason: input.reason,
      documentUrl: input.documentUrl,
      status: RequestStatus.OPEN,
    },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return {
    id: created.id,
    userId: created.userId,
    requester: created.user?.name ?? created.user?.email ?? "Unknown",
    date: created.date,
    shiftSlot: created.shiftSlot,
    reason: created.reason,
    documentUrl: created.documentUrl,
    status: created.status,
    reviewNote: created.reviewNote,
  };
}

export async function updateUnavailabilityStatus(
  id: number,
  status: RequestStatus,
  reviewedById?: number,
  reviewNote?: string,
) {
  return prisma.unavailabilityRequest.update({
    where: { id },
    data: { status, reviewedById, reviewNote },
  });
}

export async function listPendingUnavailability() {
  const requests = await prisma.unavailabilityRequest.findMany({
    where: { status: RequestStatus.OPEN },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return requests.map((request) => ({
    id: request.id,
    date: request.date,
    shiftSlot: request.shiftSlot,
    reason: request.reason,
    documentUrl: request.documentUrl,
    status: request.status,
    reviewNote: request.reviewNote,
    requester: request.user.name ?? request.user.email,
  }));
}
