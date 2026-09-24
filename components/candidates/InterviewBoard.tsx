"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCandidateStatus } from "@/lib/actions/candidates";
import { CandidateCard } from "@/components/candidates/CandidateCard";
import { CandidateModal } from "@/components/candidates/CandidateModal";

const COLUMNS = [
  { status: "APPLIED", label: "Applied" },
  { status: "SCHEDULED", label: "Scheduled" },
  { status: "IN_PROGRESS", label: "In progress" },
  { status: "ON_HOLD", label: "On hold" },
  { status: "APPROVED", label: "Approved" },
  { status: "OFFER_SENT", label: "Offer sent" },
  { status: "REJECTED", label: "Rejected" },
] as const;

type Candidate = {
  id: string;
  fullName: string;
  position: string;
  email: string | null;
  phone: string | null;
  status: string;
  interviewDate: Date | null;
  notes: { id: string; note: string; createdAt: Date; author: { fullName: string } }[];
};

export function InterviewBoard({
  candidates: initialCandidates,
}: {
  candidates: Candidate[];
}) {
  const router = useRouter();
  const [candidates, setCandidates] = useState(initialCandidates);
  // Re-sync when the server data refreshes (e.g. after a status update, or a
  // note/edit made from inside the modal revalidates the page) — React's
  // documented pattern for adjusting state from a changed prop, done during
  // render rather than in an Effect so it doesn't cost an extra commit.
  const [prevInitialCandidates, setPrevInitialCandidates] = useState(initialCandidates);
  if (initialCandidates !== prevInitialCandidates) {
    setPrevInitialCandidates(initialCandidates);
    setCandidates(initialCandidates);
  }

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDrop(status: string) {
    setDragOverStatus(null);
    if (!draggedId) return;
    const id = draggedId;
    setDraggedId(null);
    if (candidates.find((c) => c.id === id)?.status === status) return;

    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    startTransition(async () => {
      await updateCandidateStatus(id, status);
      router.refresh();
    });
  }

  const selectedCandidate = candidates.find((c) => c.id === selectedId) ?? null;

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {COLUMNS.map((column) => {
          const items = candidates.filter((c) => c.status === column.status);
          const isDragOver = dragOverStatus === column.status;

          return (
            <div
              key={column.status}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverStatus !== column.status) setDragOverStatus(column.status);
              }}
              onDragLeave={() => setDragOverStatus((s) => (s === column.status ? null : s))}
              onDrop={() => handleDrop(column.status)}
              className={`flex w-72 shrink-0 flex-col gap-2 rounded-lg border p-3 transition-colors ${
                isDragOver ? "border-accent bg-accent/5" : "border-border bg-background"
              }`}
            >
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-medium text-foreground-muted">{column.label}</p>
                <span className="text-xs text-foreground-muted">{items.length}</span>
              </div>

              <div className="flex min-h-[4rem] flex-col gap-2">
                {items.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border px-2 py-4 text-center text-xs text-foreground-muted">
                    No candidates
                  </p>
                ) : (
                  items.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      onDragStart={() => setDraggedId(candidate.id)}
                      onDragEnd={() => {
                        setDraggedId(null);
                        setDragOverStatus(null);
                      }}
                      onClick={() => setSelectedId(candidate.id)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedCandidate ? (
        <CandidateModal candidate={selectedCandidate} onClose={() => setSelectedId(null)} />
      ) : null}
    </>
  );
}
