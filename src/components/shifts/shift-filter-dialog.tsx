"use client";

import { useEffect, useState } from 'react';
import { ShiftSlot, ShiftStatus } from '@prisma/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { ShiftFilterState } from '@/lib/validations/shifts';

type ShiftFilterDialogProps = {
  open: boolean;
  value: ShiftFilterState;
  showEmployeeFilter?: boolean;
  employees?: { id: number; name: string | null }[];
  onOpenChange: (open: boolean) => void;
  onApply: (value: ShiftFilterState) => void;
};

const statuses = Object.values(ShiftStatus);
const shiftOptions = [
  { value: '', label: 'All shifts' },
  { value: ShiftSlot.SHIFT1, label: 'Shift 1 (08:00 - 17:00)' },
  { value: ShiftSlot.SHIFT2, label: 'Shift 2 (17:00 - 24:00)' },
];

export function ShiftFilterDialog({
  open,
  value,
  onOpenChange,
  onApply,
  showEmployeeFilter = false,
  employees = [],
}: ShiftFilterDialogProps) {
  const [draft, setDraft] = useState<ShiftFilterState>(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const toggleStatus = (status: ShiftStatus) => {
    const current = draft.status ?? [];
    const exists = current.includes(status);
    const updated = exists ? current.filter((item) => item !== status) : [...current, status];
    setDraft({ ...draft, status: updated });
  };

  const handleApply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  const handleReset = () => {
    const cleared: ShiftFilterState = { status: [] };
    setDraft(cleared);
    onApply(cleared);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="shift-filter-description">
        <DialogHeader>
          <DialogTitle>Filter shifts</DialogTitle>
          <DialogDescription id="shift-filter-description">
            Filter by shift, status, date range, or assignee.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="shift-slot-filter">Shift</Label>
              <select
                id="shift-slot-filter"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={draft.shiftSlot ?? ''}
                onChange={(event) =>
                  setDraft({ ...draft, shiftSlot: (event.target.value as ShiftSlot) || undefined })
                }
              >
                {shiftOptions.map((opt) => (
                  <option key={opt.value || 'all'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shift-from">From</Label>
              <input
                id="shift-from"
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={draft.from ?? ''}
                onChange={(event) => setDraft({ ...draft, from: event.target.value || undefined })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shift-to">To</Label>
              <input
                id="shift-to"
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={draft.to ?? ''}
                onChange={(event) => setDraft({ ...draft, to: event.target.value || undefined })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Status</p>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => {
                const isActive = (draft.status ?? []).includes(status);
                return (
                  <button
                    key={status}
                    type="button"
                    className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition ${
                      isActive ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                    }`}
                    onClick={() => toggleStatus(status)}
                  >
                    {status.toLowerCase()}
                  </button>
                );
              })}
            </div>
          </div>
          {showEmployeeFilter ? (
            <div className="space-y-1.5">
              <Label htmlFor="shift-employee">Employee</Label>
              <select
                id="shift-employee"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={draft.assigneeId?.toString() ?? ''}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    assigneeId: event.target.value ? Number(event.target.value) : undefined,
                  })
                }
              >
                <option value="">All employees</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name ?? `Employee #${employee.id}`}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleApply}>Apply filters</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
