"use client";

import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ShiftListItem } from '@/types/shifts';
import { formatShiftSlotLabel } from '@/lib/shift-slots';

type ShiftDetailDialogProps = {
  open: boolean;
  shift?: ShiftListItem;
  onOpenChange: (open: boolean) => void;
};

export function ShiftDetailDialog({ open, shift, onOpenChange }: ShiftDetailDialogProps) {
  if (!shift) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="shift-detail-description">
        <DialogHeader>
          <DialogTitle>{formatShiftSlotLabel(shift.shiftSlot)}</DialogTitle>
          <DialogDescription id="shift-detail-description">
            Detailed shift information and assignments.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <DetailRow label="Schedule" value={`${format(shift.start, 'MMM d, yyyy HH:mm')} – ${format(shift.end, 'HH:mm')}`} />
          <DetailRow label="Status" value={<Badge className="capitalize">{shift.status.toLowerCase()}</Badge>} />
          <DetailRow label="Notes" value={shift.notes ?? '—'} />
          <DetailRow
            label="Assignees"
            value={shift.assignees.length ? shift.assignees.map((a) => a.name ?? 'Unassigned').join(', ') : 'Unassigned'}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-border/70 bg-muted/40 px-3 py-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
