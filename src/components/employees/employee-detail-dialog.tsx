"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { EmployeeDirectoryRow } from "@/types/employees";

type EmployeeDetailDialogProps = {
  open: boolean;
  employee?: EmployeeDirectoryRow;
  onOpenChange: (open: boolean) => void;
};

export function EmployeeDetailDialog({
  open,
  employee,
  onOpenChange,
}: EmployeeDetailDialogProps) {
  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="employee-detail-description">
        <DialogHeader>
          <DialogTitle>{employee.name ?? employee.email}</DialogTitle>
          <DialogDescription id="employee-detail-description">
            Detailed employee profile and status.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <DetailRow label="Email" value={employee.email} />
          <DetailRow label="Username" value={employee.username ?? '—'} />
          <DetailRow label="Role" value={employee.role.toLowerCase()} />
          <DetailRow
            label="Status"
            value={
              <Badge className="capitalize">
                {employee.status.toLowerCase()}
              </Badge>
            }
          />
          <DetailRow
            label="Employment type"
            value={
              employee.employmentType
                ? employee.employmentType.toLowerCase().replace("_", " ")
                : "—"
            }
          />
          <DetailRow
            label="Skills"
            value={employee.skills.length ? employee.skills.join(", ") : "—"}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-border/70 bg-muted/40 px-3 py-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
