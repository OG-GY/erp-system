"use client";

import { StickyNote } from "lucide-react";

type Candidate = {
  id: string;
  fullName: string;
  position: string;
  interviewDate: Date | null;
  notes: unknown[];
};

export function CandidateCard({
  candidate,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  candidate: Candidate;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className="flex cursor-grab flex-col gap-1 rounded-md border border-border bg-surface p-3 text-left text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md active:cursor-grabbing"
    >
      <span className="font-medium text-foreground">{candidate.fullName}</span>
      <span className="text-xs text-foreground-muted">{candidate.position}</span>
      <div className="mt-1 flex items-center justify-between text-xs text-foreground-muted">
        <span>
          {candidate.interviewDate
            ? new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
                timeZone: "UTC",
              }).format(candidate.interviewDate)
            : "No date set"}
        </span>
        {candidate.notes.length > 0 ? (
          <span className="flex items-center gap-1">
            <StickyNote className="h-3 w-3" aria-hidden="true" />
            {candidate.notes.length}
          </span>
        ) : null}
      </div>
    </button>
  );
}
