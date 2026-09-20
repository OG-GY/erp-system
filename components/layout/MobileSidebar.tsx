"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { SidebarContent } from "@/components/layout/SidebarContent";

export function MobileSidebar({
  fullName,
  designation,
  role,
  profilePictureUrl,
}: {
  fullName: string;
  designation: string | null;
  role: Role;
  profilePictureUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close on navigation. Adjusting state during render (rather than in an
  // effect) for a prop/value change is the pattern React recommends —
  // see https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  // Escape to close, and return focus to the toggle button.
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface-translucent px-4 backdrop-blur-xl md:hidden">
        <button
          ref={toggleRef}
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-black/[.04] dark:hover:bg-white/[.06]"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <span className="text-sm font-bold tracking-tight text-foreground">
          Elevloop Internal
        </span>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-border bg-surface shadow-xl"
          >
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-black/[.04] dark:hover:bg-white/[.06]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <SidebarContent
              fullName={fullName}
              designation={designation}
              role={role}
              profilePictureUrl={profilePictureUrl}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
