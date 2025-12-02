"use client";

import { Pencil, Trash2 } from 'lucide-react';
import type { EmployeeDirectoryRow } from '@/types/employees';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Info } from 'lucide-react';

type EmployeeTableProps = {
  rows: EmployeeDirectoryRow[];
  isLoading: boolean;
  onEdit: (employee: EmployeeDirectoryRow) => void;
  onDelete: (employee: EmployeeDirectoryRow) => void;
  onDetail: (employee: EmployeeDirectoryRow) => void;
};

const roleLabel: Record<string, string> = {
  ADMIN: 'Admin',
  EMPLOYEE: 'Employee',
};

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  ACTIVE: 'success',
  INACTIVE: 'danger',
  INVITED: 'warning',
};

export function EmployeeTable({ rows, isLoading, onEdit, onDelete, onDetail }: EmployeeTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/70 bg-card/90 shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Employment type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Loading employees...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No employees found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{employee.name ?? employee.email}</p>
                    <p className="text-xs text-muted-foreground">{employee.email}</p>
                  </TableCell>
                  <TableCell>{employee.username ?? '—'}</TableCell>
                  <TableCell>{roleLabel[employee.role] ?? employee.role}</TableCell>
                  <TableCell className="capitalize">
                    {employee.employmentType ? employee.employmentType.toLowerCase().replace('_', ' ') : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[employee.status] ?? 'default'}>
                      {employee.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {employee.skills.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {employee.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => onDetail(employee)}>
                        <Info className="size-4" />
                        <span className="sr-only">View detail</span>
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => onEdit(employee)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(employee)}>
                        <Trash2 className="size-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
