"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EmploymentType, Role, UserStatus } from '@prisma/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { EmployeeDirectoryRow } from '@/types/employees';
import { employeeMutationSchema, type EmployeeMutationInput } from '@/lib/validations/employees';

type EmployeeFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EmployeeMutationInput) => Promise<void>;
  employee?: EmployeeDirectoryRow;
  isSubmitting: boolean;
};

const roles = Object.values(Role);
const statuses = Object.values(UserStatus);
const employmentTypes = Object.values(EmploymentType);

export function EmployeeFormDialog({ open, onOpenChange, onSubmit, employee, isSubmitting }: EmployeeFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeMutationInput>({
    resolver: zodResolver(employeeMutationSchema),
    defaultValues: {
      role: Role.EMPLOYEE,
      status: UserStatus.ACTIVE,
      employmentType: EmploymentType.FULL_TIME,
      skills: [],
    },
  });

  useEffect(() => {
    if (employee) {
      reset({
        id: employee.id,
        name: employee.name ?? '',
        email: employee.email,
        username: employee.username ?? '',
        role: employee.role,
        status: employee.status,
        employmentType: employee.employmentType ?? EmploymentType.FULL_TIME,
        skills: employee.skills,
      });
    } else {
      reset({
        name: '',
        email: '',
        username: '',
        role: Role.EMPLOYEE,
        status: UserStatus.ACTIVE,
        employmentType: EmploymentType.FULL_TIME,
        skills: [],
      });
    }
  }, [employee, reset]);

  const submitHandler = handleSubmit(async (data) => {
    await onSubmit({
      ...data,
      timezone: 'UTC',
    });
    onOpenChange(false);
  });

  const title = employee ? 'Edit employee' : 'Add employee';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="employee-form-dialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submitHandler}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="employee-name">Name</Label>
              <Input
                id="employee-name"
                placeholder="Full name"
                {...register("name")}
              />
              {errors.name ? (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="employee-email">Email</Label>
              <Input
                id="employee-email"
                type="email"
                placeholder="email@company.com"
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="employee-username">Username</Label>
            <Input
              id="employee-username"
              placeholder="username"
              {...register('username')}
            />
            {errors.username ? (
              <p className="text-xs text-red-500">{errors.username.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="employee-role">Role</Label>
              <Select id="employee-role" {...register("role")}>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role.toLowerCase()}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="employee-status">Status</Label>
              <Select id="employee-status" {...register("status")}>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.toLowerCase()}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="employee-employment">Employment type</Label>
            <Select id="employee-employment" {...register("employmentType")}>
              {employmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type.toLowerCase().replace("_", " ")}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="employee-skills">Skills (comma separated)</Label>
            <Input
              id="employee-skills"
              placeholder="Customer Support, Live Chat"
              {...register("skills", {
                setValueAs: (value) =>
                  typeof value === "string"
                    ? value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean)
                    : value,
              })}
            />
            {errors.skills ? (
              <p className="text-xs text-red-500">{errors.skills.message as string}</p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
