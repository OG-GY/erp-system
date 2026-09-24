import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { EditCandidateForm } from "@/components/candidates/EditCandidateForm";
import { CandidateStatusSelect } from "@/components/candidates/CandidateStatusSelect";
import { CandidateNotesPanel } from "@/components/candidates/CandidateNotesPanel";
import { CvUploader } from "@/components/candidates/CvUploader";
import { DeleteCandidateButton } from "@/components/candidates/DeleteCandidateButton";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCvSignedUrls } from "@/lib/candidateCv";

export default async function CandidateDetailPage({
  params,
}: PageProps<"/interviews/[id]">) {
  await requireAdmin();
  const { id } = await params;

  const candidate = await prisma.candidate.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      position: true,
      email: true,
      phone: true,
      status: true,
      interviewDate: true,
      cvPath: true,
      notes: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          note: true,
          createdAt: true,
          author: { select: { fullName: true } },
        },
      },
    },
  });

  if (!candidate) {
    notFound();
  }

  const cvUrl = candidate.cvPath
    ? (await getCvSignedUrls([candidate.cvPath])).get(candidate.cvPath) ?? null
    : null;

  return (
    <>
      <PageHeader title={candidate.fullName} description={candidate.position} />
      <div className="grid grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-1">
          <div className="rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-4 text-sm font-medium text-foreground-muted">Status</h2>
            <CandidateStatusSelect candidateId={candidate.id} status={candidate.status} />
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-4 text-sm font-medium text-foreground-muted">
              Edit candidate
            </h2>
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

          <div className="rounded-lg border border-danger/30 bg-surface p-4">
            <h2 className="mb-1 text-sm font-medium text-foreground-muted">
              Danger zone
            </h2>
            <p className="mb-4 text-sm text-foreground-muted">
              Deleting a candidate removes all interview notes too.
            </p>
            <DeleteCandidateButton
              candidateId={candidate.id}
              candidateName={candidate.fullName}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-medium text-foreground-muted">CV</h2>
            <CvUploader candidateId={candidate.id} cvUrl={cvUrl} />
          </div>

          <CandidateNotesPanel candidateId={candidate.id} notes={candidate.notes} />
        </div>
      </div>
    </>
  );
}
