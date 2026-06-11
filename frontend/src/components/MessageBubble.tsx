"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen, Copy, Check, Brain, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message, SourcePassage } from "@/lib/types";

interface Props {
  message: Message;
  onShowSources: (sources: SourcePassage[]) => void;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message, onShowSources }: Props) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  function copyText() {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-up",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* ── Avatar ─────────────────────────────────────────────────────── */}
      <div
        aria-hidden
        className={cn(
          "shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5",
          isUser
            ? "bg-gradient-to-br from-indigo-600 to-indigo-500 shadow-md shadow-indigo-500/30"
            : "bg-slate-800 border border-white/8"
        )}
      >
        {isUser
          ? <User size={13} className="text-white" />
          : <Brain size={13} className="text-indigo-400" />
        }
      </div>

      {/* ── Bubble ─────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "max-w-[78%] flex flex-col",
          isUser ? "items-end gap-1" : "items-start gap-1.5"
        )}
      >
        <div
          className={cn(
            "px-4 py-3 rounded-2xl text-sm leading-relaxed",
            isUser
              ? "bubble-user text-white rounded-tr-sm"
              : "bubble-ai text-slate-100 rounded-tl-sm"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <>
              {/* Show thinking indicator while waiting for first token */}
              {message.streaming && message.content === "" ? (
                <span className="flex items-center gap-1" aria-label="Generating response">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
                </span>
              ) : (
                <div className="prose-rag">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                  {message.streaming && (
                    <span
                      aria-hidden
                      className="inline-block w-0.5 h-[1em] bg-indigo-400 animate-cursor-blink ml-0.5 align-text-bottom rounded-full"
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Meta row ─────────────────────────────────────────────────── */}
        <div className={cn("flex items-center gap-2.5 px-1", isUser && "flex-row-reverse")}>
          <time
            dateTime={new Date(message.timestamp).toISOString()}
            className="text-[10px] text-slate-600 tabular-nums"
          >
            {formatTime(message.timestamp)}
          </time>

          {/* Source and copy buttons — only for completed assistant messages */}
          {!isUser && !message.streaming && message.content && (
            <>
              {message.sources && message.sources.length > 0 && (
                <button
                  onClick={() => onShowSources(message.sources!)}
                  className={cn(
                    "flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5",
                    "text-indigo-400/70 bg-indigo-500/10 border border-indigo-500/20",
                    "hover:text-indigo-300 hover:bg-indigo-500/15 transition-colors"
                  )}
                >
                  <BookOpen size={10} aria-hidden />
                  {message.sources.length} source{message.sources.length !== 1 && "s"}
                </button>
              )}

              <button
                onClick={copyText}
                aria-label={copied ? "Copied!" : "Copy response"}
                className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
              >
                {copied
                  ? <Check size={10} className="text-emerald-400" aria-hidden />
                  : <Copy size={10} aria-hidden />
                }
                {copied ? "Copied" : "Copy"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
