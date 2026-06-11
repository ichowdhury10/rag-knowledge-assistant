"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  exiting?: boolean;
}

interface ToastContextValue {
  success: (message: string) => void;
  error:   (message: string) => void;
  info:    (message: string) => void;
}

// ── Context ────────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ── Individual toast item ──────────────────────────────────────────────────────

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />,
  error:   <XCircle     size={15} className="text-red-400    shrink-0" />,
  info:    <Info        size={15} className="text-indigo-400 shrink-0" />,
};

const BARS: Record<ToastType, string> = {
  success: "bg-emerald-500",
  error:   "bg-red-500",
  info:    "bg-indigo-500",
};

function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "relative flex items-start gap-3 w-80 rounded-xl overflow-hidden",
        "bg-slate-900 border border-white/8 shadow-xl shadow-black/50",
        "px-4 py-3 text-sm text-slate-200",
        toast.exiting ? "animate-toast-out" : "animate-toast-in"
      )}
    >
      {/* Progress bar */}
      <div
        className={cn(
          "absolute bottom-0 left-0 h-0.5 origin-left",
          BARS[toast.type],
          !toast.exiting && "transition-[width] ease-linear"
        )}
        style={{
          width: toast.exiting ? "0%" : "100%",
          transitionDuration: toast.exiting ? "200ms" : "3800ms",
        }}
      />

      {ICONS[toast.type]}

      <p className="flex-1 leading-snug">{toast.message}</p>

      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 p-0.5 text-slate-500 hover:text-slate-300 rounded transition-colors"
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ── Provider ───────────────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    // Start exit animation then remove
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    const removeTimer = setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      250
    );
    timers.current.set(`remove-${id}`, removeTimer);
  }, []);

  const add = useCallback(
    (type: ToastType, message: string) => {
      const id = Math.random().toString(36).slice(2, 9);
      setToasts((prev) => [...prev, { id, type, message }]);

      const t = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timers.current.set(id, t);
    },
    [dismiss]
  );

  // Clear timers on unmount
  useEffect(() => {
    const map = timers.current;
    return () => map.forEach(clearTimeout);
  }, []);

  const value: ToastContextValue = {
    success: (m) => add("success", m),
    error:   (m) => add("error",   m),
    info:    (m) => add("info",    m),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Portal-like fixed container */}
      <div
        aria-label="Notifications"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col-reverse gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
