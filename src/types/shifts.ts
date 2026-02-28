import { ShiftSlot, ShiftStatus } from '@prisma/client';

export type ShiftPlannerAssignment = {
  id: number;
  name: string | null;
  role: string;
};

export type ShiftPlannerShift = {
  id: number;
  slot: ShiftSlot;
  start: Date;
  end: Date;
  status: ShiftStatus;
  assignments: ShiftPlannerAssignment[];
};

export type ShiftListItem = {
  id: number;
  shiftSlot: ShiftSlot;
  start: Date;
  end: Date;
  status: ShiftStatus;
  notes?: string | null;
  assignees: { id: number; name: string | null }[];
  primaryAssigneeId?: number;
};
