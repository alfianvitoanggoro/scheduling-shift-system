import { differenceInMinutes, format } from 'date-fns';
import { Users } from 'lucide-react';
import { type DashboardShift } from '@/server/queries/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type UpcomingShiftsProps = {
  items: DashboardShift[];
};

const STATUS_INTENT: Record<string, 'default' | 'success' | 'warning'> = {
  PUBLISHED: 'success',
  DRAFT: 'warning',
  CANCELLED: 'default',
};

export function UpcomingShifts({ items }: UpcomingShiftsProps) {
  return (
    <Card className="border border-border/80 bg-card/95 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Upcoming shifts</CardTitle>
          <p className="text-sm text-muted-foreground">Next three days of coverage</p>
        </div>
        <Badge variant="outline">{items.length} scheduled</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No shifts found. Publish shifts to see them here.
          </div>
        ) : (
          items.map((shift) => {
            const durationMinutes = differenceInMinutes(shift.end, shift.start);
            return (
              <div
                key={shift.id}
                className="flex flex-col gap-3 rounded-lg border border-transparent bg-muted/50 p-4 transition hover:border-border"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{shift.title}</h3>
                  <Badge variant={STATUS_INTENT[shift.status] ?? 'default'}>
                    {shift.status.toLowerCase()}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    {format(shift.start, 'EEE, MMM d')} · {format(shift.start, 'HH:mm')} –{' '}
                    {format(shift.end, 'HH:mm')} ({durationMinutes} mins)
                  </span>
                  {shift.assignees.length > 0 ? (
                    <span className="inline-flex items-center gap-2">
                      <Users className="size-3.5" />
                      {shift.assignees.map((assignee) => assignee.name ?? 'Unassigned').join(', ')}
                    </span>
                  ) : (
                    <span className="text-amber-600">Unassigned</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
