import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/format";

const OUTCOME_TONE = {
  NO_ANSWER: "neutral",
  BUSY: "neutral",
  VOICEMAIL: "neutral",
  GATEKEEPER: "warning",
  DECISION_MAKER_REACHED: "success",
  INTERESTED: "success",
  CALLBACK_REQUESTED: "warning",
  MEETING_BOOKED: "success",
  NOT_INTERESTED: "danger",
  INVALID_NUMBER: "danger",
  DO_NOT_CALL: "danger",
} as const;

const OUTCOME_LABEL = {
  NO_ANSWER: "No answer",
  BUSY: "Busy",
  VOICEMAIL: "Voicemail",
  GATEKEEPER: "Gatekeeper",
  DECISION_MAKER_REACHED: "Decision-maker reached",
  INTERESTED: "Interested",
  CALLBACK_REQUESTED: "Callback requested",
  MEETING_BOOKED: "Meeting booked",
  NOT_INTERESTED: "Not interested",
  INVALID_NUMBER: "Invalid number",
  DO_NOT_CALL: "Do not call",
} as const;

type CallAttempt = {
  id: string;
  attemptNumber: number;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number | null;
  outcome: keyof typeof OUTCOME_LABEL | null;
  decisionMakerReached: boolean;
  interestLevel: string | null;
  notes: string | null;
  caller: { fullName: string };
};

function formatDuration(seconds: number | null) {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function CallHistoryList({ calls }: { calls: CallAttempt[] }) {
  if (calls.length === 0) {
    return <p className="text-sm text-foreground-muted">No calls logged yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {calls.map((call) => (
        <li key={call.id} className="rounded-md border border-border p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">
              Attempt #{call.attemptNumber} · {call.caller.fullName}
            </p>
            {call.outcome ? (
              <StatusBadge label={OUTCOME_LABEL[call.outcome]} tone={OUTCOME_TONE[call.outcome]} />
            ) : (
              <StatusBadge label="In progress" tone="warning" />
            )}
          </div>
          <p className="text-xs text-foreground-muted">
            {formatDateTime(call.startedAt)}
            {call.durationSeconds !== null ? ` · ${formatDuration(call.durationSeconds)}` : ""}
            {call.decisionMakerReached ? " · Decision-maker reached" : ""}
            {call.interestLevel ? ` · ${call.interestLevel.charAt(0)}${call.interestLevel.slice(1).toLowerCase()} interest` : ""}
          </p>
          {call.notes ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{call.notes}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
