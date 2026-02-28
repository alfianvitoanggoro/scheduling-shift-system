"use client";

import { format } from 'date-fns';
import { Info, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ShiftListItem } from '@/types/shifts';
import { useSession } from '@/components/auth/session-provider';
import { formatShiftSlotLabel } from '@/lib/shift-slots';

type ShiftTableProps = {
  isLoading: boolean;
  data: ShiftListItem[];
  onEdit: (shift: ShiftListItem) => void;
  onDelete: (shift: ShiftListItem) => void;
  onDetail: (shift: ShiftListItem) => void;
};

const statusLabel: Record<string, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  CANCELLED: 'Cancelled',
};

export function ShiftTable({ data, isLoading, onEdit, onDelete, onDetail }: ShiftTableProps) {
  const { user } = useSession();
  const isAdmin = user?.role === 'ADMIN';
  return (
    <div className="overflow-hidden rounded-lg border border-border/70 bg-card/90 shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shift</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assignees</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Loading shifts...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No shifts match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              data.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell>
                    <p className="font-medium">{formatShiftSlotLabel(shift.shiftSlot)}</p>
                    {shift.notes ? (
                      <p className="text-xs text-muted-foreground">{shift.notes}</p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      {format(shift.start, 'MMM d, yyyy HH:mm')} – {format(shift.end, 'HH:mm')}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {statusLabel[shift.status] ?? shift.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {shift.assignees.length === 0 ? (
                      <span className="text-muted-foreground">Unassigned</span>
                    ) : (
                      shift.assignees.map((assignee) => assignee.name ?? 'Unassigned').join(', ')
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => onDetail(shift)}>
                        <Info className="size-4" />
                        <span className="sr-only">View detail</span>
                      </Button>
                      {isAdmin ? (
                        <>
                          <Button variant="outline" size="icon" onClick={() => onEdit(shift)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => onDelete(shift)}>
                            <Trash2 className="size-4 text-red-500" />
                          </Button>
                        </>
                      ) : null}
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
