import { TrendingDown, TrendingUp } from 'lucide-react';
import { type DashboardMetric } from '@/server/queries/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type MetricGridProps = {
  metrics: DashboardMetric[];
};

export function MetricGrid({ metrics }: MetricGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => {
        const delta = metric.delta ?? 0;
        const isPositive = delta >= 0;
        const deltaLabel =
          metric.delta !== undefined
            ? new Intl.NumberFormat('en-US', {
                signDisplay: 'exceptZero',
                maximumFractionDigits: 1,
              }).format(delta)
            : null;
        return (
          <Card key={metric.id} className="border border-border/80 bg-card/95 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-semibold tracking-tight">{metric.value}</span>
                {deltaLabel ? (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
                      isPositive ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/10 text-red-600',
                    )}
                  >
                    {isPositive ? (
                      <TrendingUp className="size-3.5" aria-hidden />
                    ) : (
                      <TrendingDown className="size-3.5" aria-hidden />
                    )}
                    {deltaLabel}%
                  </span>
                ) : null}
              </div>
              {metric.helperText ? (
                <p className="mt-2 text-xs text-muted-foreground">{metric.helperText}</p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
