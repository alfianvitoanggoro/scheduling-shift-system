import { RequestStatus, ShiftSlot } from '@prisma/client';

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
