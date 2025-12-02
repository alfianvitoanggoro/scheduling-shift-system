import { format } from 'date-fns';
import { type ShiftPlannerSnapshot } from '@/server/queries/shifts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatShiftSlotLabel } from '@/lib/shift-slots';

type ShiftBoardProps = {
  snapshot: ShiftPlannerSnapshot;
};

export function ShiftBoard({ snapshot }: ShiftBoardProps) {
  return (
    <div className="space-y-4">
      {snapshot.days.map((day) => (
        <Card key={day.id} className="border border-border/60 bg-card/90 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">{day.readableDate}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {format(day.date, 'MMM d, yyyy')} · {day.shifts.length} shifts
              </p>
            </div>
            <Badge variant="outline">{day.shifts.reduce((sum, shift) => sum + shift.assignments.length, 0)} assignees</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {day.shifts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
                No shifts scheduled. Add a shift to this day.
              </div>
            ) : (
              day.shifts.map((shift) => (
                <div
                  key={shift.id}
                  className="flex flex-col gap-2 rounded-md border border-border/60 bg-muted/50 p-4 text-sm transition hover:border-border"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{formatShiftSlotLabel(shift.slot)}</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {shift.status.toLowerCase()}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                    <span>
                      {format(shift.start, 'HH:mm')} – {format(shift.end, 'HH:mm')}
                    </span>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">Assignments</span>
                    {shift.assignments.length === 0 ? (
                      <span className="text-amber-600">Unassigned</span>
                    ) : (
                      <span>{shift.assignments.map((assignment) => assignment.name).join(', ')}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
