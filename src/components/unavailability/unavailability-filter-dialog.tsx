"use client";

import { useEffect, useState } from 'react';
import { ShiftSlot, RequestStatus } from '@prisma/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export type UnavailabilityFilters = {
  search?: string;
  shiftSlot?: ShiftSlot;
  status?: RequestStatus;
  from?: string;
  to?: string;
};

type FilterDialogProps = {
  open: boolean;
  value: UnavailabilityFilters;
  onOpenChange: (open: boolean) => void;
  onApply: (value: UnavailabilityFilters) => void;
};

export function UnavailabilityFilterDialog({ open, value, onOpenChange, onApply }: FilterDialogProps) {
  const [draft, setDraft] = useState<UnavailabilityFilters>(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleApply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  const handleReset = () => {
    onApply({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filter requests</DialogTitle>
          <DialogDescription>Search by reason, shift, or status.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ua-filter-search">Search</Label>
            <Input
              id="ua-filter-search"
              placeholder="Reason or notes"
              value={draft.search ?? ''}
              onChange={(event) => setDraft({ ...draft, search: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ua-filter-shift">Shift</Label>
            <Select
              id="ua-filter-shift"
              value={draft.shiftSlot ?? ''}
              onChange={(event) =>
                setDraft({ ...draft, shiftSlot: (event.target.value as ShiftSlot) || undefined })
              }
            >
              <option value="">All shifts</option>
              <option value={ShiftSlot.SHIFT1}>Shift 1</option>
              <option value={ShiftSlot.SHIFT2}>Shift 2</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ua-filter-status">Status</Label>
            <Select
              id="ua-filter-status"
              value={draft.status ?? ''}
              onChange={(event) =>
                setDraft({ ...draft, status: (event.target.value as RequestStatus) || undefined })
              }
            >
              <option value="">All statuses</option>
              <option value={RequestStatus.OPEN}>Pending</option>
              <option value={RequestStatus.APPROVED}>Approved</option>
              <option value={RequestStatus.DECLINED}>Declined</option>
            </Select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ua-filter-from">From</Label>
              <Input
                id="ua-filter-from"
                type="date"
                value={draft.from ?? ''}
                onChange={(event) => setDraft({ ...draft, from: event.target.value || undefined })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ua-filter-to">To</Label>
              <Input
                id="ua-filter-to"
                type="date"
                value={draft.to ?? ''}
                onChange={(event) => setDraft({ ...draft, to: event.target.value || undefined })}
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleApply}>Apply filters</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
