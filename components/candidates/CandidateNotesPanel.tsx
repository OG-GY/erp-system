"use client";

import { useActionState, useEffect, useRef } from "react";
import { addInterviewNote, type AddInterviewNoteState } from "@/lib/actions/candidates";
import { Textarea } from "@/components/ui/Textarea";
import { formatDateTime } from "@/lib/format";

const initialState: AddInterviewNoteState = { error: null };

export function CandidateNotesPanel({
  candidateId,
  notes,
}: {
  candidateId: string;
  notes: { id: string; note: string; createdAt: Date; author: { fullName: string } }[];
}) {
  const boundAction = addInterviewNote.bind(null, candidateId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isPending && !state.error) {
      formRef.current?.reset();
    }
  }, [isPending, state.error]);

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-3 text-xs text-foreground-muted">
        Interview notes — {notes.length}
      </p>

      {notes.length === 0 ? (
        <p className="mb-4 text-sm text-foreground-muted">No notes yet.</p>
      ) : (
        <ul className="mb-4 flex flex-col gap-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-md border border-border p-3">
              <p className="whitespace-pre-wrap text-sm text-foreground">{note.note}</p>
              <p className="mt-2 text-xs text-foreground-muted">
                {note.author.fullName} · {formatDateTime(note.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form ref={formRef} action={formAction} className="flex flex-col gap-2">
        <Textarea
          name="note"
          rows={3}
          required
          disabled={isPending}
          placeholder="Add a note from this interview…"
        />
        {state.error ? (
          <p role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isPending}
          className="h-9 w-fit rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Adding…" : "Add note"}
        </button>
      </form>
    </div>
  );
}
