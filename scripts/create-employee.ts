/**
 * One-off/admin bootstrap script to provision an employee account
 * (Supabase auth user + Employee row). There is no in-app "add employee"
 * flow yet, so the very first accounts must be created this way.
 *
 * Usage:
 *   node scripts/create-employee.ts --email=a@work.com --password=secret \
 *     --fullName="Full Name" --designation="Title" --role=EMPLOYEE
 *
 * --role defaults to EMPLOYEE. Valid values: SUPER_ADMIN, HR_MANAGER, MANAGER, EMPLOYEE.
 */
import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

// Standalone script (not part of the Next.js build), so it can't import
// lib/supabase/admin.ts — that file's `server-only` guard always throws
// outside Next's bundler. Same service-role client, constructed inline.
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function parseArgs() {
  const args = new Map<string, string>();
  for (const raw of process.argv.slice(2)) {
    const match = raw.match(/^--([^=]+)=(.*)$/);
    if (match) args.set(match[1], match[2]);
  }
  return args;
}

async function main() {
  const args = parseArgs();
  const email = args.get("email");
  const password = args.get("password");
  const fullName = args.get("fullName");
  const designation = args.get("designation") ?? null;
  const roleArg = (args.get("role") ?? "EMPLOYEE").toUpperCase();

  if (!email || !password || !fullName) {
    console.error(
      "Missing required args. Usage: --email=... --password=... --fullName=... [--designation=...] [--role=...]",
    );
    process.exit(1);
  }

  if (!(roleArg in Role)) {
    console.error(
      `Invalid --role="${roleArg}". Valid values: ${Object.keys(Role).join(", ")}`,
    );
    process.exit(1);
  }
  const role = roleArg as Role;

  const prisma = new PrismaClient();
  const supabaseAdmin = createAdminClient();

  try {
    const existing = await prisma.employee.findUnique({
      where: { officialEmail: email },
    });
    if (existing) {
      console.error(`An employee with email ${email} already exists.`);
      process.exit(1);
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !data.user) {
      console.error("Failed to create Supabase auth user:", error?.message);
      process.exit(1);
    }

    const employeeCount = await prisma.employee.count();
    const employeeNumber = `EMP-${String(employeeCount + 1).padStart(4, "0")}`;

    const employee = await prisma.employee.create({
      data: {
        id: data.user.id,
        employeeNumber,
        fullName,
        officialEmail: email,
        role,
        designation,
        employmentStatus: "ACTIVE",
        employmentType: "FULL_TIME",
        joiningDate: new Date(),
      },
    });

    console.log("Created employee:", {
      id: employee.id,
      employeeNumber: employee.employeeNumber,
      fullName: employee.fullName,
      officialEmail: employee.officialEmail,
      role: employee.role,
      designation: employee.designation,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
