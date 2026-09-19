import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { initials } from "@/lib/format";

export function UserMenu({
  fullName,
  designation,
}: {
  fullName: string;
  designation: string | null;
}) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-black/[.04] dark:hover:bg-white/[.06] [&::-webkit-details-marker]:hidden">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
          {initials(fullName)}
        </span>
        <span className="flex min-w-0 flex-col text-left">
          <span className="truncate text-sm font-medium text-foreground">
            {fullName}
          </span>
          {designation ? (
            <span className="truncate text-xs text-foreground-muted">
              {designation}
            </span>
          ) : null}
        </span>
      </summary>

      <div className="absolute bottom-full left-0 mb-1 w-full min-w-[10rem] rounded-md border border-border bg-surface p-1 shadow-lg">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-foreground hover:bg-black/[.04] dark:hover:bg-white/[.06]"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </div>
    </details>
  );
}
