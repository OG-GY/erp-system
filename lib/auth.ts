import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

/**
 * Resolves the current authenticated Employee record.
 * Redirects to /login if there is no session or no matching Employee row.
 *
 * Every protected Server Component / Route Handler / Server Action that
 * reads or mutates sensitive data must call this (middleware alone is not
 * authorization).
 */
export async function requireEmployee() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: user.id },
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
