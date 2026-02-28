"use client";

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type PendingUnavailability = {
  id: number;
  date: string;
  shiftSlot: string;
  reason?: string | null;
  documentUrl?: string | null;
  requester: string;
};

export function UnavailabilityApprovals() {
  const { data = [], isLoading, refetch } = useQuery<PendingUnavailability[]>({
    queryKey: ['pending-unavailability'],
    queryFn: async () => {
      const res = await fetch('/api/unavailability/pending', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load pending requests');
      const json = await res.json();
      return json.data ?? [];
    },
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const [notes, setNotes] = useState<Record<number, string>>({});
  const mutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'APPROVED' | 'DECLINED' }) => {
      const response = await fetch(`/api/unavailability/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, reviewNote: notes[id] ?? '' }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error ?? 'Failed to update request');
      }
      return response.json();
    },
    onSuccess: async () => {
      toast.success('Request updated');
      await refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update request');
    },
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading approvals…</p>;
  }

  if (!data.length) {
    return <p className="text-sm text-muted-foreground">No pending unavailability requests.</p>;
  }

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.id} className="rounded-lg border border-border/60 bg-card/80 p-4 shadow-sm">
          <div className="flex flex-col gap-1 text-sm">
            <p className="font-semibold">
              {item.requester} · {format(new Date(item.date), 'EEE, MMM d yyyy')} ·{' '}
              {item.shiftSlot === 'SHIFT1' ? 'Shift 1 (08:00-17:00)' : 'Shift 2 (17:00-24:00)'}
            </p>
            {item.reason ? <p className="text-muted-foreground">{item.reason}</p> : null}
            {item.documentUrl ? (
              <a className="text-primary text-xs" href={item.documentUrl} target="_blank" rel="noreferrer">
                Supporting document
              </a>
            ) : null}
          </div>
          <div className="mt-3 space-y-2">
            <Textarea
              placeholder="Feedback (required when declining)"
              value={notes[item.id] ?? ''}
              onChange={(event) => setNotes((prev) => ({ ...prev, [item.id]: event.target.value }))}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => mutation.mutate({ id: item.id, status: 'APPROVED' })}
                disabled={mutation.isPending}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (!(notes[item.id]?.trim())) {
                    toast.error('Provide feedback when declining.');
                    return;
                  }
                  mutation.mutate({ id: item.id, status: 'DECLINED' });
                }}
                disabled={mutation.isPending}
              >
                Decline
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
