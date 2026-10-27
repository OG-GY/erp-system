"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Check, Loader2, X } from "lucide-react";

type ToastKind = "error" | "loading" | "success";
type ToastItem = { id: number; message: string; kind: ToastKind };

type TrackOptions<T> = {
  /** Shown (with a spinner) while the action runs in the background. */
  pending: string;
  /** Shown on success; return null to just dismiss the pending toast. */
  done: string | ((result: T) => string | null);
};

type ToastApi = {
  showError: (message: string) => void;
  /** Runs a server action, toasting a returned `{ error }` or a thrown failure. */
  run: <T>(action: () => Promise<T>) => Promise<T | undefined>;
  /**
   * Runs a server action in the background: a "processing" toast right away,
   * then a "done" or error toast when it settles, so the caller can move on.
   */
  track: <T extends { error?: string | null }>(
    options: TrackOptions<T>,
    action: () => Promise<T>,
  ) => Promise<T | undefined>;
};

const ToastContext = createContext<ToastApi | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, kind: ToastKind) => {
      const id = nextId++;
      setToasts((prev) => [...prev.slice(-4), { id, message, kind }]);
      if (kind === "error") setTimeout(() => dismiss(id), 8000);
      if (kind === "success") setTimeout(() => dismiss(id), 4000);
      return id;
    },
    [dismiss],
  );

  const showError = useCallback((message: string) => void push(message, "error"), [push]);

  const track = useCallback(
    async <T extends { error?: string | null }>(options: TrackOptions<T>, action: () => Promise<T>) => {
      const pendingId = push(options.pending, "loading");
      try {
        const result = await action();
        dismiss(pendingId);
        if (result.error) {
          showError(result.error);
        } else {
          const message = typeof options.done === "function" ? options.done(result) : options.done;
          if (message) push(message, "success");
        }
        return result;
      } catch (err) {
        dismiss(pendingId);
        const digest = (err as { digest?: unknown } | null)?.digest;
        if (typeof digest === "string" && digest.startsWith("NEXT_")) throw err;
        showError(err instanceof Error && err.message ? err.message : "Something went wrong.");
        return undefined;
      }
    },
    [push, dismiss, showError],
  );

  const run = useCallback(
    async <T,>(action: () => Promise<T>) => {
      try {
        const result = await action();
        const error = (result as { error?: unknown } | undefined)?.error;
        if (typeof error === "string" && error) showError(error);
        return result;
      } catch (err) {
        // Next's redirect()/notFound() are thrown control flow, not failures.
        const digest = (err as { digest?: unknown } | null)?.digest;
        if (typeof digest === "string" && digest.startsWith("NEXT_")) throw err;
        showError(err instanceof Error && err.message ? err.message : "Something went wrong.");
        return undefined;
      }
    },
    [showError],
  );

  return (
    <ToastContext.Provider value={{ showError, run, track }}>
      {children}
      {/* z-[100]: must sit above modals (z-50), where most form errors happen. */}
      <div
        role="region"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-start gap-2 rounded-md border bg-surface px-3 py-2.5 text-sm shadow-lg ${
              t.kind === "error" ? "border-danger/40 text-danger" : "border-border text-foreground"
            }`}
          >
            {t.kind === "loading" ? (
              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 motion-safe:animate-spin" aria-hidden="true" />
            ) : null}
            {t.kind === "success" ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
            ) : null}
            <span className="min-w-0 flex-1 break-words">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="shrink-0 text-foreground-muted hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider.");
  return ctx;
}

/**
 * Shows `message` as an error toast whenever it (or `trigger`) changes.
 * `trigger` lets a repeated identical error re-fire — pass the action state
 * object, which is a new reference on every submit.
 */
export function ErrorToast({ message, trigger }: { message: string | null | undefined; trigger?: unknown }) {
  const { showError } = useToast();
  useEffect(() => {
    if (message) showError(message);
  }, [message, trigger, showError]);
  return null;
}
