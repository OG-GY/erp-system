import type { ReactNode } from "react";
import type { Role } from "@prisma/client";
import { SidebarContent } from "@/components/layout/SidebarContent";
import { MobileSidebar } from "@/components/layout/MobileSidebar";

export function AppShell({
  fullName,
  designation,
  role,
  profilePictureUrl,
  children,
}: {
  fullName: string;
  designation: string | null;
  role: Role;
  profilePictureUrl: string | null;
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface-translucent backdrop-blur-xl md:flex">
        <SidebarContent
          fullName={fullName}
          designation={designation}
          role={role}
          profilePictureUrl={profilePictureUrl}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <MobileSidebar
          fullName={fullName}
          designation={designation}
          role={role}
          profilePictureUrl={profilePictureUrl}
        />
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
