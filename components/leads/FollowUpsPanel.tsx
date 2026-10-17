"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  completeFollowUp,
  cancelFollowUp,
  rescheduleFollowUp,
  createFollowUp,
  type RescheduleFollowUpState,
  type CreateFollowUpState,
} from "@/lib/actions/followUps";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ErrorToast } from "@/components/ui/Toast";
import { useToast } from "@/components/ui/Toast";

type FollowUp = {
  id: string;
  dueDate: Date;
  action: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
};

const STATUS_TONE = { SCHEDULED: "warning", COMPLETED: "success", CANCELLED: "neutral" } as const;
const STATUS_LABEL = { SCHEDULED: "Scheduled", COMPLETED: "Completed", CANCELLED: "Cancelled" } as const;

const rescheduleInitialState: RescheduleFollowUpState = { error: null };
const createInitialState: CreateFollowUpState = { error: null };

export function FollowUpsPanel({ leadId, followUps }: { leadId: string; followUps: FollowUp[] }) {
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-3 text-xs text-foreground-muted">Follow-ups</p>

      {followUps.length === 0 ? (
        <p className="mb-3 text-sm text-foreground-muted">No follow-ups scheduled.</p>
      ) : (
        <ul className="mb-3 flex flex-col gap-2">
          {followUps.map((f) => (
            <FollowUpRow key={f.id} followUp={f} todayIso={todayIso} />
          ))}
        </ul>
      )}

      <AddFollowUpForm leadId={leadId} />
    </div>
  );
}

function FollowUpRow({ followUp, todayIso }: { followUp: FollowUp; todayIso: string }) {
  const router = useRouter();
  const { run } = useToast();
  const [isPending, startTransition] = useTransition();
  const [rescheduling, setRescheduling] = useState(false);
  const dueIso = followUp.dueDate.toISOString().slice(0, 10);
  const isOverdue = followUp.status === "SCHEDULED" && dueIso < todayIso;

  function complete() {
    startTransition(async () => {
      await run(() => completeFollowUp(followUp.id));
      router.refresh();
    });
  }
  function cancel() {
    startTransition(async () => {
      await run(() => cancelFollowUp(followUp.id));
      router.refresh();
    });
  }

  return (
    <li className="rounded-md border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm text-foreground">{followUp.action}</p>
          <p className={`text-xs ${isOverdue ? "font-medium text-danger" : "text-foreground-muted"}`}>
            Due{" "}
            {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(
              followUp.dueDate,
            )}
            {isOverdue ? " · Overdue" : ""}
          </p>
        </div>
        <StatusBadge label={STATUS_LABEL[followUp.status]} tone={STATUS_TONE[followUp.status]} />
      </div>

      {followUp.status === "SCHEDULED" ? (
        rescheduling ? (
          <RescheduleForm followUpId={followUp.id} onDone={() => setRescheduling(false)} />
        ) : (
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={complete}
              disabled={isPending}
              className="text-xs font-medium text-success hover:underline disabled:opacity-60"
            >
              Mark complete
            </button>
            <button
              type="button"
              onClick={() => setRescheduling(true)}
              disabled={isPending}
              className="text-xs font-medium text-accent hover:underline disabled:opacity-60"
            >
              Reschedule
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={isPending}
              className="text-xs font-medium text-danger hover:underline disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        )
      ) : null}
    </li>
  );
}

function RescheduleForm({ followUpId, onDone }: { followUpId: string; onDone: () => void }) {
  const boundAction = rescheduleFollowUp.bind(null, followUpId);
  const [state, formAction, isPending] = useActionState(boundAction, rescheduleInitialState);

  useEffect(() => {
    if (!isPending && state.error === null && state !== rescheduleInitialState) {
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending, state]);

  return (
    <form action={formAction} className="mt-2 flex items-center gap-2">
      <Input name="dueDate" type="date" required disabled={isPending} className="h-8 w-40" />
      <button
        type="submit"
        disabled={isPending}
        className="text-xs font-medium text-accent hover:underline disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        onClick={onDone}
        className="text-xs font-medium text-foreground-muted hover:text-foreground"
      >
        Cancel
      </button>
      {state.error ? <p className="w-full text-xs text-danger">{state.error}</p> : null}
    </form>
  );
}

function AddFollowUpForm({ leadId }: { leadId: string }) {
  const boundAction = createFollowUp.bind(null, leadId);
  const [state, formAction, isPending] = useActionState(boundAction, createInitialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isPending && !state.error) {
      formRef.current?.reset();
    }
  }, [isPending, state.error]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-end gap-2 border-t border-border pt-3"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="newFollowUpDate" className="text-xs text-foreground-muted">
          Due date
        </label>
        <Input id="newFollowUpDate" name="dueDate" type="date" required disabled={isPending} className="w-40" />
      </div>
      <Input
        name="action"
        placeholder="Next action"
        required
        disabled={isPending}
        className="min-w-[10rem] flex-1"
      />
      <button
        type="submit"
        disabled={isPending}
        className="h-9 rounded-sm border border-border-strong px-3 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover disabled:opacity-60"
      >
        {isPending ? "Adding…" : "Add"}
      </button>
      <ErrorToast message={state.error} trigger={state} />
    </form>
  );
}
