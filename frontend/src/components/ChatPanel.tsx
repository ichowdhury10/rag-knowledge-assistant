"use client";

import { useEffect, useRef, useState, KeyboardEvent, useCallback } from "react";
import { Send, Square, Trash2, Sparkles, FileText, ArrowDown } from "lucide-react";
import MessageBubble from "@/components/MessageBubble";
import SourceDrawer from "@/components/SourceDrawer";
import { Button } from "@/components/ui/Button";
import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/utils";
import type { Document, SourcePassage } from "@/lib/types";

interface Props {
  doc: Document | null;
  model: string;
}

const SUGGESTIONS = [
  "Summarize this document",
  "What are the key findings?",
  "List the main topics covered",
];

export default function ChatPanel({ doc, model }: Props) {
  const { messages, isStreaming, send, stop, clear } = useChat(doc?.id ?? null, model);
  const [input, setInput] = useState("");
  const [activeSources, setActiveSources] = useState<SourcePassage[] | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show "scroll to bottom" button when user scrolls up
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function onScroll() {
      const distFromBottom = el!.scrollHeight - el!.scrollTop - el!.clientHeight;
      setShowScrollBtn(distFromBottom > 120);
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  // Reset on document change
  useEffect(() => {
    clear();
    setActiveSources(null);
    setInput("");
  }, [doc?.id, clear]);

  const submit = useCallback(() => {
    const q = input.trim();
    if (!q || isStreaming) return;
    setInput("");
    send(q);
  }, [input, isStreaming, send]);

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function toggleSources(sources: SourcePassage[]) {
    setActiveSources((prev) => (prev === sources ? null : sources));
  }

  // ── Empty state (no document selected) ────────────────────────────────────
  if (!doc) {
    return (
      <main className="flex-1 flex items-center justify-center bg-slate-950 px-6">
        <div className="text-center max-w-xs w-full animate-fade-up">
          {/* Glow ring around icon */}
          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 blur-xl" aria-hidden />
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 border border-white/8 shadow-xl">
              <Sparkles size={26} className="text-indigo-400" aria-hidden />
            </div>
          </div>

          <h1 className="text-base font-semibold text-slate-200 mb-2">
            Ask anything about your documents
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Upload a PDF in the sidebar, then ask questions. Answers are grounded in the document.
          </p>

          {/* Supported types */}
          <div className="flex flex-wrap justify-center gap-1.5" aria-label="Supported document types">
            {["Research papers", "Textbooks", "Reports", "Contracts", "Manuals"].map((label) => (
              <span
                key={label}
                className="px-2.5 py-1 text-[11px] rounded-full bg-slate-800/80 text-slate-500 border border-white/5"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // ── Chat view ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-1 overflow-hidden min-w-0">
      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">

        {/* Document context bar */}
        <div className="flex items-center justify-between px-4 md:px-5 py-2 border-b border-white/5 bg-slate-900/30 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={12} className="text-indigo-400 shrink-0" aria-hidden />
            <p className="text-xs text-slate-400 truncate">
              <span className="font-medium text-slate-300">{doc.name}</span>
              <span className="text-slate-600 mx-1.5" aria-hidden>·</span>
              <span className="text-slate-600 tabular-nums">{doc.chunks} chunks</span>
            </p>
          </div>

          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 size={11} />}
              onClick={clear}
              aria-label="Clear conversation"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Messages area */}
        <div
          ref={scrollRef}
          className="relative flex-1 overflow-y-auto"
          aria-live="polite"
          aria-label="Conversation"
        >
          <div className="px-4 md:px-6 py-5 space-y-5 max-w-3xl mx-auto">
            {/* Empty conversation hint */}
            {messages.length === 0 && (
              <div className="text-center pt-12 pb-4 animate-fade-in">
                <p className="text-sm text-slate-600 mb-4">
                  Ask anything about <span className="text-slate-400 font-medium">{doc.name}</span>
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-full transition-all duration-150",
                        "bg-slate-800/80 text-slate-400 border border-white/6",
                        "hover:bg-slate-700 hover:text-slate-200 hover:border-white/10",
                        "active:scale-[0.97]"
                      )}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onShowSources={toggleSources}
              />
            ))}

            <div ref={bottomRef} aria-hidden />
          </div>

          {/* Scroll-to-bottom button */}
          {showScrollBtn && (
            <button
              onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
              aria-label="Scroll to latest message"
              className={cn(
                "absolute bottom-4 right-4 flex items-center justify-center",
                "w-8 h-8 rounded-full bg-slate-800 border border-white/10",
                "text-slate-400 hover:text-slate-200 shadow-lg transition-all",
                "animate-fade-in"
              )}
            >
              <ArrowDown size={14} aria-hidden />
            </button>
          )}
        </div>

        {/* ── Input bar ─────────────────────────────────────────────────── */}
        <div className="px-4 md:px-6 pb-4 pt-2 shrink-0 max-w-3xl mx-auto w-full">
          <div
            className={cn(
              "flex items-end gap-2.5 rounded-2xl border px-3 pt-2.5 pb-2",
              "bg-slate-900/80 transition-all duration-200",
              "border-white/8 focus-within:border-indigo-500/50 focus-within:shadow-md focus-within:shadow-indigo-500/10"
            )}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder={`Ask anything about ${doc.name}…`}
              rows={1}
              disabled={isStreaming}
              aria-label="Message input"
              aria-multiline="true"
              className={cn(
                "flex-1 resize-none bg-transparent text-sm text-slate-100",
                "placeholder:text-slate-600 outline-none",
                "min-h-[34px] max-h-40 leading-relaxed py-1",
                "no-scrollbar disabled:opacity-50"
              )}
            />
            <button
              onClick={isStreaming ? stop : submit}
              disabled={!isStreaming && !input.trim()}
              aria-label={isStreaming ? "Stop generation" : "Send message"}
              className={cn(
                "shrink-0 flex items-center justify-center w-8 h-8 rounded-xl mb-0.5",
                "transition-all duration-150 active:scale-[0.92]",
                isStreaming
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : input.trim()
                  ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm shadow-indigo-500/30"
                  : "bg-slate-800/60 text-slate-600 cursor-not-allowed"
              )}
            >
              {isStreaming
                ? <Square size={13} fill="currentColor" aria-hidden />
                : <Send size={13} aria-hidden />
              }
            </button>
          </div>
          <p className="text-[10px] text-slate-700 text-right mt-1.5 pr-1">
            <kbd className="font-mono">↵</kbd> Send &nbsp;·&nbsp; <kbd className="font-mono">⇧↵</kbd> New line
          </p>
        </div>
      </div>

      {/* Source drawer */}
      {activeSources && (
        <SourceDrawer sources={activeSources} onClose={() => setActiveSources(null)} />
      )}
    </div>
  );
}
