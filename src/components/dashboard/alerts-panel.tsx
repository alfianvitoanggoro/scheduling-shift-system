import type { ComponentType } from 'react';
import { AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { type DashboardAlert } from '@/server/queries/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type AlertsPanelProps = {
  alerts: DashboardAlert[];
};

const ICONS: Record<DashboardAlert['severity'], ComponentType<{ className?: string }>> = {
  info: Info,
  warning: AlertCircle,
  critical: ShieldAlert,
};

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <Card className="border border-border/80 bg-card/95 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Unavailability alerts</CardTitle>
          <p className="text-sm text-muted-foreground">Stay ahead of coverage risks</p>
        </div>
        <Badge variant="outline">{alerts.length}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => {
          const Icon = ICONS[alert.severity];
          return (
            <div
              key={alert.id}
              className="flex flex-col gap-3 rounded-lg border border-border/80 bg-muted/60 p-4"
            >
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">{alert.title}</p>
              </div>
              <p className="text-sm text-muted-foreground">{alert.description}</p>
              {alert.actionHref ? (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="self-start border-dashed text-xs"
                >
                  <Link href={alert.actionHref}>Review</Link>
                </Button>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
