import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { UnavailabilityApprovals } from "@/components/unavailability/unavailability-approvals";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <AppShell
      title="Approval Unavailability"
      subtitle="Review and manage request of unavailability shift from employees."
    >
      <UnavailabilityApprovals />
    </AppShell>
  );
}
