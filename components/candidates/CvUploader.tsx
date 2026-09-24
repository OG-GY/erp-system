"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  uploadCandidateCv,
  deleteCandidateCv,
  type UploadCandidateCvState,
} from "@/lib/actions/candidates";

const initialState: UploadCandidateCvState = { error: null };

export function CvUploader({
  candidateId,
  cvUrl,
}: {
  candidateId: string;
  cvUrl: string | null;
}) {
  const router = useRouter();
  const boundUpload = uploadCandidateCv.bind(null, candidateId);
  const [state, formAction, isPending] = useActionState(boundUpload, initialState);
  const [isDeleting, startDeleteTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lets Ctrl+V anywhere while this candidate's modal is open drop a
  // clipboard screenshot straight into the file input, reusing the same
  // upload form/button rather than a separate silent auto-upload path.
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/"),
      );
      const file = item?.getAsFile();
      if (!file || !fileInputRef.current) return;

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(new File([file], "pasted-cv.png", { type: file.type }));
      fileInputRef.current.files = dataTransfer.files;
    }
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  function handleRemove() {
    startDeleteTransition(async () => {
      await deleteCandidateCv(candidateId);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {cvUrl ? (
        <div className="flex flex-col gap-2">
          {/* A plain <img>, not next/image: this is a short-lived signed
              URL (private bucket) — Next's remote image cache could still
              be serving it after the signing token expires. */}
          <a href={cvUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={cvUrl}
              alt="Candidate CV"
              className="max-h-64 w-auto rounded-md border border-border object-contain"
            />
          </a>
          <div className="flex items-center gap-3">
            <a
              href={cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-accent hover:underline"
            >
              Open full size
            </a>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isDeleting}
              aria-label="Remove CV"
              title="Remove CV"
              className="flex items-center gap-1 text-xs font-medium text-danger transition-colors hover:underline disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              {isDeleting ? "Removing…" : "Remove"}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-foreground-muted">No CV attached.</p>
      )}

      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          name="cv"
          accept="image/png"
          disabled={isPending}
          className="text-xs text-foreground-muted file:mr-2 file:h-8 file:rounded-md file:border file:border-border-strong file:bg-surface file:px-3 file:text-xs file:font-medium file:text-foreground disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isPending}
          className="h-8 rounded-sm border border-border-strong px-3 text-xs font-medium text-foreground transition-colors hover:bg-overlay-hover disabled:opacity-60"
        >
          {isPending ? "Uploading…" : cvUrl ? "Replace CV" : "Upload CV"}
        </button>
      </form>
      <p className="text-xs text-foreground-muted">
        PNG only — choose a file, or paste (Ctrl+V) a screenshot.
      </p>
      {state.error ? (
        <p role="alert" className="text-xs text-danger">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
