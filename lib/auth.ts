import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { TRUSTED_USER_ID_HEADER } from "@/lib/supabase/trusted-user-header";
import type { Role } from "@prisma/client";

/**
 * Request-scoped memoization (React cache — resets between requests, never
 * shared across users) — requireEmployee() runs once in the (app) layout
 * and again in every page/action on top of it, which was two identical
 * Employee lookups (two Tokyo round-trips) per navigation. See
 * docs/caching.md for the full caching strategy and what's deliberately
 * NOT cached.
 */
const getEmployeeById = cache((id: string) =>
  prisma.employee.findUnique({ where: { id } }),
);

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

  const employee = await getEmployeeById(userId);

  if (!employee) {
    redirect("/login");
  }

  // Suspended (INACTIVE) or TERMINATED employees keep their Supabase
  // credentials but lose app access here — sign them out so the proxy's
  // session check fails on their next request instead of bouncing between
  // /login and /dashboard forever (both would otherwise see a valid session).
  if (employee.employmentStatus === "INACTIVE" || employee.employmentStatus === "TERMINATED") {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login?suspended=1");
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
