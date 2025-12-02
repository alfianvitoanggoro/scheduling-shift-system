import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAuthToken, AUTH_COOKIE } from '@/lib/auth';
import { LoginForm } from '@/components/auth/login-form';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (token && verifyAuthToken(token)) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">Use your email or username and password.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
