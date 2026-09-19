import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { TRUSTED_USER_ID_HEADER } from "@/lib/supabase/trusted-user-header";
import type { Role } from "@prisma/client";

/**
 * Resolves the current authenticated Employee record.
 * Redirects to /login if there is no session or no matching Employee row.
 *
 * Every protected Server Component / Route Handler / Server Action that
 * reads or mutates sensitive data must call this (middleware alone is not
 * authorization). The proxy already calls supabase.auth.getUser() — a real
 * network round-trip — on every request, so this trusts its verified result
 * via a request header instead of paying for a second one here. Falls back
 * to a full re-check if the header is somehow missing.
 */
export async function requireEmployee() {
  const headerList = await headers();
  let userId = headerList.get(TRUSTED_USER_ID_HEADER);

  if (!userId) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }
    userId = user.id;
  }

  const employee = await prisma.employee.findUnique({
    where: { id: userId },
  });

  if (!employee) {
    redirect("/login");
  }

  return employee;
}

export function assertRole(role: Role, allowed: Role[]) {
  if (!allowed.includes(role)) {
    throw new Error("Forbidden: insufficient role for this action.");
  }
}

/**
 * The product only has two real user types today: a regular Employee, and
 * everyone else ("admin side" — Super Admin, HR Manager, Manager), who all
 * see the management views. This is the single place that distinction is
 * decided, so it can be refined later without touching every page.
 */
export function isAdmin(role: Role) {
  return role !== "EMPLOYEE";
}

/**
 * Page-level guard for admin-only routes (e.g. /employees, /reports).
 * Hiding the nav link is UX only — this is the actual authorization check,
 * required even if the employee navigates there directly by URL.
 */
export async function requireAdmin() {
  const employee = await requireEmployee();
  if (!isAdmin(employee.role)) {
    redirect("/dashboard");
  }
  return employee;
}
