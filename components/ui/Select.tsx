"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  // Screen coordinates for the portaled dropdown — recomputed from the
  // trigger button's live position, since the dropdown no longer lives
  // inside whatever scroll/overflow container the button does.
  const [position, setPosition] = useState<
    { top: number; left: number; width: number; openUpward: boolean } | null
  >(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selected = options.find((o) => o.value === value);

  function updatePosition() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const LIST_MAX_HEIGHT = 224; // matches max-h-56
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < LIST_MAX_HEIGHT && spaceAbove > spaceBelow;
    setPosition({
      top: openUpward ? rect.top : rect.bottom,
      left: rect.left,
      width: rect.width,
      openUpward,
    });
  }

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
    function handleReposition() {
      updatePosition();
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    // capture: true — catches scrolling inside any ancestor scroll
    // container (e.g. a table's overflow-x-auto wrapper), not just the
    // window itself.
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open]);

  function openList() {
    if (disabled) return;
    const idx = options.findIndex((o) => o.value === value);
    setActiveIndex(idx >= 0 ? idx : 0);
    updatePosition();
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

      {open && position
        ? createPortal(
            <ul
              role="listbox"
              tabIndex={-1}
              style={{
                position: "fixed",
                top: position.openUpward ? undefined : position.top + 4,
                bottom: position.openUpward
                  ? window.innerHeight - position.top + 4
                  : undefined,
                left: position.left,
                width: position.width,
              }}
              className="z-50 max-h-56 min-w-max overflow-auto rounded-md border border-border bg-surface py-1 shadow-lg"
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
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
