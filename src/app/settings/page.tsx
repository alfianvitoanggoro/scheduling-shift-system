import { AppShell } from '@/components/layout/app-shell';
import { ProfileForm } from '@/components/settings/profile-form';
import { PasswordForm } from '@/components/settings/password-form';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return (
    <AppShell title="Account settings" subtitle="Manage your profile and credentials.">
      <div className="space-y-8">
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Profile</h2>
          <p className="text-sm text-muted-foreground">Update your personal details and contact information.</p>
          <div className="mt-4">
            <ProfileForm />
          </div>
        </section>
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Password</h2>
          <p className="text-sm text-muted-foreground">Ensure your account stays secure.</p>
          <div className="mt-4">
            <PasswordForm />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
