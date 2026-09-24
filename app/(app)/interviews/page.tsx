import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Select } from "@/components/ui/Select";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { CandidateStatus } from "@prisma/client";

const STATUS_TONE = {
  SCHEDULED: "neutral",
  IN_PROGRESS: "warning",
  APPROVED: "success",
  REJECTED: "danger",
} as const;

const STATUS_LABEL = {
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In progress",
  APPROVED: "Approved",
  REJECTED: "Rejected",
} as const;

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export default async function InterviewsPage({
  searchParams,
}: PageProps<"/interviews">) {
  await requireAdmin();

  const params = await searchParams;
  const statusParam = Array.isArray(params?.status) ? params.status[0] : params?.status;
  const statusFilter =
    statusParam && statusParam in STATUS_LABEL
      ? (statusParam as CandidateStatus)
      : undefined;

  const candidates = await prisma.candidate.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: [{ status: "asc" }, { interviewDate: "asc" }],
    select: {
      id: true,
      fullName: true,
      position: true,
      status: true,
      interviewDate: true,
    },
  });

  return (
    <>
      <PageHeader
        title="Interviews"
        description={`${candidates.length} ${candidates.length === 1 ? "candidate" : "candidates"}`}
        actions={
          <Link
            href="/interviews/new"
            className="flex h-8 items-center rounded-sm bg-accent px-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            New candidate
          </Link>
        }
      />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <form method="get" className="flex items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className="text-xs font-medium text-foreground-muted">
              Status
            </label>
            <Select
              id="status"
              name="status"
              defaultValue={statusFilter ?? ""}
              className="w-44"
              options={STATUS_FILTER_OPTIONS}
            />
          </div>
          <button
            type="submit"
            className="h-9 rounded-sm border border-border-strong px-4 text-sm font-medium text-foreground transition-colors hover:bg-overlay-hover"
          >
            Filter
          </button>
        </form>

        {candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <p className="text-sm font-medium text-foreground">No candidates yet</p>
            <Link
              href="/interviews/new"
              className="mt-2 flex h-9 items-center rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              New candidate
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-foreground-muted">
                  <th className="px-4 py-2 font-medium">Candidate</th>
                  <th className="px-4 py-2 font-medium">Position</th>
                  <th className="px-4 py-2 font-medium">Interview date</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-medium">
                      <Link
                        href={`/interviews/${candidate.id}`}
                        className="text-foreground hover:text-accent"
                      >
                        {candidate.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-foreground-muted">
                      {candidate.position}
                    </td>
                    <td className="px-4 py-2.5 text-foreground-muted">
                      {candidate.interviewDate
                        ? new Intl.DateTimeFormat("en-US", {
                            dateStyle: "medium",
                            timeZone: "UTC",
                          }).format(candidate.interviewDate)
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge
                        label={STATUS_LABEL[candidate.status]}
                        tone={STATUS_TONE[candidate.status]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
