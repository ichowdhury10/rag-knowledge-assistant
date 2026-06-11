import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Variants ───────────────────────────────────────────────────────────────────

const variantClasses = {
  primary:
    "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 disabled:bg-indigo-800 disabled:text-indigo-300",
  secondary:
    "bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 border border-white/8 disabled:opacity-40",
  ghost:
    "text-slate-400 hover:text-slate-200 hover:bg-white/5 active:bg-white/10 disabled:opacity-40",
  danger:
    "text-red-400 hover:text-red-300 hover:bg-red-500/10 active:bg-red-500/20 disabled:opacity-40",
  "ghost-indigo":
    "text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 active:bg-indigo-500/20",
} as const;

const sizeClasses = {
  xs: "h-6  px-2   text-[11px] gap-1   rounded-md",
  sm: "h-7  px-2.5 text-xs     gap-1.5 rounded-md",
  md: "h-8  px-3   text-xs     gap-1.5 rounded-lg",
  lg: "h-9  px-4   text-sm     gap-2   rounded-lg",
} as const;

// ── Props ──────────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  loading?: boolean;
  /** Icon placed before label */
  leftIcon?: React.ReactNode;
  /** Icon placed after label */
  rightIcon?: React.ReactNode;
  /** Renders as icon-only (no padding override needed) */
  iconOnly?: boolean;
}

/**
 * Accessible, reusable button.
 *
 * Props contract:
 * - `variant` — visual style (primary | secondary | ghost | danger | ghost-indigo)
 * - `size`    — xs | sm | md | lg
 * - `loading` — replaces left icon with spinner and disables
 * - `leftIcon` / `rightIcon` — slot for lucide icons
 * - `iconOnly` — square aspect-ratio shortcut (use with aria-label)
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "secondary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      iconOnly = false,
      className,
      children,
      disabled,
      ...rest
    },
    ref
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        className={cn(
          "inline-flex items-center justify-center font-medium",
          "transition-colors duration-150 select-none",
          "disabled:cursor-not-allowed",
          "active:scale-[0.97] transition-transform",
          variantClasses[variant],
          sizeClasses[size],
          iconOnly && "px-0 aspect-square",
          className
        )}
        {...rest}
      >
        {loading ? (
          <Loader2 size={13} className="animate-spin-slow shrink-0" />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}

        {children && <span>{children}</span>}

        {rightIcon && !loading && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);
