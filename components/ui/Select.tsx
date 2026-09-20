"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = { value: string; label: string; disabled?: boolean };

/**
 * A fully custom dropdown — not a styled native <select>, since a native
 * select's open popup is OS-rendered and can't be restyled. Form
 * compatibility comes from a visually-hidden real <input> (not type=hidden,
 * which browsers exclude from constraint validation) so `name`/`required`
 * still work inside a plain <form action={...}> the same as any other field.
 */
export function Select({
  name,
  options,
  defaultValue,
  value: controlledValue,
  onChange,
  placeholder = "Select…",
  disabled,
  required,
  id,
  "aria-label": ariaLabel,
  className = "",
}: {
  name?: string;
  options: readonly SelectOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  "aria-label"?: string;
  className?: string;
}) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const value = isControlled ? controlledValue : internalValue;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function openList() {
    if (disabled) return;
    const idx = options.findIndex((o) => o.value === value);
    setActiveIndex(idx >= 0 ? idx : 0);
    setOpen(true);
  }

  function selectValue(next: string) {
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function handleTriggerKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const opt = options[activeIndex];
      if (opt && !opt.disabled) selectValue(opt.value);
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {name ? (
        // sr-only, not type="hidden" — hidden inputs are excluded from HTML
        // constraint validation, which would silently break `required`.
        <input
          type="text"
          name={name}
          value={value}
          required={required}
          readOnly
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
        />
      ) : null}
      <button
        ref={buttonRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleTriggerKeyDown}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60"
      >
        <span
          className={`truncate ${selected ? "text-foreground" : "text-foreground-muted"}`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-foreground-muted"
          aria-hidden="true"
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          tabIndex={-1}
          className="absolute z-30 mt-1 max-h-56 w-full min-w-max overflow-auto rounded-md border border-border bg-surface py-1 shadow-lg"
        >
          {options.map((opt, i) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => !opt.disabled && selectValue(opt.value)}
              className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-sm ${
                opt.disabled
                  ? "cursor-not-allowed text-foreground-muted opacity-50"
                  : i === activeIndex
                    ? "bg-overlay-hover text-foreground"
                    : "text-foreground"
              }`}
            >
              {opt.label}
              {opt.value === value ? (
                <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
