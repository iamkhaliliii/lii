"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

export type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  id?: string;
  "aria-label"?: string;
  /** `sm` for dense rows (e.g. template variables); `md` for toolbar filters */
  size?: "sm" | "md";
};

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  disabled = false,
  className,
  triggerClassName,
  id,
  "aria-label": ariaLabel,
  size = "md",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const display = selected?.label ?? placeholder;

  const iconSize = size === "sm" ? 14 : 16;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card text-left transition-colors",
          "focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/10",
          "disabled:cursor-not-allowed disabled:opacity-50",
          size === "sm"
            ? "min-h-[34px] px-2.5 py-1.5 text-xs"
            : "h-[38px] px-3 text-sm",
          triggerClassName
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            !selected && "text-muted/55"
          )}
        >
          {display}
        </span>
        <ChevronDown
          size={iconSize}
          className={cn(
            "shrink-0 text-muted/45 transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          tabIndex={-1}
          className={cn(
            "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-card py-1 shadow-md",
            "ring-1 ring-black/[0.04] dark:ring-white/[0.08]"
          )}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 px-3 text-foreground/90 hover:bg-accent",
                  size === "sm" ? "py-1.5 text-xs" : "py-2 text-sm",
                  isSelected && "bg-accent/70 font-medium"
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onValueChange(opt.value);
                  setOpen(false);
                }}
              >
                <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                {isSelected ? (
                  <Check size={14} className="shrink-0 text-primary" aria-hidden />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
