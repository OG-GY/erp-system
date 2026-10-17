"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";

type ToastItem = { id: number; message: string };

type ToastApi = {
  showError: (message: string) => void;
  /** Runs a server action, toasting a returned `{ error }` or a thrown failure. */
  run: <T>(action: () => Promise<T>) => Promise<T | undefined>;
};

const ToastContext = createContext<ToastApi | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showError = useCallback(
    (message: string) => {
      const id = nextId++;
      setToasts((prev) => [...prev.slice(-3), { id, message }]);
      setTimeout(() => dismiss(id), 8000);
    },
    [dismiss],
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
    <ToastContext.Provider value={{ showError, run }}>
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
            role="alert"
            className="pointer-events-auto flex items-start gap-2 rounded-md border border-danger/40 bg-surface px-3 py-2.5 text-sm text-danger shadow-lg"
          >
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
