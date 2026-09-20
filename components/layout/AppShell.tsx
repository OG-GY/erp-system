import type { ReactNode } from "react";
import type { Role } from "@prisma/client";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
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
      <DesktopSidebar
        fullName={fullName}
        designation={designation}
        role={role}
        profilePictureUrl={profilePictureUrl}
      />

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
