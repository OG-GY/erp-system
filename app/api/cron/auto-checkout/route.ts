import { NextResponse } from "next/server";
import { autoCheckOutStaleShifts } from "@/lib/attendance";

/**
 * Vercel Cron target (see vercel.json) — not a user-facing endpoint.
 * Vercel sends `Authorization: Bearer $CRON_SECRET` on cron-triggered
 * requests when CRON_SECRET is set as a project env var; anything else
 * (a random request hitting this URL) is rejected.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const closed = await autoCheckOutStaleShifts();
  return NextResponse.json({ closed });
}
