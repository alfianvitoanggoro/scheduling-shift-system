"use client";

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { UnavailabilityRequestDTO } from '@/types/unavailability';
import type { UnavailabilityFilters } from '@/components/unavailability/unavailability-filter-dialog';
import { UnavailabilityUpdateDialog } from '@/components/unavailability/unavailability-update-dialog';
import { useSession } from '@/components/auth/session-provider';
import { formatShiftSlotLabel } from '@/lib/shift-slots';

type UnavailabilityListProps = {
  filters: UnavailabilityFilters;
};

const STATUS_VARIANT: Record<string, string> = {
  OPEN: 'bg-gray-100 text-gray-700 border-gray-200 capitalize',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200 capitalize',
  DECLINED: 'bg-red-50 text-red-700 border-red-200 capitalize',
};

export function UnavailabilityList({ filters }: UnavailabilityListProps) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.shiftSlot) params.set('shiftSlot', filters.shiftSlot);
  if (filters.status) params.set('status', filters.status);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);

  const { user } = useSession();
  const [detail, setDetail] = useState<UnavailabilityRequestDTO | null>(null);
  const [updateTarget, setUpdateTarget] = useState<UnavailabilityRequestDTO | null>(null);

  const { data = [], isLoading } = useQuery<UnavailabilityRequestDTO[]>({
    queryKey: ['unavailability', filters],
    queryFn: async () => {
      const res = await fetch(`/api/unavailability?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load requests');
      const json = await res.json();
      return (json.data ?? []).map((item: any) => ({
        ...item,
        date: new Date(item.date),
      }));
    },
  });

  const emptyState = !isLoading && data.length === 0;

  const sorted = useMemo(
    () =>
      [...data].sort((a, b) => {
        if (a.status === b.status) return b.date.getTime() - a.date.getTime();
        if (a.status === 'OPEN') return -1;
        if (b.status === 'OPEN') return 1;
        return 0;
      }),
    [data],
  );

  return (
    <Card className="border border-border/70 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Unavailability requests</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading requests…</p>
        ) : emptyState ? (
          <p className="text-sm text-muted-foreground">No requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((item) => {
                  const isOwner = user?.id === item.userId;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.requester}</TableCell>
                      <TableCell>{format(item.date, 'EEEE')}</TableCell>
                      <TableCell>{format(item.date, 'MMM d, yyyy')}</TableCell>
                      <TableCell>{formatShiftSlotLabel(item.shiftSlot)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_VARIANT[item.status] ?? STATUS_VARIANT.OPEN}>
                          {item.status === 'OPEN' ? 'pending' : item.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => setDetail(item)}>
                          Detail
                        </Button>
                        {isOwner && item.status === 'OPEN' ? (
                          <Button variant="outline" size="sm" onClick={() => setUpdateTarget(item)}>
                            Update
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request detail</DialogTitle>
          </DialogHeader>
          {detail ? (
            <div className="space-y-3 text-sm">
              <DetailRow label="Employee" value={detail.requester} />
              <DetailRow label="Date" value={format(detail.date, 'EEEE · MMM d, yyyy')} />
              <DetailRow label="Shift" value={formatShiftSlotLabel(detail.shiftSlot)} />
              <DetailRow label="Status" value={detail.status === 'OPEN' ? 'Pending' : detail.status.toLowerCase()} />
              <DetailRow label="Reason" value={detail.reason || '—'} />
              <DetailRow label="Feedback" value={detail.reviewNote || '—'} />
              {detail.documentUrl ? (
                <DetailRow
                  label="Document"
                  value={
                    <a className="text-primary" href={detail.documentUrl} target="_blank" rel="noreferrer">
                      View attachment
                    </a>
                  }
                />
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <UnavailabilityUpdateDialog
        request={updateTarget}
        open={Boolean(updateTarget)}
        onOpenChange={(open) => {
          if (!open) setUpdateTarget(null);
        }}
      />
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-border/70 bg-muted/30 px-3 py-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
