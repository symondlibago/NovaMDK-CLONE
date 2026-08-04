
const isBrowser = typeof window !== "undefined";
const DEBUG = !!(import.meta && import.meta.env && import.meta.env.DEV);

/** The complete catalogue of events we record. Add to this list intentionally. */
export const EVENTS = {
  PAGE_VIEW: "page_view",
  CATEGORY_SELECTED: "category_selected", // chose a treatment goal/category
  BROWSE_TREATMENTS: "browse_treatments", // opened the treatments catalog
  PRODUCT_VIEWED: "product_viewed",       // viewed a product detail page
  START_VISIT: "start_visit",             // launched the MDIntegrations intake (key conversion)
  QUIZ_STARTED: "quiz_started",           // began the guided assessment
  QUIZ_COMPLETED: "quiz_completed",       // finished the guided assessment
  CONTACT_SUBMITTED: "contact_submitted", // submitted the contact form
};

// Forward to your analytics provider. Uncomment the one you adopt.
function send(event, props) {
  if (!isBrowser) return; 
  (window.nvAnalytics = window.nvAnalytics || []).push({ event, props, t: Date.now() });
}

// Don't record anything inside the Design Studio's `?preview` iframe.
function isPreview() {
  return isBrowser && new URLSearchParams(window.location.search).has("preview");
}

/** Record a curated event. Unknown event names are allowed but discouraged. */
export function track(event, props = {}) {
  if (isPreview()) return;
  if (DEBUG) console.debug("[analytics]", event, props);
  try {
    send(event, props);
  } catch {
    /* analytics must never break the app */
  }
}

/** Convenience helper for route changes. */
export function trackPageView(path) {
  track(EVENTS.PAGE_VIEW, { path });
}
