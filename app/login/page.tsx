import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { TRUSTED_USER_ID_HEADER } from "@/lib/supabase/trusted-user-header";

export default async function LoginPage() {
  // The proxy already verified the session (or not) for this request — see
  // lib/supabase/trusted-user-header.ts — so no need to call Supabase Auth
  // again just to redirect an already-logged-in visitor away.
  const headerList = await headers();
  if (headerList.get(TRUSTED_USER_ID_HEADER)) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface-translucent p-8 shadow-[0_1px_2px_rgb(0_0_0_/_0.04),0_8px_24px_rgb(0_0_0_/_0.08)] backdrop-blur-xl">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-[0.875rem] bg-accent text-lg font-semibold text-accent-foreground">
            E
          </div>
          <h1 className="text-lg font-semibold text-foreground">
            Employee Management System
          </h1>
          <p className="text-sm text-foreground-muted">
            Sign in with your work email
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
