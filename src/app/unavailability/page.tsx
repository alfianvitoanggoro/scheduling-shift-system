import { AppShell } from "@/components/layout/app-shell";
import { UnavailabilityClient } from "@/components/unavailability/unavailability-client";

export const dynamic = "force-dynamic";

export default function UnavailabilityPage() {
  return (
    <AppShell
      title="Unavailability"
      subtitle="Request and manage unavailability dates for shift employees."
    >
      <UnavailabilityClient />
    </AppShell>
  );
}
