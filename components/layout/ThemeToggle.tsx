"use client";

import { useState } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "light" | "dark";

/**
 * The effective theme right now: an explicit stored choice, or the system
 * preference if the user hasn't chosen yet. Only ever called client-side.
 */
function readTheme(): Theme {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "dark" || explicit === "light") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  // Lazy initializer only runs on the client (this is a Client Component),
  // by which point the anti-flash script in layout.tsx has already run.
  // Server and client can legitimately disagree here (the server has no
  // concept of the visitor's theme) — suppressHydrationWarning below is
  // React's documented pattern for exactly that case, not a workaround.
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document === "undefined" ? "light" : readTheme(),
  );

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
  }

  const label =
    theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={collapsed ? label : undefined}
      suppressHydrationWarning
      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground-muted transition-colors hover:bg-overlay-hover ${collapsed ? "justify-center" : ""}`}
    >
      {theme === "dark" ? (
        <Sun className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      ) : (
        <Moon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      )}
      {collapsed ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span className="truncate" suppressHydrationWarning>
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </span>
      )}
    </button>
  );
}
