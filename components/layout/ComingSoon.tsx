import { PageHeader } from "@/components/layout/PageHeader";

export function ComingSoon({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="flex flex-1 flex-col items-center justify-center gap-1 p-6 text-center">
        <p className="text-sm font-medium text-foreground">
          {title} is not built yet
        </p>
        <p className="text-sm text-foreground-muted">
          This section is planned but not implemented in this build.
        </p>
      </div>
    </>
  );
}
