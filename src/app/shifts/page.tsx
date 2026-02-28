import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { ShiftPlannerClient } from '@/components/shifts/shift-planner-client';
import { listShifts } from '@/server/queries/shifts';
import { listEmployees } from '@/server/queries/employees';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function ShiftPlannerPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const [initialData, employees] = await Promise.all([
    listShifts({}, user.role === 'ADMIN' ? {} : { assignedToUserId: user.id }),
    user.role === 'ADMIN'
      ? listEmployees().then((rows) => rows.map((row) => ({ id: row.id, name: row.name ?? row.email })))
      : Promise.resolve([]),
  ]);

  return (
    <AppShell
      title="Shift planner"
      subtitle="Plan upcoming coverage, monitor assignments, and manage staffing."
    >
      <ShiftPlannerClient initialData={initialData} employees={employees} />
    </AppShell>
  );
}
