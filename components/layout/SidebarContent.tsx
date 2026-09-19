import type { Role } from "@prisma/client";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { UserMenu } from "@/components/layout/UserMenu";

export function SidebarContent({
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
  return (
    <>
      <div className="flex h-14 shrink-0 items-center px-4">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Employee Management
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        <SidebarNav role={role} />
      </div>

      <div className="border-t border-border p-2">
        <UserMenu
          fullName={fullName}
          designation={designation}
          profilePictureUrl={profilePictureUrl}
        />
      </div>
    </>
  );
}
