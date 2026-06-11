"use client";

import { FileText, Trash2, FolderOpen, Layers } from "lucide-react";
import UploadZone from "@/components/UploadZone";
import { DocumentRowSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { useDocuments } from "@/hooks/useDocuments";
import { cn, formatBytes, truncate } from "@/lib/utils";
import type { Document } from "@/lib/types";

interface Props {
  selectedDoc: Document | null;
  onSelectDoc: (doc: Document | null) => void;
}

export default function Sidebar({ selectedDoc, onSelectDoc }: Props) {
  const { documents, loading, uploading, upload, remove } = useDocuments();

  async function handleFile(file: File) {
    const doc = await upload(file);
    if (doc) onSelectDoc(doc);
  }

  async function handleDelete(e: React.MouseEvent, doc: Document) {
    e.stopPropagation();
    await remove(doc.id, doc.name);
    if (selectedDoc?.id === doc.id) onSelectDoc(null);
  }

  return (
    <aside
      aria-label="Documents"
      className="w-64 shrink-0 flex flex-col h-full border-r border-white/5 bg-slate-900/70 backdrop-blur-md"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-1.5">
          <Layers size={13} className="text-slate-500" aria-hidden />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Documents
          </span>
        </div>
        {documents.length > 0 && (
          <span className="text-[10px] font-mono text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded-full">
            {documents.length}
          </span>
        )}
      </div>

      {/* ── Document list ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-1.5" role="list">

        {/* Skeleton loading */}
        {loading && (
          <>
            <DocumentRowSkeleton />
            <DocumentRowSkeleton />
            <DocumentRowSkeleton />
          </>
        )}

        {/* Empty state */}
        {!loading && documents.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-4 pt-10 pb-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800/80 border border-white/5">
              <FolderOpen size={18} className="text-slate-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">No documents yet</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Upload a PDF below to begin</p>
            </div>
          </div>
        )}

        {/* Document items */}
        {documents.map((doc) => {
          const active = selectedDoc?.id === doc.id;
          return (
            <div
              key={doc.id}
              role="listitem"
              className={cn(
                "group relative flex items-start gap-2.5 px-3 py-2.5",
                "border-l-2 cursor-pointer transition-all duration-150",
                active
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-transparent hover:border-white/10 hover:bg-white/4"
              )}
              onClick={() => onSelectDoc(active ? null : doc)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectDoc(active ? null : doc);
                }
              }}
              tabIndex={0}
              aria-selected={active}
              aria-label={`${doc.name}, ${doc.chunks} chunks, ${formatBytes(doc.size)}`}
            >
              {/* File icon */}
              <div className={cn(
                "mt-0.5 shrink-0 p-1 rounded-md transition-colors",
                active ? "bg-indigo-500/20" : "bg-slate-800 group-hover:bg-slate-700"
              )}>
                <FileText
                  size={12}
                  className={active ? "text-indigo-400" : "text-slate-500"}
                  aria-hidden
                />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-xs font-medium truncate leading-tight",
                  active ? "text-indigo-300" : "text-slate-300 group-hover:text-slate-200"
                )}>
                  {truncate(doc.name, 26)}
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5 tabular-nums">
                  {doc.chunks} chunks · {formatBytes(doc.size)}
                </p>
              </div>

              {/* Delete */}
              <Button
                variant="danger"
                size="xs"
                iconOnly
                onClick={(e) => handleDelete(e, doc)}
                aria-label={`Delete ${doc.name}`}
                className={cn(
                  "mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
                  active && "opacity-100"
                )}
              >
                <Trash2 size={12} aria-hidden />
              </Button>
            </div>
          );
        })}
      </div>

      {/* ── Upload zone ─────────────────────────────────────────────────── */}
      <div className="p-3 border-t border-white/5">
        <UploadZone onFile={handleFile} uploading={uploading} />
      </div>
    </aside>
  );
}
