"use client";

import { useState, useEffect, useCallback } from "react";
import * as api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import type { Document } from "@/lib/types";

export function useDocuments() {
  const toast = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const docs = await api.listDocuments();
      setDocuments(docs);
    } catch {
      toast.error("Could not load documents — is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { refresh(); }, [refresh]);

  const upload = useCallback(
    async (file: File): Promise<Document | null> => {
      setUploading(true);
      try {
        const doc = await api.uploadDocument(file);
        setDocuments((prev) => [doc, ...prev]);
        toast.success(`"${doc.name}" indexed — ${doc.chunks} chunks`);
        return doc;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
        return null;
      } finally {
        setUploading(false);
      }
    },
    [toast]
  );

  const remove = useCallback(
    async (id: string, name?: string) => {
      try {
        await api.deleteDocument(id);
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        toast.info(name ? `"${name}" removed` : "Document removed");
      } catch {
        toast.error("Failed to delete document");
      }
    },
    [toast]
  );

  return { documents, loading, uploading, upload, remove, refresh };
}
