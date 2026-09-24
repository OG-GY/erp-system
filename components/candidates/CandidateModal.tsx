"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { EditCandidateForm } from "@/components/candidates/EditCandidateForm";
import { CandidateStatusSelect } from "@/components/candidates/CandidateStatusSelect";
import { CandidateNotesPanel } from "@/components/candidates/CandidateNotesPanel";
import { CvUploader } from "@/components/candidates/CvUploader";
import { DeleteCandidateButton } from "@/components/candidates/DeleteCandidateButton";

type Candidate = {
  id: string;
  fullName: string;
  position: string;
  email: string | null;
  phone: string | null;
  status: string;
  interviewDate: Date | null;
  cvUrl: string | null;
  notes: { id: string; note: string; createdAt: Date; author: { fullName: string } }[];
};

export function CandidateModal({
  candidate,
  onClose,
}: {
  candidate: Candidate;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="candidate-modal-title"
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2 id="candidate-modal-title" className="text-base font-semibold text-foreground">
              {candidate.fullName}
            </h2>
            <p className="text-sm text-foreground-muted">{candidate.position}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-sm p-1 text-foreground-muted hover:bg-overlay-hover hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-foreground-muted">Status</p>
            <CandidateStatusSelect candidateId={candidate.id} status={candidate.status} />
          </div>

          <details className="rounded-lg border border-border">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground-muted">
              Edit candidate
            </summary>
            <div className="px-4 pb-4">
              <EditCandidateForm
                candidateId={candidate.id}
                defaultFullName={candidate.fullName}
                defaultPosition={candidate.position}
                defaultEmail={candidate.email ?? ""}
                defaultPhone={candidate.phone ?? ""}
                defaultInterviewDate={
                  candidate.interviewDate
                    ? candidate.interviewDate.toISOString().slice(0, 10)
                    : ""
                }
              />
            </div>
          </details>

          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-foreground-muted">CV</p>
            <CvUploader candidateId={candidate.id} cvUrl={candidate.cvUrl} />
          </div>

          <CandidateNotesPanel candidateId={candidate.id} notes={candidate.notes} />

          <div className="flex items-center justify-between rounded-lg border border-danger/30 p-4">
            <p className="text-sm text-foreground-muted">Delete this candidate</p>
            <DeleteCandidateButton
              candidateId={candidate.id}
              candidateName={candidate.fullName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
