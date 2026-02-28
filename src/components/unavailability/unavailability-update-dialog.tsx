"use client";

import { useEffect, useState } from 'react';
import { ShiftSlot } from '@prisma/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { UnavailabilityRequestDTO } from '@/types/unavailability';

type UpdateDialogProps = {
  request?: UnavailabilityRequestDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const shiftOptions = [
  { value: ShiftSlot.SHIFT1, label: 'Shift 1 (08:00 - 17:00)' },
  { value: ShiftSlot.SHIFT2, label: 'Shift 2 (17:00 - 24:00)' },
];

export function UnavailabilityUpdateDialog({ request, open, onOpenChange }: UpdateDialogProps) {
  const queryClient = useQueryClient();
  const [date, setDate] = useState('');
  const [shiftSlot, setShiftSlot] = useState<ShiftSlot>(ShiftSlot.SHIFT1);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (request) {
      setDate(request.date.toISOString().slice(0, 10));
      setShiftSlot(request.shiftSlot);
      setReason(request.reason ?? '');
    }
  }, [request]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!request) return;
      const response = await fetch('/api/unavailability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: request.id,
          date,
          shiftSlot,
          reason,
        }),
      });
      if (!response.ok) throw new Error('Failed to update request');
      return response.json();
    },
    onSuccess: async () => {
      toast.success('Request updated');
      await queryClient.invalidateQueries({ queryKey: ['unavailability'] });
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to update request'),
  });

  if (!request) return null;
  const disabled = !date || mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(value) => !value || !mutation.isPending ? onOpenChange(value) : null}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ua-update-date">Date</Label>
              <Input id="ua-update-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ua-update-shift">Shift</Label>
              <Select
                id="ua-update-shift"
                value={shiftSlot}
                onChange={(event) => setShiftSlot(event.target.value as ShiftSlot)}
              >
                {shiftOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ua-update-reason">Reason</Label>
            <Textarea
              id="ua-update-reason"
              placeholder="Optional reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button onClick={() => mutation.mutate()} disabled={disabled}>
              {mutation.isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
