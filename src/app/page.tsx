import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { UpcomingShifts } from '@/components/dashboard/upcoming-shifts';
import { AlertsPanel } from '@/components/dashboard/alerts-panel';
import { getDashboardOverview } from '@/server/queries/dashboard';
import { getPendingRequestsSummary } from '@/server/queries/requests';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const [overview, requests] = await Promise.all([
    getDashboardOverview(),
    getPendingRequestsSummary(),
  ]);

  const totalEmployees = overview.metrics.find((metric) => metric.id === 'total-staff')?.value ?? 0;
  const pendingCount = requests.pending.length;

  return (
    <AppShell
      title="Operations dashboard"
      subtitle="Monitor staffing coverage, open requests, and upcoming shifts from one surface."
      actions={null}
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard title="Total employees" value={totalEmployees} helper="Active workforce" />
          <StatCard title="Pending requests" value={pendingCount} helper="Awaiting approval" />
        </div>
        {user.role === 'ADMIN' ? (
          <AlertsPanel alerts={overview.alerts} />
        ) : (
          <UpcomingShifts items={overview.upcomingShifts} />
        )}
      </div>
    </AppShell>
  );
}

type StatCardProps = {
  title: string;
  value: number;
  helper?: string;
};

function StatCard({ title, value, helper }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value.toLocaleString()}</p>
      {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}
