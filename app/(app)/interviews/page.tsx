import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { InterviewBoard } from "@/components/candidates/InterviewBoard";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function InterviewsPage() {
  await requireAdmin();

  const candidates = await prisma.candidate.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      position: true,
      email: true,
      phone: true,
      status: true,
      interviewDate: true,
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
      <div className="p-4 sm:p-6">
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
          <InterviewBoard candidates={candidates} />
        )}
      </div>
    </>
  );
}
