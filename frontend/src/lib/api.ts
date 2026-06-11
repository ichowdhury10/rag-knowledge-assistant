import type { Document, SourcePassage } from "./types";

// In Docker: API_URL is set server-side in next.config.mjs rewrites, so the
// browser always calls /api/* on the same origin.
const BASE = "/api";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Documents ──────────────────────────────────────────────────────────────

export async function listDocuments(): Promise<Document[]> {
  return handleResponse(await fetch(`${BASE}/documents`));
}

export async function uploadDocument(file: File): Promise<Document> {
  const form = new FormData();
  form.append("file", file);
  return handleResponse(
    await fetch(`${BASE}/documents/upload`, { method: "POST", body: form })
  );
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${BASE}/documents/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
}

// ── Models ─────────────────────────────────────────────────────────────────

export async function listModels(): Promise<string[]> {
  const data = await handleResponse<{ models: string[] }>(
    await fetch(`${BASE}/models`)
  );
  return data.models;
}

// ── Chat stream ────────────────────────────────────────────────────────────

export type StreamEvent =
  | { type: "sources"; data: SourcePassage[] }
  | { type: "token"; data: string }
  | { type: "done" };

export async function* streamChat(
  documentId: string,
  question: string,
  model: string,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const res = await fetch(`${BASE}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: documentId, question, model }),
    signal,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail ?? `HTTP ${res.status}`);
  }

  if (!res.body) throw new Error("Empty response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Split on double-newline (SSE event boundary) while keeping partial events
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data: ")) continue;
      try {
        yield JSON.parse(line.slice(6)) as StreamEvent;
      } catch {
        // Malformed chunk — skip
      }
    }
  }
}
