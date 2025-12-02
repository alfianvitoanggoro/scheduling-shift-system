import { addDays, eachDayOfInterval, endOfDay, formatISO, startOfDay } from 'date-fns';
import { RequestStatus, Role, ShiftSlot, ShiftStatus, UserStatus, type Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { shiftFiltersSchema, shiftMutationSchema, type ShiftFiltersInput, type ShiftMutationInput } from '@/lib/validations/shifts';
import type { ShiftListItem, ShiftPlannerShift } from '@/types/shifts';
import { deriveShiftSlotFromDate, getShiftWindow } from '@/lib/shift-slots';

export type ShiftPlannerDay = {
  id: string;
  date: Date;
  readableDate: string;
  shifts: ShiftPlannerShift[];
};

export type ShiftPlannerSnapshot = {
  range: { start: Date; end: Date };
  days: ShiftPlannerDay[];
};

const SHIFT_INCLUDE = {
  assignments: {
    include: {
      user: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.ShiftInclude;

const FALLBACK_SNAPSHOT: ShiftPlannerSnapshot = {
  range: {
    start: startOfDay(new Date()),
    end: addDays(startOfDay(new Date()), 6),
  },
  days: [
    {
      id: formatISO(startOfDay(new Date()), { representation: 'date' }),
      date: startOfDay(new Date()),
      readableDate: 'Today',
      shifts: [],
    },
  ],
};

const mapShiftRecord = (shift: Prisma.ShiftGetPayload<{ include: typeof SHIFT_INCLUDE }>): ShiftListItem => ({
  id: shift.id,
  shiftSlot: shift.shiftSlot,
  start: shift.start,
  end: shift.end,
  status: shift.status,
  notes: shift.notes,
  assignees: shift.assignments.map((assignment) => ({
    id: assignment.userId,
    name: assignment.user?.name,
  })),
  primaryAssigneeId: shift.assignments.find((a) => a.role === 'PRIMARY')?.userId,
});

type ShiftQueryOptions = {
  assignedToUserId?: number;
};

export async function listShifts(
  rawFilters: Partial<ShiftFiltersInput> = {},
  options: ShiftQueryOptions = {},
): Promise<ShiftListItem[]> {
  const filters = shiftFiltersSchema.parse({
    ...rawFilters,
    status: rawFilters.status?.filter(Boolean),
  });

  const where: Prisma.ShiftWhereInput = {
    ...(filters.shiftSlot ? { shiftSlot: filters.shiftSlot } : {}),
    ...(filters.status && filters.status.length ? { status: { in: filters.status } } : {}),
    ...(filters.from || filters.to
      ? {
          start: {
            ...(filters.from ? { gte: new Date(filters.from) } : {}),
            ...(filters.to ? { lte: new Date(filters.to) } : {}),
          },
        }
      : {}),
    ...(options.assignedToUserId || filters.assigneeId
      ? {
          assignments: {
            some: {
              userId: options.assignedToUserId ?? filters.assigneeId,
            },
          },
        }
      : {}),
  };

  const shifts = await prisma.shift.findMany({
    where,
    orderBy: [{ start: 'asc' }],
    include: SHIFT_INCLUDE,
  });

  return shifts.map(mapShiftRecord);
}

export async function createShift(rawInput: ShiftMutationInput): Promise<ShiftListItem> {
  const data = shiftMutationSchema.parse(rawInput);
  const { start, end } = getShiftWindow(data.date, data.shiftSlot);
  const shift = await prisma.shift.create({
    data: {
      shiftSlot: data.shiftSlot,
      start,
      end,
      status: data.status,
      notes: data.notes ?? undefined,
      assignments: data.assigneeId
        ? {
            create: {
              userId: data.assigneeId,
              role: 'PRIMARY',
            },
          }
        : undefined,
    },
    include: SHIFT_INCLUDE,
  });

  return mapShiftRecord(shift);
}

export async function updateShift(rawInput: ShiftMutationInput & { id: number }): Promise<ShiftListItem> {
  const data = shiftMutationSchema.parse(rawInput);
  if (!data.id) {
    throw new Error('Shift id is required');
  }
  const { start, end } = getShiftWindow(data.date, data.shiftSlot);

  const shift = await prisma.shift.update({
    where: { id: data.id },
    data: {
      shiftSlot: data.shiftSlot,
      start,
      end,
      status: data.status,
      notes: data.notes ?? undefined,
      ...(data.assigneeId
        ? {
            assignments: {
              deleteMany: {},
              create: {
                userId: data.assigneeId,
                role: 'PRIMARY',
              },
            },
          }
        : {}),
    },
    include: SHIFT_INCLUDE,
  });

  return mapShiftRecord(shift);
}

export async function deleteShift(id: number) {
  await prisma.shiftAssignment.deleteMany({ where: { shiftId: id } });
  await prisma.shift.delete({ where: { id } });
}

export async function recommendAssignees(input: { date: Date; shiftSlot: ShiftSlot }) {
  const { start, end } = getShiftWindow(input.date, input.shiftSlot);
  const windowStart = addDays(startOfDay(start), -56);
  const windowEnd = endOfDay(start);
  const targetWeekday = start.getDay();
  const dayStart = startOfDay(start);
  const dayEnd = endOfDay(start);

  const [recentAssignments, busy, unavailability, sameDayAssignments] = await Promise.all([
    prisma.shiftAssignment.findMany({
      where: {
        role: 'PRIMARY',
        shift: {
          start: { gte: windowStart, lte: windowEnd },
        },
      },
      select: { userId: true, shift: { select: { start: true } } },
    }),
    prisma.shiftAssignment.findMany({
      where: {
        shift: {
          start: { lt: end },
          end: { gt: start },
        },
      },
      select: { userId: true },
    }),
    prisma.unavailabilityRequest.findMany({
      where: {
        date: {
          gte: startOfDay(start),
          lte: endOfDay(start),
        },
        shiftSlot: input.shiftSlot,
        status: { in: [RequestStatus.OPEN, RequestStatus.UNDER_REVIEW, RequestStatus.APPROVED] },
      },
      select: { userId: true },
    }),
    prisma.shiftAssignment.groupBy({
      by: ['userId'],
      where: {
        shift: {
          start: { gte: dayStart, lte: dayEnd },
        },
      },
      _count: { _all: true },
    }),
  ]);

  const unavailableUsers = new Set<number>(busy.map((b) => b.userId));
  const unavailabilityUsers = new Set<number>(unavailability.map((item) => item.userId));

  const sameDayMap = new Map<number, number>(
    sameDayAssignments.map((assignment) => [assignment.userId, assignment._count._all]),
  );

  const frequencyMap = new Map<number, number>();
  for (const assignment of recentAssignments) {
    const shiftDate = assignment.shift.start;
    if (shiftDate.getDay() !== targetWeekday) {
      continue;
    }
    const slot = deriveShiftSlotFromDate(shiftDate);
    if (slot !== input.shiftSlot) {
      continue;
    }
    frequencyMap.set(assignment.userId, (frequencyMap.get(assignment.userId) ?? 0) + 1);
  }

  const orderedFrequent = Array.from(frequencyMap.entries())
    .filter(([userId]) => !unavailableUsers.has(userId))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const frequentUsers = orderedFrequent.length
    ? await prisma.user.findMany({
        where: { id: { in: orderedFrequent.map(([userId]) => userId) }, role: Role.EMPLOYEE },
        select: { id: true, name: true },
      })
    : [];

  const frequent = orderedFrequent
    .map(([userId, score]) => {
      const user = frequentUsers.find((candidate) => candidate.id === userId);
      if (!user) return null;
      const sameDayCount = sameDayMap.get(user.id) ?? 0;
      return {
        id: user.id,
        name: user.name ?? 'Unknown',
        score,
        hasSameDayShift: sameDayCount > 0,
        sameDayCount,
        hasUnavailability: unavailabilityUsers.has(user.id),
      };
    })
    .filter(Boolean) as {
      id: number;
      name: string;
      score: number;
      hasSameDayShift: boolean;
      sameDayCount: number;
      hasUnavailability: boolean;
    }[];

  const frequentSet = new Set(frequent.map((entry) => entry.id));

  const availableCandidates = await prisma.user.findMany({
    where: {
      status: UserStatus.ACTIVE,
      role: Role.EMPLOYEE,
      id: { notIn: Array.from(unavailableUsers) },
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
    take: 12,
  });

  const available = availableCandidates
    .filter((candidate) => !frequentSet.has(candidate.id))
    .map((candidate) => {
      const sameDayCount = sameDayMap.get(candidate.id) ?? 0;
      return {
        id: candidate.id,
        name: candidate.name ?? 'Unknown',
        hasSameDayShift: sameDayCount > 0,
        sameDayCount,
        hasUnavailability: unavailabilityUsers.has(candidate.id),
      };
    });

  return { frequent, available };
}

export async function getShiftPlannerSnapshot(windowDays = 7): Promise<ShiftPlannerSnapshot> {
  try {
    const start = startOfDay(new Date());
    const end = endOfDay(addDays(start, windowDays - 1));

    const shifts = await prisma.shift.findMany({
      where: {
        start: { gte: start },
        end: { lte: end },
      },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ start: 'asc' }],
    });

    const days = eachDayOfInterval({ start, end }).map<ShiftPlannerDay>((date) => {
      const dateId = formatISO(date, { representation: 'date' });
      const dayShifts = shifts.filter(
        (shift) => formatISO(shift.start, { representation: 'date' }) === dateId,
      );
      return {
        id: dateId,
        date,
        readableDate: new Intl.DateTimeFormat('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        }).format(date),
        shifts: dayShifts.map((shift) => ({
          id: shift.id,
          slot: shift.shiftSlot,
          start: shift.start,
          end: shift.end,
          status: shift.status,
          assignments: shift.assignments.map((assignment) => ({
            id: assignment.id,
            name: assignment.user?.name ?? 'Unassigned',
            role: assignment.role,
          })),
        })),
      };
    });

    return {
      range: { start, end },
      days,
    };
  } catch (error) {
    console.warn('Unable to load shift planner snapshot', error);
    return FALLBACK_SNAPSHOT;
  }
}
