"use client";

import { EmploymentType, Role, UserStatus } from '@prisma/client';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { EmployeeFilterState } from '@/types/employees';

type EmployeeFilterDialogProps = {
  open: boolean;
  value: EmployeeFilterState;
  onOpenChange: (open: boolean) => void;
  onApply: (value: EmployeeFilterState) => void;
};

const roles = Object.values(Role);
const statuses = Object.values(UserStatus);
const employmentTypes = Object.values(EmploymentType);

export function EmployeeFilterDialog({ open, value, onOpenChange, onApply }: EmployeeFilterDialogProps) {
  const [draft, setDraft] = useState<EmployeeFilterState>(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleApply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  const handleReset = () => {
    const cleared: EmployeeFilterState = {};
    setDraft(cleared);
    onApply(cleared);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="employee-filter-description">
        <DialogHeader>
          <DialogTitle>Filter employees</DialogTitle>
        </DialogHeader>
        <DialogDescription id="employee-filter-description">
          Narrow the list by role, status, employment type, or search text.
        </DialogDescription>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="emp-search">Search</Label>
            <Input
              id="emp-search"
              placeholder="Search by name or email"
              value={draft.search ?? ''}
              onChange={(event) => setDraft({ ...draft, search: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emp-skill">Skill</Label>
            <Input
              id="emp-skill"
              placeholder="e.g. Customer Support"
              value={draft.skill ?? ''}
              onChange={(event) => setDraft({ ...draft, skill: event.target.value })}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="emp-role">Role</Label>
              <Select
                id="emp-role"
                value={draft.role ?? ''}
                onChange={(event) => setDraft({ ...draft, role: (event.target.value as Role) || undefined })}
              >
                <option value="">All roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role.toLowerCase()}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-status">Status</Label>
              <Select
                id="emp-status"
                value={draft.status ?? ''}
                onChange={(event) =>
                  setDraft({ ...draft, status: (event.target.value as UserStatus) || undefined })
                }
              >
                <option value="">All statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.toLowerCase()}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emp-type">Employment type</Label>
            <Select
              id="emp-type"
              value={draft.employmentType ?? ''}
              onChange={(event) =>
                setDraft({ ...draft, employmentType: (event.target.value as EmploymentType) || undefined })
              }
            >
              <option value="">All types</option>
              {employmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type.toLowerCase().replace('_', ' ')}
                </option>
              ))}
            </Select>
          </div>
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
