import { format } from 'date-fns';
import Link from 'next/link';
import { type PendingRequestsSummary } from '@/server/queries/requests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatShiftSlotLabel } from '@/lib/shift-slots';

type PendingRequestsProps = {
  data: PendingRequestsSummary;
};

const STATUS_BADGE: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  OPEN: 'warning',
  UNDER_REVIEW: 'warning',
  APPROVED: 'success',
  DECLINED: 'danger',
  CANCELLED: 'default',
};

export function PendingRequests({ data }: PendingRequestsProps) {
  return (
    <Card className="border border-border/80 bg-card/95 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Unavailability workflow</CardTitle>
          <p className="text-sm text-muted-foreground">Track pending submissions and recent decisions.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/requests">Manage requests</Link>
        </Button>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <section>
          <SectionHeader title="Pending reviews" count={data.pending.length} />
          <div className="space-y-3">
            {data.pending.length === 0 ? (
              <EmptyState message="No pending unavailability requests." />
            ) : (
              data.pending.map((item) => (
                <article
                  key={item.id}
                  className="rounded-lg border border-border/70 bg-muted/50 p-3 text-sm shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{item.employee}</p>
                    <Badge variant="outline" className="text-xs uppercase">
                      {formatShiftSlotLabel(item.shiftSlot)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(item.date, 'EEE, MMM d yyyy')}
                  </p>
                  {item.reason ? (
                    <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
                  ) : null}
                  {item.documentUrl ? (
                    <a
                      className="mt-1 inline-block text-xs text-primary hover:underline"
                      href={item.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View attachment
                    </a>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>
        <section>
          <SectionHeader title="Recent decisions" count={data.recent.length} />
          <div className="space-y-3">
            {data.recent.length === 0 ? (
              <EmptyState message="No recent approvals or declines." />
            ) : (
              data.recent.map((item) => (
                <article
                  key={item.id}
                  className="rounded-lg border border-border/70 bg-muted/50 p-3 text-sm shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{item.employee}</p>
                    <Badge variant={STATUS_BADGE[item.status] ?? 'default'} className="capitalize">
                      {item.status.toLowerCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(item.date, 'EEE, MMM d yyyy')} · {formatShiftSlotLabel(item.shiftSlot)}
                  </p>
                  {item.reviewNote ? (
                    <p className="mt-1 text-xs text-muted-foreground">Note: {item.reviewNote}</p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <Badge variant="outline">{count}</Badge>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-xs text-muted-foreground">
      {message}
    </div>
  );
}
