import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { TRUSTED_USER_ID_HEADER } from "@/lib/supabase/trusted-user-header";

const PUBLIC_PATHS = ["/login", "/auth"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * Refreshes the Supabase session on every request and redirects
 * unauthenticated users away from protected app routes.
 *
 * This is UX/defense-in-depth only — every Server Component, Route Handler,
 * and Server Action that touches sensitive data must still independently
 * verify auth + authorization (rule: proxy/middleware is not the only auth layer).
 * See lib/supabase/trusted-user-header.ts for how pages avoid re-verifying
 * with a second network round-trip.
 */
export async function updateSession(request: NextRequest) {
  // Never trust a client-supplied value for this header — always start clean.
  request.headers.delete(TRUSTED_USER_ID_HEADER);

  let cookiesToApply: { name: string; value: string; options?: CookieOptions }[] =
    [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesToApply = cookiesToSet;
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    request.headers.set(TRUSTED_USER_ID_HEADER, user.id);
  }

  const response = NextResponse.next({ request });
  cookiesToApply.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options),
  );
  return response;
}
