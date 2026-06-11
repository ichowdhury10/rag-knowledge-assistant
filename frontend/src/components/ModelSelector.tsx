"use client";

import { useEffect, useRef, useState, useCallback, KeyboardEvent } from "react";
import { ChevronDown, Cpu, Check } from "lucide-react";
import { listModels } from "@/lib/api";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/lib/utils";

const FALLBACK = ["llama3.2", "llama3", "mistral", "phi3", "gemma2"];

interface Props {
  value: string;
  onChange: (model: string) => void;
}

export default function ModelSelector({ value, onChange }: Props) {
  const [models, setModels] = useState<string[]>(FALLBACK);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listModels().then(setModels).catch(() => {});
  }, []);

  // Close on outside click
  useClickOutside(containerRef, useCallback(() => setOpen(false), []), open);

  // Sync focused index when value changes
  useEffect(() => {
    setFocused(Math.max(0, models.indexOf(value)));
  }, [value, models]);

  function select(model: string) {
    onChange(model);
    setOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocused((f) => Math.min(f + 1, models.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocused((f) => Math.max(f - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      select(models[focused]);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        id="model-selector-btn"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Selected model: ${value}`}
        className={cn(
          "flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium",
          "transition-all duration-150 border",
          open
            ? "bg-slate-800 border-indigo-500/50 text-slate-200 shadow-sm shadow-indigo-500/10"
            : "bg-slate-800/80 border-white/8 text-slate-300 hover:bg-slate-700/80 hover:border-white/12 hover:text-slate-200"
        )}
      >
        <Cpu size={12} className="text-indigo-400" aria-hidden />
        <span className="font-mono">{value}</span>
        <ChevronDown
          size={12}
          className={cn("text-slate-500 transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={listRef}
          role="listbox"
          aria-label="Select a model"
          aria-activedescendant={`model-option-${focused}`}
          className={cn(
            "absolute right-0 top-10 z-50 w-52 py-1.5 rounded-xl",
            "border border-white/8 bg-slate-900 shadow-2xl shadow-black/60",
            "animate-fade-up"
          )}
        >
          <p className="px-3 pb-1.5 text-[10px] uppercase tracking-widest text-slate-600 font-semibold">
            Local models
          </p>
          {models.map((m, i) => {
            const isSelected = m === value;
            const isFocused = i === focused;
            return (
              <button
                key={m}
                id={`model-option-${i}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => select(m)}
                onMouseEnter={() => setFocused(i)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-xs text-left",
                  "transition-colors duration-100 font-mono",
                  isFocused
                    ? "bg-white/6 text-slate-100"
                    : "text-slate-400 hover:bg-white/4 hover:text-slate-200"
                )}
              >
                <span className="w-3.5 shrink-0">
                  {isSelected && <Check size={12} className="text-indigo-400" aria-hidden />}
                </span>
                {m}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
