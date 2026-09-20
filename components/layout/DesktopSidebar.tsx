"use client";

import { useState } from "react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import type { Role } from "@prisma/client";
import { SidebarContent } from "@/components/layout/SidebarContent";

export function DesktopSidebar({
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
  // "Pinned" state, toggled by the button — keyboard-operable, since hover
  // alone isn't (rule: don't rely on hover for functionality). Hovering
  // temporarily peeks the sidebar open without changing the pinned state.
  const [collapsed, setCollapsed] = useState(true);
  const [hovering, setHovering] = useState(false);
  const expanded = !collapsed || hovering;

  return (
    <aside
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={`relative hidden shrink-0 flex-col border-r border-border bg-surface-translucent backdrop-blur-xl transition-[width] duration-200 md:flex ${
        expanded ? "w-64" : "w-[72px]"
      }`}
    >
      <SidebarContent
        fullName={fullName}
        designation={designation}
        role={role}
        profilePictureUrl={profilePictureUrl}
        collapsed={!expanded}
      />

      <button
        type="button"
        aria-label={collapsed ? "Pin sidebar open" : "Unpin sidebar"}
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-16 flex h-6 w-6 items-center justify-center rounded-md border border-border bg-surface text-foreground-muted shadow-sm hover:text-foreground"
      >
        {collapsed ? (
          <ChevronsRight className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <ChevronsLeft className="h-3.5 w-3.5" aria-hidden="true" />
        )}
      </button>
    </aside>
  );
}
