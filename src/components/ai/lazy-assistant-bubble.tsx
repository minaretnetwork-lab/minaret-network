"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const AssistantBubble = dynamic(
  () => import("@/components/ai/assistant-bubble").then((mod) => mod.AssistantBubble),
  { ssr: false, loading: () => null }
);

export function LazyAssistantBubble() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(() => setReady(true), { timeout: 2500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(() => setReady(true), 1200);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  return ready ? <AssistantBubble /> : null;
}
