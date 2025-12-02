"use client";

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ShiftTable } from '@/components/shifts/shift-table';
import { ShiftFormDialog } from '@/components/shifts/shift-form-dialog';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { ShiftFilterDialog } from '@/components/shifts/shift-filter-dialog';
import { ShiftDetailDialog } from '@/components/shifts/shift-detail-dialog';
import type { ShiftListItem } from '@/types/shifts';
import type { ShiftMutationInput } from '@/lib/validations/shifts';
import type { ShiftFilterState } from '@/lib/validations/shifts';
import { useSession } from '@/components/auth/session-provider';

type ShiftPlannerClientProps = {
  initialData: ShiftListItem[];
  employees?: { id: number; name: string | null }[];
};

export function ShiftPlannerClient({ initialData, employees = [] }: ShiftPlannerClientProps) {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const isAdmin = user?.role === 'ADMIN';
  const [filters, setFilters] = useState<ShiftFilterState>({ status: [] });
  const [activeShift, setActiveShift] = useState<ShiftListItem | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ShiftListItem | undefined>(undefined);
  const [detailTarget, setDetailTarget] = useState<ShiftListItem | undefined>(undefined);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const normalizedFilters = useMemo(
    () => ({
      shiftSlot: filters.shiftSlot || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      assigneeId: isAdmin ? filters.assigneeId || undefined : undefined,
      status: (filters.status || []).filter(Boolean),
    }),
    [filters, isAdmin],
  );

  const queryKey = useMemo(() => ['shifts', normalizedFilters], [normalizedFilters]);

  const { data: shifts = initialData, isFetching } = useQuery<ShiftListItem[]>({
    queryKey,
    queryFn: () => fetchShifts(normalizedFilters),
    initialData: normalizedFilters.status.length === 0 &&
      !normalizedFilters.shiftSlot &&
      !normalizedFilters.from &&
      !normalizedFilters.to &&
      !normalizedFilters.assigneeId
      ? initialData
      : undefined,
    refetchOnMount: 'always',
  });

  const createMutation = useMutation({
    mutationFn: (payload: ShiftMutationInput) => mutateShift('POST', payload),
    onSuccess: async () => {
      toast.success('Shift created');
      await queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
    onError: () => toast.error('Failed to create shift'),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: ShiftMutationInput) => mutateShift('PATCH', payload),
    onSuccess: async () => {
      toast.success('Shift updated');
      await queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
    onError: () => toast.error('Failed to update shift'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch('/api/shifts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        throw new Error('Failed to delete shift');
      }
    },
    onSuccess: async () => {
      toast.success('Shift deleted');
      await queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
    onError: () => toast.error('Failed to delete shift'),
  });

  const handleCreate = () => {
    if (!isAdmin) return;
    setActiveShift(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (shift: ShiftListItem) => {
    if (!isAdmin) return;
    setActiveShift(shift);
    setIsFormOpen(true);
  };

  const handleDelete = (shift: ShiftListItem) => {
    if (!isAdmin) return;
    setDeleteTarget(shift);
  };

  const handleSubmit = async (data: ShiftMutationInput) => {
    if (activeShift) {
      await updateMutation.mutateAsync({ ...data, id: activeShift.id });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setIsFilterOpen(true)}>
          <Filter className="mr-2 size-4" />
          Filters
        </Button>
        {isAdmin ? <Button onClick={handleCreate}>Create shift</Button> : null}
      </div>
      <ShiftTable
        data={shifts}
        isLoading={isFetching}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDetail={(shift) => setDetailTarget(shift)}
      />

      {isAdmin ? (
        <>
      <ShiftFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        shift={activeShift}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

          <ConfirmDialog
            open={Boolean(deleteTarget)}
            onOpenChange={(open) => !open && setDeleteTarget(undefined)}
            title="Delete shift"
            description="Are you sure you want to delete this shift? This action cannot be undone."
            confirmLabel="Delete"
            destructive
            onConfirm={() => {
              if (deleteTarget) {
                deleteMutation.mutate(deleteTarget.id);
                setDeleteTarget(undefined);
              }
            }}
          />
        </>
      ) : null}

      <ShiftFilterDialog
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        value={filters}
        onApply={setFilters}
        showEmployeeFilter={isAdmin}
        employees={employees}
      />

      <ShiftDetailDialog
        open={Boolean(detailTarget)}
        onOpenChange={(open) => !open && setDetailTarget(undefined)}
        shift={detailTarget}
      />
    </div>
  );
}

async function fetchShifts(filters: ShiftFilterState): Promise<ShiftListItem[]> {
  const params = new URLSearchParams();
  if (filters.shiftSlot) params.set('shiftSlot', filters.shiftSlot);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.assigneeId) params.set('assigneeId', String(filters.assigneeId));
  (filters.status ?? []).forEach((status) => params.append('status', status));

  const response = await fetch(`/api/shifts?${params.toString()}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch shifts');
  }
  const json = await response.json();
  return (json.data ?? []).map((item: any) => ({
    ...item,
    start: new Date(item.start),
    end: new Date(item.end),
  }));
}

async function mutateShift(method: 'POST' | 'PATCH', payload: ShiftMutationInput) {
  const response = await fetch('/api/shifts', {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to save shift');
  }

  return response.json();
}
