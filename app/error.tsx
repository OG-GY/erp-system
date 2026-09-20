"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
        <p className="text-sm font-medium text-foreground">
          Something went wrong.
        </p>
        <p className="text-sm text-foreground-muted">
          {error.digest ? `Reference: ${error.digest}` : "Please try again."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-2 h-9 rounded-full bg-accent px-4 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
