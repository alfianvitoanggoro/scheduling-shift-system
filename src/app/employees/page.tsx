import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { EmployeeDirectoryClient } from '@/components/employees/employee-directory-client';
import { listEmployees } from '@/server/queries/employees';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    redirect('/');
  }

  const initialData = await listEmployees();

  return (
    <AppShell
      title="Employees"
      subtitle="Manage workforce assignments, availability, and skill coverage."
    >
      <EmployeeDirectoryClient initialData={initialData} />
    </AppShell>
  );
}
