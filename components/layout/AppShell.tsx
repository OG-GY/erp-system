import type { ReactNode } from "react";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { UserMenu } from "@/components/layout/UserMenu";

export function AppShell({
  fullName,
  designation,
  children,
}: {
  fullName: string;
  designation: string | null;
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface-translucent backdrop-blur-xl">
        <div className="flex h-14 shrink-0 items-center px-4">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Employee Management
          </span>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          <SidebarNav />
        </div>

        <div className="border-t border-border p-2">
          <UserMenu fullName={fullName} designation={designation} />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
