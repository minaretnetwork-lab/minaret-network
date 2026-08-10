const VISITOR_ID_KEY = "minaret:visitor-id";

type AnalyticsPayload = {
  eventType: "PAGE_VIEW" | "HOME_SEARCH";
  path?: string;
  searchTerm?: string;
  region?: string;
};

function getVisitorId() {
  try {
    const existing = window.localStorage.getItem(VISITOR_ID_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.localStorage.setItem(VISITOR_ID_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export function trackAnalyticsEvent(payload: AnalyticsPayload) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify({
    ...payload,
    visitorId: getVisitorId(),
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/analytics/event", blob);
    return;
  }

  fetch("/api/analytics/event", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
    keepalive: true,
  }).catch(() => {});
}
