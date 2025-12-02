"use client";

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useSession } from '@/components/auth/session-provider';

export function ProfileForm() {
  const { user, refresh } = useSession();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    timezone: 'UTC',
    phone: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? '',
        username: user.username ?? '',
        email: user.email,
        timezone: user.timezone ?? 'UTC',
        phone: user.phone ?? '',
      });
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: async (payload) => {
      toast.success('Profile updated');
      if (payload?.user) {
        queryClient.setQueryData(['session-user'], payload.user);
      }
      await refresh();
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const disabled =
    mutation.isPending ||
    !form.name.trim() ||
    !form.username.trim() ||
    !form.email.trim();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={form.username}
            onChange={(event) => setForm({ ...form, username: event.target.value })}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="timezone">Timezone</Label>
        <Input
          id="timezone"
          value={form.timezone}
          onChange={(event) => setForm({ ...form, timezone: event.target.value })}
        />
      </div>
      <Button type="submit" disabled={disabled}>
        {mutation.isPending ? 'Saving...' : 'Save changes'}
      </Button>
    </form>
  );
}
