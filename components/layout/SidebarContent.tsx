import { Building2 } from "lucide-react";
import type { Role } from "@prisma/client";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { UserMenu } from "@/components/layout/UserMenu";

export function SidebarContent({
  fullName,
  designation,
  role,
  profilePictureUrl,
  collapsed = false,
}: {
  fullName: string;
  designation: string | null;
  role: Role;
  profilePictureUrl: string | null;
  collapsed?: boolean;
}) {
  return (
    <>
      <div
        className={`flex h-16 shrink-0 items-center gap-2.5 px-4 ${collapsed ? "justify-center px-0" : ""}`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Building2 className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        {collapsed ? null : (
          <span className="truncate text-sm font-bold tracking-tight text-foreground">
            Elevloop Internal
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        <SidebarNav role={role} collapsed={collapsed} />
      </div>

      <div className="border-t border-border p-2">
        <UserMenu
          fullName={fullName}
          designation={designation}
          profilePictureUrl={profilePictureUrl}
          collapsed={collapsed}
        />
      </div>
    </>
  );
}
