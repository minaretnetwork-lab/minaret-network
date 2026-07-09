"use client";

import { useEffect } from "react";
import { trackFeaturedImpression } from "@/lib/actions/featured";

export function FeaturedImpressionTracker({ ids }: { ids: string[] }) {
  useEffect(() => {
    ids.forEach((id) => {
      trackFeaturedImpression(id).catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
