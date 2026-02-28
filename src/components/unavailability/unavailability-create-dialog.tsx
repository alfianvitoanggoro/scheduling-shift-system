"use client";

import { useState } from 'react';
import { ShiftSlot } from '@prisma/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const shiftOptions = [
  { value: ShiftSlot.SHIFT1, label: 'Shift 1 (08:00 - 17:00)' },
  { value: ShiftSlot.SHIFT2, label: 'Shift 2 (17:00 - 24:00)' },
];

type CreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UnavailabilityCreateDialog({ open, onOpenChange }: CreateDialogProps) {
  const queryClient = useQueryClient();
  const [date, setDate] = useState('');
  const [shiftSlot, setShiftSlot] = useState<ShiftSlot>(ShiftSlot.SHIFT1);
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('date', date);
      formData.append('shiftSlot', shiftSlot);
      if (reason) formData.append('reason', reason);
      if (file) formData.append('document', file);

      const response = await fetch('/api/unavailability', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to submit request');
      return response.json();
    },
    onSuccess: async () => {
      toast.success('Request submitted');
      setDate('');
      setReason('');
      setFile(null);
      onOpenChange(false);
      await queryClient.invalidateQueries({ queryKey: ['unavailability'] });
    },
    onError: () => toast.error('Failed to submit request'),
  });

  const disabled = !date || mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New unavailability request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ua-modal-date">Date</Label>
              <Input id="ua-modal-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ua-modal-shift">Shift</Label>
              <Select
                id="ua-modal-shift"
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
            <Label htmlFor="ua-modal-reason">Reason (optional)</Label>
            <Textarea
              id="ua-modal-reason"
              placeholder="Why can't you take this shift?"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ua-modal-file">Supporting document (optional)</Label>
            <Input
              id="ua-modal-file"
              type="file"
              accept="image/*,application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => mutation.mutate()} disabled={disabled}>
              {mutation.isPending ? 'Submitting...' : 'Submit request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
