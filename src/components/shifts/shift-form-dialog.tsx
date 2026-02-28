"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShiftSlot, ShiftStatus } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ShiftListItem } from "@/types/shifts";
import {
  shiftMutationSchema,
  type ShiftMutationInput,
} from "@/lib/validations/shifts";
import { useQuery } from "@tanstack/react-query";
import { formatDateInputValue, formatShiftSlotLabel } from "@/lib/shift-slots";

type ShiftFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ShiftMutationInput) => Promise<void>;
  shift?: ShiftListItem;
  isSubmitting: boolean;
};

const statusOptions = Object.values(ShiftStatus);

type RecommendationEntry = {
  id: number;
  name: string;
  score?: number;
  hasSameDayShift?: boolean;
  sameDayCount?: number;
  hasUnavailability?: boolean;
};

type Recommendations = {
  frequent: RecommendationEntry[];
  available: RecommendationEntry[];
};

export function ShiftFormDialog({
  open,
  onOpenChange,
  onSubmit,
  shift,
  isSubmitting,
}: ShiftFormDialogProps) {
  const [assigneeId, setAssigneeId] = useState<number | undefined>(undefined);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ShiftMutationInput>({
    resolver: zodResolver(shiftMutationSchema),
    defaultValues: {
      status: ShiftStatus.DRAFT,
      date: formatDateInputValue(new Date()),
      shiftSlot: ShiftSlot.SHIFT1,
    },
  });

  const resetToDefault = useCallback(() => {
    reset({
      status: ShiftStatus.DRAFT,
      date: formatDateInputValue(new Date()),
      shiftSlot: ShiftSlot.SHIFT1,
      notes: "",
    });
    setAssigneeId(undefined);
  }, [reset]);

  useEffect(() => {
    if (shift) {
      const shiftDate = new Date(shift.start);
      reset({
        id: shift.id,
        status: shift.status,
        notes: shift.notes ?? "",
        date: formatDateInputValue(shiftDate),
        shiftSlot: shift.shiftSlot,
      });
      setAssigneeId(shift.primaryAssigneeId ?? undefined);
    } else {
      resetToDefault();
    }
  }, [shift, reset, resetToDefault]);

  const dateValue = watch("date");
  const shiftSlotValue = (watch("shiftSlot") as ShiftSlot | undefined) ?? ShiftSlot.SHIFT1;

  const emptyRecommendations: Recommendations = useMemo(
    () => ({ frequent: [], available: [] }),
    [],
  );

  const { data: recommendations = emptyRecommendations, isFetching: isRecommending } = useQuery({
    queryKey: ["shift-recommendations", dateValue, shiftSlotValue],
    enabled: Boolean(dateValue && shiftSlotValue),
    queryFn: async (): Promise<Recommendations> => {
      const response = await fetch("/api/shifts/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date: dateValue,
          shiftSlot: shiftSlotValue,
        }),
      });
      if (!response.ok) throw new Error("Failed to load recommendations");
      const json = await response.json();
      return json.data as Recommendations;
    },
  });

  const submitHandler = handleSubmit(async (data) => {
    await onSubmit({ ...data, assigneeId });
    resetToDefault();
    onOpenChange(false);
  });

  const handleAssigneeSelection = (candidate: RecommendationCandidate) => {
    if (candidate.hasSameDayShift) {
      const confirmed =
        typeof window === "undefined" ||
        window.confirm(
          `This employee already has ${
            candidate.sameDayCount ?? 1
          } shift(s) on this day. Are you sure you want to assign them again?`,
        );
      if (!confirmed) {
        return;
      }
    }
    setAssigneeId(candidate.id);
  };

  const title = shift ? "Edit shift" : "Create shift";

  const compareCandidates = useCallback((a: RecommendationCandidate, b: RecommendationCandidate) => {
    if (!!a.hasUnavailability !== !!b.hasUnavailability) {
      return a.hasUnavailability ? 1 : -1;
    }
    if (!!a.hasSameDayShift !== !!b.hasSameDayShift) {
      return a.hasSameDayShift ? 1 : -1;
    }
    const scoreA = a.score ?? 0;
    const scoreB = b.score ?? 0;
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
    return a.name.localeCompare(b.name);
  }, []);

  const frequentCandidates: RecommendationCandidate[] = useMemo(
    () =>
      recommendations.frequent
        .map((item) => ({
          id: item.id,
          name: item.name,
          score: item.score,
          detail: item.score !== undefined ? `Score: ${item.score}` : undefined,
          hasSameDayShift: item.hasSameDayShift,
          sameDayCount: item.sameDayCount,
          hasUnavailability: item.hasUnavailability,
        }))
        .sort(compareCandidates),
    [recommendations.frequent, compareCandidates],
  );

  const availableCandidates: RecommendationCandidate[] = useMemo(
    () =>
      recommendations.available
        .map((item) => ({
          id: item.id,
          name: item.name,
          score: item.score,
          hasSameDayShift: item.hasSameDayShift,
          sameDayCount: item.sameDayCount,
          hasUnavailability: item.hasUnavailability,
        }))
        .sort(compareCandidates),
    [recommendations.available, compareCandidates],
  );

  const candidateList = useMemo(() => {
    const merged = new Map<number, RecommendationCandidate>();
    for (const candidate of frequentCandidates) {
      merged.set(candidate.id, candidate);
    }
    for (const candidate of availableCandidates) {
      if (!merged.has(candidate.id)) {
        merged.set(candidate.id, candidate);
      }
    }
    return Array.from(merged.values()).sort(compareCandidates);
  }, [frequentCandidates, availableCandidates, compareCandidates]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="shift-form-dialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submitHandler}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="shift-date">Date</Label>
              <Input id="shift-date" type="date" {...register("date")} />
              {errors.date ? <p className="text-xs text-red-500">{errors.date.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shift-slot">Shift slot</Label>
              <Select id="shift-slot" {...register("shiftSlot")}>
                <option value={ShiftSlot.SHIFT1}>{formatShiftSlotLabel(ShiftSlot.SHIFT1)}</option>
                <option value={ShiftSlot.SHIFT2}>{formatShiftSlotLabel(ShiftSlot.SHIFT2)}</option>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select id="status" {...register("status")}>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.toLowerCase()}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes"
              {...register("notes")}
            />
          </div>

          <div className="space-y-3">
            {candidateList.length === 0 ? (
              <p className="text-xs text-muted-foreground">No employees available for this slot.</p>
            ) : (
              <div className="space-y-2">
                {candidateList.map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
                      assigneeId === candidate.id ? "border-primary bg-primary/5" : "border-border bg-muted/40"
                    }`}
                    onClick={() => handleAssigneeSelection(candidate)}
                  >
                    <div className="flex flex-col">
                      <span>{candidate.name}</span>
                      {candidate.hasSameDayShift ? (
                        <span className="text-[11px] text-amber-600">
                          {candidate.sameDayCount ?? 1} shift(s) already scheduled today
                        </span>
                      ) : null}
                      {candidate.hasUnavailability ? (
                        <span className="text-[11px] text-red-600">Pending unavailability on this slot</span>
                      ) : null}
                    </div>
                    {candidate.detail ? (
                      <span className="text-xs text-muted-foreground">{candidate.detail}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setAssigneeId(undefined)}>
                Clear
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const candidate = candidateList[0];
                  if (candidate) {
                    handleAssigneeSelection(candidate);
                  }
                }}
              >
                Auto-select top
              </Button>
            </div>
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
              {isSubmitting ? "Saving..." : "Save shift"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type RecommendationCandidate = {
  id: number;
  name: string;
  detail?: string;
  hasSameDayShift?: boolean;
  sameDayCount?: number;
  hasUnavailability?: boolean;
  score?: number;
};
