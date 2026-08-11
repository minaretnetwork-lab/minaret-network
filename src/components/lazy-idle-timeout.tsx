"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const IdleTimeout = dynamic(
  () => import("@/components/idle-timeout").then((mod) => mod.IdleTimeout),
  { ssr: false, loading: () => null }
);

export function LazyIdleTimeout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(() => setReady(true), { timeout: 3000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(() => setReady(true), 1500);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  return ready ? <IdleTimeout /> : null;
}

