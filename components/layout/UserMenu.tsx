import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { Avatar } from "@/components/ui/Avatar";

export function UserMenu({
  fullName,
  designation,
  profilePictureUrl,
  collapsed = false,
}: {
  fullName: string;
  designation: string | null;
  profilePictureUrl: string | null;
  collapsed?: boolean;
}) {
  return (
    <details className="group relative">
      <summary
        title={collapsed ? fullName : undefined}
        className={`flex cursor-pointer list-none items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-black/[.04] dark:hover:bg-white/[.06] [&::-webkit-details-marker]:hidden ${collapsed ? "justify-center" : ""}`}
      >
        <Avatar fullName={fullName} url={profilePictureUrl} size={28} />
        {collapsed ? null : (
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
        )}
      </summary>

      <div className="absolute bottom-full left-0 mb-1 w-full min-w-[10rem] rounded-md border border-border bg-surface p-1 shadow-lg">
        <Link
          href="/profile"
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-foreground hover:bg-black/[.04] dark:hover:bg-white/[.06]"
        >
          <UserRound className="h-4 w-4" aria-hidden="true" />
          My profile
        </Link>
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
