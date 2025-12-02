"use client";

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Filter } from 'lucide-react';
import { toast } from 'sonner';
import type { EmployeeDirectoryRow, EmployeeFilterState } from '@/types/employees';
import { EmployeeTable } from '@/components/employees/employee-table';
import { Button } from '@/components/ui/button';
import { EmployeeFormDialog } from '@/components/employees/employee-form-dialog';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import type { EmployeeMutationInput } from '@/lib/validations/employees';
import { EmployeeFilterDialog } from '@/components/employees/employee-filter-dialog';
import { EmployeeDetailDialog } from '@/components/employees/employee-detail-dialog';

type EmployeeDirectoryClientProps = {
  initialData: EmployeeDirectoryRow[];
};

export function EmployeeDirectoryClient({
  initialData,
}: EmployeeDirectoryClientProps) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<EmployeeFilterState>({});
  const [activeEmployee, setActiveEmployee] = useState<
    EmployeeDirectoryRow | undefined
  >(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<
    EmployeeDirectoryRow | undefined
  >(undefined);
  const [detailTarget, setDetailTarget] = useState<EmployeeDirectoryRow | undefined>(undefined);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const normalizedFilters = useMemo(
    () => ({
      search: filters.search?.trim() || undefined,
      role: filters.role || undefined,
      status: filters.status || undefined,
      employmentType: filters.employmentType || undefined,
      skill: filters.skill?.trim() || undefined,
    }),
    [filters],
  );

  const queryKey = useMemo(() => ['employees', normalizedFilters], [normalizedFilters]);

  const { data: employees = initialData, isFetching } = useQuery<EmployeeDirectoryRow[]>({
    queryKey,
    queryFn: () => fetchEmployees(normalizedFilters),
    // Use seeded data only for the default unfiltered view; let filtered
    // queries load from the server to avoid showing stale rows.
    initialData: Object.keys(normalizedFilters).length === 0 ? initialData : undefined,
    refetchOnMount: 'always',
  });

  const createMutation = useMutation({
    mutationFn: (payload: EmployeeMutationInput) =>
      mutateEmployee("POST", payload),
    onSuccess: async () => {
      toast.success("Employee added");
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: () => toast.error("Failed to add employee"),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: EmployeeMutationInput) =>
      mutateEmployee("PATCH", payload),
    onSuccess: async () => {
      toast.success("Employee updated");
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: () => toast.error("Failed to update employee"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch("/api/employees", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        throw new Error("Failed to delete employee");
      }
    },
    onSuccess: async () => {
      toast.success("Employee removed");
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: () => toast.error("Failed to delete employee"),
  });

  const handleCreate = () => {
    setActiveEmployee(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (employee: EmployeeDirectoryRow) => {
    setActiveEmployee(employee);
    setIsFormOpen(true);
  };

  const handleDelete = (employee: EmployeeDirectoryRow) => {
    setDeleteTarget(employee);
  };

  const resetFilters = () => setFilters({});

  const handleSubmit = async (data: EmployeeMutationInput) => {
    if (activeEmployee) {
      await updateMutation.mutateAsync({ ...data, id: activeEmployee.id });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Button onClick={handleCreate}>Add employee</Button>
        <Button variant="outline" onClick={() => setIsFilterOpen(true)}>
          <Filter className="mr-2 size-4" />
          Filters
        </Button>
      </div>
      <EmployeeTable
        rows={employees}
        isLoading={isFetching}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDetail={(employee) => setDetailTarget(employee)}
      />

      <EmployeeFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        employee={activeEmployee}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <EmployeeFilterDialog
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        value={filters}
        onApply={(value) =>
          setFilters({
            search: value.search?.trim() || undefined,
            role: value.role || undefined,
            status: value.status || undefined,
            employmentType: value.employmentType || undefined,
            skill: value.skill?.trim() || undefined,
          })
        }
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title="Remove employee"
        description="This employee will lose access to the backoffice."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
            setDeleteTarget(undefined);
          }
        }}
      />

      <EmployeeDetailDialog
        open={Boolean(detailTarget)}
        onOpenChange={(open) => !open && setDetailTarget(undefined)}
        employee={detailTarget}
      />
    </div>
  );
}

async function fetchEmployees(
  filters: EmployeeFilterState
): Promise<EmployeeDirectoryRow[]> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.role) params.set('role', filters.role);
  if (filters.status) params.set('status', filters.status);
  if (filters.employmentType) params.set('employmentType', filters.employmentType);
  if (filters.skill) params.set('skill', filters.skill);

  const response = await fetch(`/api/employees?${params.toString()}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error("Failed to fetch employees");
  }
  const json = await response.json();
  return json.data ?? [];
}

async function mutateEmployee(
  method: "POST" | "PATCH",
  payload: EmployeeMutationInput
) {
  const response = await fetch("/api/employees", {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to save employee");
  }

  return response.json();
}
