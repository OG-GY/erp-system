"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Users,
  Users2,
  CalendarCheck,
  CalendarClock,
  FolderKanban,
  Wallet,
  BarChart3,
  UserSearch,
  ListTodo,
} from "lucide-react";
import type { Role } from "@prisma/client";

const EMPLOYEE_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/teams", label: "Teams", icon: Users2 },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/leave", label: "Leave", icon: CalendarClock },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/payroll", label: "Payroll", icon: Wallet },
] as const;

const ADMIN_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/interviews", label: "Interviews", icon: UserSearch },
  { href: "/teams", label: "Teams", icon: Users2 },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/leave", label: "Leave", icon: CalendarClock },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/payroll", label: "Payroll", icon: Wallet },
  { href: "/reports", label: "Reports", icon: BarChart3 },
] as const;

// Same item set as EMPLOYEE_NAV_ITEMS today — kept as its own constant (not
// a shared reference) so it can diverge later without touching the employee
// nav. A Project Manager doesn't get Employees/Interviews/Reports.
const PROJECT_MANAGER_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/teams", label: "Teams", icon: Users2 },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/leave", label: "Leave", icon: CalendarClock },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/payroll", label: "Payroll", icon: Wallet },
] as const;

function navItemsForRole(role: Role) {
  if (role === "EMPLOYEE") return EMPLOYEE_NAV_ITEMS;
  if (role === "PROJECT_MANAGER") return PROJECT_MANAGER_NAV_ITEMS;
  return ADMIN_NAV_ITEMS;
}

export function SidebarNav({
  role,
  collapsed = false,
}: {
  role: Role;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const items = navItemsForRole(role);

  return (
    <nav aria-label="Main" className="flex flex-col gap-1 px-2">
      {items.map(({ href, label, icon: Icon }) => {
        const isActive =
          pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            title={collapsed ? label : undefined}
            className={`flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm transition-colors ${
              collapsed ? "justify-center" : ""
            } ${
              isActive
                ? "bg-accent/12 font-semibold text-accent"
                : "text-foreground-muted hover:bg-overlay-hover"
            }`}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            {collapsed ? (
              <span className="sr-only">{label}</span>
            ) : (
              <span className="truncate">{label}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
