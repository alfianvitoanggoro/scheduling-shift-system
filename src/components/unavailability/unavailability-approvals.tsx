"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type PendingUnavailability = {
  id: number;
  date: string;
  shiftSlot: string;
  reason?: string | null;
  documentUrl?: string | null;
  requester: string;
};

export function UnavailabilityApprovals() {
  const {
    data = [],
    isLoading,
    refetch,
  } = useQuery<PendingUnavailability[]>({
    queryKey: ["pending-unavailability"],
    queryFn: async () => {
      const res = await fetch("/api/unavailability/pending", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load pending requests");
      const json = await res.json();
      return json.data ?? [];
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const [notes, setNotes] = useState<Record<number, string>>({});
  const mutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: "APPROVED" | "DECLINED";
    }) => {
      const response = await fetch(`/api/unavailability/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, reviewNote: notes[id] ?? "" }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed to update request");
      }
      return response.json();
    },
    onSuccess: async () => {
      toast.success("Request updated");
      await refetch();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update request",
      );
    },
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading approvals…</p>;
  }

  if (!data.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No pending unavailability requests.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => exportApprovalsToPdf(data)}>
          <FileDown className="mr-2 size-4" />
          Export PDF
        </Button>
      </div>
      {data.map((item) => (
        <div
          key={item.id}
          className="rounded-lg border border-border/60 bg-card/80 p-4 shadow-sm"
        >
          <div className="flex flex-col gap-1 text-sm">
            <p className="font-semibold">
              {item.requester} ·{" "}
              {format(new Date(item.date), "EEE, MMM d yyyy")} ·{" "}
              {item.shiftSlot === "SHIFT1"
                ? "Shift 1 (08:00-17:00)"
                : "Shift 2 (17:00-24:00)"}
            </p>
            {item.reason ? (
              <p className="text-muted-foreground">{item.reason}</p>
            ) : null}
            {item.documentUrl ? (
              <a
                className="text-primary text-xs"
                href={item.documentUrl}
                target="_blank"
                rel="noreferrer"
              >
                Supporting document
              </a>
            ) : null}
          </div>
          <div className="mt-3 space-y-2">
            <Textarea
              placeholder="Feedback (required when declining)"
              value={notes[item.id] ?? ""}
              onChange={(event) =>
                setNotes((prev) => ({ ...prev, [item.id]: event.target.value }))
              }
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() =>
                  mutation.mutate({ id: item.id, status: "APPROVED" })
                }
                disabled={mutation.isPending}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (!notes[item.id]?.trim()) {
                    toast.error("Provide feedback when declining.");
                    return;
                  }
                  mutation.mutate({ id: item.id, status: "DECLINED" });
                }}
                disabled={mutation.isPending}
              >
                Decline
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function exportApprovalsToPdf(items: PendingUnavailability[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PT IPWAN GLOBAL TELCOMM", 14, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Jakarta Selatan", 14, 27);
  doc.text("admin@ipwan.com", 14, 33);
  doc.setLineWidth(0.5);
  doc.line(14, 38, pageWidth - 14, 38);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Approval Unavailability Requests", pageWidth / 2, 47, {
    align: "center",
  });

  const tableData = items.map((item, i) => [
    i + 1,
    item.requester,
    format(new Date(item.date), "EEE, MMM d yyyy"),
    item.shiftSlot === "SHIFT1"
      ? "Shift 1 (08:00-17:00)"
      : "Shift 2 (17:00-24:00)",
    item.reason ?? "-",
  ]);

  autoTable(doc, {
    startY: 53,
    head: [["No", "Employee", "Date", "Shift", "Reason"]],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [239, 246, 255] },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY: number = (doc as any).lastAutoTable?.finalY ?? 200;
  const sigY = finalY + 20;
  const sigX = pageWidth - 14;
  const today = new Date();
  const formattedDate = today.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Jakarta, ${formattedDate}`, sigX, sigY, { align: "right" });
  doc.text("HRD Manager", sigX, sigY + 7, { align: "right" });
  doc.text("Akbar", sigX, sigY + 35, { align: "right" });

  doc.save("approval-requests.pdf");
}
