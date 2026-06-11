"use client";

import { useState, useRef, useCallback } from "react";
import { streamChat } from "@/lib/api";
import type { Message, SourcePassage } from "@/lib/types";

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

export function useChat(documentId: string | null, model: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (question: string) => {
      if (!documentId || isStreaming) return;

      // Append user message
      const userMsg: Message = { id: makeId(), role: "user", content: question, timestamp: Date.now() };
      const assistantId = makeId();
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        streaming: true,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      abortRef.current = new AbortController();

      try {
        let sources: SourcePassage[] = [];

        for await (const event of streamChat(
          documentId,
          question,
          model,
          abortRef.current.signal
        )) {
          if (event.type === "sources") {
            sources = event.data;
            // Attach sources to the assistant message as soon as we have them
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, sources } : m
              )
            );
          } else if (event.type === "token") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + event.data }
                  : m
              )
            );
          } else if (event.type === "done") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, streaming: false } : m
              )
            );
          }
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content || "_(cancelled)_", streaming: false }
                : m
            )
          );
        } else {
          const errMsg =
            (e as Error).message.includes("Ollama") ||
            (e as Error).message.includes("503")
              ? "⚠️ Cannot reach Ollama. Make sure it is running: `ollama serve`"
              : `⚠️ Error: ${(e as Error).message}`;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: errMsg, streaming: false }
                : m
            )
          );
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [documentId, model, isStreaming]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isStreaming, send, stop, clear };
}
