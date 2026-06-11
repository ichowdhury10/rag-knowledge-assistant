"use client";

import { useEffect, type RefObject } from "react";

/**
 * Fires `handler` when a click or touch occurs outside `ref`.
 * Attach `ref` to the container you want to detect "outside" of.
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void,
  enabled = true
): void {
  useEffect(() => {
    if (!enabled) return;

    function onEvent(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handler();
      }
    }

    // Use capture phase so the handler runs before any stopPropagation
    document.addEventListener("mousedown", onEvent, true);
    document.addEventListener("touchstart", onEvent, true);

    return () => {
      document.removeEventListener("mousedown", onEvent, true);
      document.removeEventListener("touchstart", onEvent, true);
    };
  }, [ref, handler, enabled]);
}
