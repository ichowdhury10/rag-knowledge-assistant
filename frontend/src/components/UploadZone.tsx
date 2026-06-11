"use client";

import { useRef, useState, DragEvent } from "react";
import { UploadCloud, Loader2, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onFile: (file: File) => void;
  uploading: boolean;
}

type ZoneState = "idle" | "hover" | "reject";

export default function UploadZone({ onFile, uploading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ZoneState>("idle");
  const [pendingName, setPendingName] = useState<string | null>(null);

  function isAllowed(file: File) {
    return file.type === "application/pdf" || file.type === "text/plain" || file.name.endsWith(".txt");
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) { setState("idle"); return; }
    if (!isAllowed(file)) {
      setState("reject");
      setTimeout(() => setState("idle"), 2000);
      return;
    }
    setState("idle");
    setPendingName(file.name);
    onFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPendingName(file.name);
      onFile(file);
    }
    e.target.value = "";
  }

  // Reset pending name when upload finishes
  if (!uploading && pendingName && state === "idle") {
    // Keep name visible briefly via the uploading prop transition
  }

  return (
    <div
      role="button"
      tabIndex={uploading ? -1 : 0}
      aria-label="Upload a PDF or TXT document"
      aria-busy={uploading}
      onClick={() => !uploading && inputRef.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !uploading) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => { e.preventDefault(); if (!uploading) setState("hover"); }}
      onDragLeave={() => setState("idle")}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl",
        "py-4 px-3 cursor-pointer select-none transition-all duration-200",
        "border-2 border-dashed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
        state === "hover" && !uploading
          ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
          : state === "reject"
          ? "border-red-500/60 bg-red-500/8"
          : "border-white/10 hover:border-white/20 hover:bg-white/3",
        uploading && "pointer-events-none"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf,.txt,text/plain"
        className="sr-only"
        onChange={handleChange}
        tabIndex={-1}
        aria-hidden
      />

      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
        uploading ? "bg-indigo-500/20" : state === "reject" ? "bg-red-500/15" : "bg-slate-800/80"
      )}>
        {uploading ? (
          <Loader2 size={16} className="text-indigo-400 animate-spin" aria-hidden />
        ) : state === "reject" ? (
          <FileWarning size={16} className="text-red-400" aria-hidden />
        ) : (
          <UploadCloud size={16} className={cn(state === "hover" ? "text-indigo-400" : "text-slate-500")} aria-hidden />
        )}
      </div>

      <div className="text-center">
        {uploading ? (
          <>
            <p className="text-xs font-medium text-indigo-400">Processing…</p>
            {pendingName && (
              <p className="text-[10px] text-slate-600 mt-0.5 truncate max-w-[160px]">
                {pendingName}
              </p>
            )}
          </>
        ) : state === "reject" ? (
          <p className="text-xs font-medium text-red-400">PDF or TXT only</p>
        ) : (
          <>
            <p className="text-xs font-medium text-slate-400">
              {state === "hover" ? "Drop it!" : "Upload PDF or TXT"}
            </p>
            <p className="text-[10px] text-slate-600 mt-0.5">or drag & drop</p>
          </>
        )}
      </div>
    </div>
  );
}
