import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <p className="text-sm font-medium text-foreground">Page not found</p>
      <p className="text-sm text-foreground-muted">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 h-9 rounded-lg bg-accent px-4 text-sm font-medium leading-9 text-accent-foreground hover:opacity-90"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
