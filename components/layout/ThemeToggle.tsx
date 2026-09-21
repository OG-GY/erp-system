"use client";

import { useEffect, useState } from "react";
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
  // null until mounted. The server has no concept of the visitor's theme,
  // so both SSR and the client's first render (before this effect runs)
  // produce the same "unknown" output — swapping to the real icon/label
  // happens afterward, as an ordinary state update rather than part of
  // hydration diffing, so the two passes can never mismatch. (Swapping
  // between <Sun>/<Moon> is a structural difference, not just text, so
  // suppressHydrationWarning alone can't cover this — it only suppresses
  // text-content mismatches on the element it's set on.)
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // This is React's own documented fix for a server/client value that can
    // only be known client-side (window.matchMedia, localStorage) — force a
    // second render pass after mount rather than trying to resolve it
    // during the render that hydration is diffing against:
    // https://react.dev/reference/react-dom/client/hydrateRoot#handling-different-client-and-server-content
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(readTheme());
  }, []);

  function toggle() {
    if (!theme) return;
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
      className={`flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm text-foreground-muted transition-colors hover:bg-overlay-hover ${collapsed ? "justify-center" : ""}`}
    >
      <span className={theme === null ? "invisible" : ""}>
        {theme === "dark" ? (
          <Sun className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        ) : (
          <Moon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        )}
      </span>
      {collapsed ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span className={`truncate ${theme === null ? "invisible" : ""}`}>
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </span>
      )}
    </button>
  );
}
