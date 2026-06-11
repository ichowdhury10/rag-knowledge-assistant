"use client";

import { useState, useCallback } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ChatPanel from "@/components/ChatPanel";
import ModelSelector from "@/components/ModelSelector";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import type { Document } from "@/lib/types";

export default function Home() {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [model, setModel] = useState("llama3.2");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSelectDoc = useCallback((doc: Document | null) => {
    setSelectedDoc(doc);
    setSidebarOpen(false); // close drawer on mobile after selection
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between h-14 px-4 md:px-5 shrink-0 z-20 border-b border-white/5 bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl select-none" aria-hidden>🧠</span>
            <span className="text-sm font-semibold text-slate-100 tracking-tight hidden sm:block">
              RAG Knowledge Assistant
            </span>
            <span className="text-sm font-semibold text-slate-100 tracking-tight sm:hidden">
              RAG Assistant
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <ModelSelector value={model} onChange={setModel} />
          <ThemeToggle />
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="relative flex flex-1 overflow-hidden">

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="absolute inset-0 z-20 bg-black/60 md:hidden animate-fade-in"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}

        {/* Sidebar — slide-in drawer on mobile, always visible on md+ */}
        <div
          className={cn(
            "absolute md:relative z-30 md:z-auto h-full",
            "transition-transform duration-300 ease-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          <Sidebar selectedDoc={selectedDoc} onSelectDoc={handleSelectDoc} />
        </div>

        <ChatPanel doc={selectedDoc} model={model} />
      </div>
    </div>
  );
}
