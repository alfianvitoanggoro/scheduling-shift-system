import { addDays, endOfDay, startOfDay } from 'date-fns';
import { RequestStatus, ShiftStatus } from '@prisma/client';
import { prisma } from '@/server/db';
import { formatShiftSlotLabel } from '@/lib/shift-slots';

export type DashboardMetric = {
  id: string;
  label: string;
  value: number;
  delta?: number;
  helperText?: string;
};

export type DashboardShift = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  assignees: Array<{
    id: number;
    name: string | null;
    role: string;
  }>;
  status: ShiftStatus;
};

export type DashboardAlertSeverity = 'info' | 'warning' | 'critical';

export type DashboardAlert = {
  id: string;
  title: string;
  description: string;
  severity: DashboardAlertSeverity;
  actionHref?: string;
};

export type DashboardOverview = {
  metrics: DashboardMetric[];
  upcomingShifts: DashboardShift[];
  alerts: DashboardAlert[];
};

const FALLBACK_OVERVIEW: DashboardOverview = {
  metrics: [
    { id: 'total-staff', label: 'Active staff', value: 0, helperText: 'Across all roles' },
    { id: 'shifts-week', label: 'Shifts this week', value: 0, helperText: 'Published and visible to staff' },
    { id: 'open-requests', label: 'Open availability requests', value: 0, helperText: 'Awaiting admin review' },
  ],
  upcomingShifts: [],
  alerts: [
    {
      id: 'seed-alert',
      title: 'Connect to your database',
      description: 'Configure DATABASE_URL and run migrations to see live scheduling data.',
      severity: 'info',
    },
  ],
};

export async function getDashboardOverview(): Promise<DashboardOverview> {
  try {
    const [
      activeStaff,
      publishedShifts,
      openUnavailabilityCount,
      pendingUnavailability,
      uncoveredShifts,
    ] = await Promise.all([
      prisma.user.count({
        where: { status: 'ACTIVE' },
      }),
      prisma.shift.count({
        where: {
          status: ShiftStatus.PUBLISHED,
          start: {
            gte: startOfDay(new Date()),
            lt: addDays(startOfDay(new Date()), 7),
          },
        },
      }),
      prisma.unavailabilityRequest.count({
        where: { status: RequestStatus.OPEN },
      }),
      prisma.unavailabilityRequest.findMany({
        where: { status: RequestStatus.OPEN },
        include: {
          user: { select: { name: true } },
        },
        orderBy: { date: 'asc' },
        take: 3,
      }),
      prisma.shift.findMany({
        where: {
          status: ShiftStatus.PUBLISHED,
          start: {
            gte: startOfDay(new Date()),
            lt: addDays(startOfDay(new Date()), 7),
          },
          assignments: {
            none: {},
          },
        },
        select: {
          id: true,
          start: true,
          shiftSlot: true,
        },
        take: 3,
      }),
    ]);

    const shifts = await prisma.shift.findMany({
      where: {
        status: ShiftStatus.PUBLISHED,
        start: {
          gte: startOfDay(new Date()),
          lt: endOfDay(addDays(new Date(), 3)),
        },
      },
      include: {
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
      orderBy: { start: 'asc' },
    });

    const upcomingShifts: DashboardShift[] = shifts.map((shift) => ({
      id: shift.id,
      title: formatShiftSlotLabel(shift.shiftSlot),
      start: shift.start,
      end: shift.end,
      status: shift.status,
      assignees: shift.assignments.map((assignment) => ({
        id: assignment.userId,
        name: assignment.user?.name,
        role: assignment.role,
      })),
    }));

    const alerts = [
      ...pendingUnavailability.map((request) => ({
        id: `unavailability-${request.id}`,
        title: `${request.user?.name ?? 'Team member'} needs coverage`,
        description: `${formatShiftSlotLabel(request.shiftSlot)} on ${request.date.toLocaleDateString()} is awaiting approval.`,
        severity: 'warning' as const,
        actionHref: '/requests',
      })),
      ...uncoveredShifts.map((shift) => ({
        id: `uncovered-${shift.id}`,
        title: `Unassigned ${formatShiftSlotLabel(shift.shiftSlot)}`,
        description: `Happening on ${shift.start.toLocaleDateString()} with no assignees.`,
        severity: 'critical' as const,
        actionHref: '/shifts',
      })),
    ];

    return {
      metrics: [
        {
          id: 'total-staff',
          label: 'Active staff',
          value: activeStaff,
          helperText: 'Across all roles',
        },
        {
          id: 'shifts-week',
          label: 'Shifts this week',
          value: publishedShifts,
          helperText: 'Published and visible to staff',
        },
        {
          id: 'open-requests',
          label: 'Open availability requests',
          value: openUnavailabilityCount,
          helperText: 'Awaiting admin review',
        },
      ],
      upcomingShifts,
      alerts: alerts.length > 0 ? alerts : FALLBACK_OVERVIEW.alerts,
    };
  } catch (error) {
    console.warn('Falling back to dashboard defaults', error);
    return FALLBACK_OVERVIEW;
  }
}
