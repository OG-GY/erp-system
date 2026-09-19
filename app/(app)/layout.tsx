import type { ReactNode } from "react";
import { requireEmployee } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const employee = await requireEmployee();

  return (
    <AppShell fullName={employee.fullName} designation={employee.designation}>
      {children}
    </AppShell>
  );
}
