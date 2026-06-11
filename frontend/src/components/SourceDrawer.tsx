"use client";

import { useEffect, useRef } from "react";
import { X, BookOpen, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SourcePassage } from "@/lib/types";

interface Props {
  sources: SourcePassage[];
  onClose: () => void;
}

export default function SourceDrawer({ sources, onClose }: Props) {
  const drawerRef = useRef<HTMLElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus close button on open; restore focus on close
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();
    return () => { previouslyFocused?.focus(); };
  }, []);

  // Escape key + focus trap
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !drawerRef.current) return;

      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <aside
      ref={drawerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="source-drawer-title"
      className="w-72 md:w-80 shrink-0 flex flex-col border-l border-white/5 bg-slate-950 animate-slide-in-right overflow-hidden"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2" id="source-drawer-title">
          <BookOpen size={14} className="text-indigo-400" aria-hidden />
          <span className="text-sm font-semibold text-slate-200">Source Passages</span>
          <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full font-mono">
            {sources.length}
          </span>
        </div>
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Close source passages"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
        >
          <X size={14} aria-hidden />
        </button>
      </div>

      {/* ── Passages ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {sources.map((s, i) => (
          <article
            key={i}
            aria-label={`Passage ${i + 1} from ${s.source ?? "document"}`}
            className={cn(
              "rounded-xl border border-white/5 bg-slate-900/60 overflow-hidden",
              "animate-fade-up"
            )}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {/* Passage header */}
            <div className="flex items-center justify-between px-3 py-2 bg-white/3 border-b border-white/5">
              <div className="flex items-center gap-1.5">
                <FileText size={10} className="text-indigo-400/70" aria-hidden />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400/80">
                  Passage {i + 1}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {s.source && (
                  <span
                    className="text-[10px] font-mono text-slate-500 max-w-[120px] truncate"
                    title={s.source}
                  >
                    {s.source.replace("_rmp.txt", "").replace("prof_", "")}
                  </span>
                )}
                {s.page != null && (
                  <>
                    <span className="text-slate-700">·</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      p.{s.page + 1}
                    </span>
                  </>
                )}
                {s.chunk_index !== undefined && (
                  <>
                    <span className="text-slate-700">·</span>
                    <span className="text-[10px] font-mono text-slate-600">
                      chunk {s.chunk_index}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Passage text */}
            <p className="px-3 py-2.5 text-[11px] text-slate-400 leading-relaxed font-mono whitespace-pre-wrap break-words">
              {s.content}
            </p>
          </article>
        ))}
      </div>

      {/* ── Footer hint ─────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 border-t border-white/5 bg-white/2">
        <p className="text-[10px] text-slate-700 text-center">
          Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-500 font-mono text-[9px]">Esc</kbd> to close
        </p>
      </div>
    </aside>
  );
}
