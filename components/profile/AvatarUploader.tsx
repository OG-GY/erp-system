"use client";

import { useActionState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { uploadAvatar, type UploadAvatarState } from "@/lib/actions/avatar";

const initialState: UploadAvatarState = { error: null, url: null };

export function AvatarUploader({
  fullName,
  currentUrl,
}: {
  fullName: string;
  currentUrl: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    uploadAvatar,
    initialState,
  );
  const displayUrl = state.url ?? currentUrl;

  return (
    <form action={formAction} className="flex items-center gap-4">
      <Avatar fullName={fullName} url={displayUrl} size={56} />
      <div className="flex flex-col gap-1.5">
        <input
          type="file"
          name="avatar"
          accept="image/png,image/jpeg,image/webp"
          required
          disabled={isPending}
          className="text-xs text-foreground-muted file:mr-3 file:h-8 file:rounded-md file:border file:border-border-strong file:bg-surface file:px-3 file:text-xs file:font-medium file:text-foreground disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isPending}
          className="h-8 w-fit rounded-full border border-border-strong px-3 text-xs font-medium text-foreground transition-colors hover:bg-overlay-hover disabled:opacity-60"
        >
          {isPending ? "Uploading…" : "Upload photo"}
        </button>
        {state.error ? (
          <p role="alert" className="text-xs text-danger">
            {state.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
