import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-07-29.dahlia",
});

/** Server-side price computation — never trust a client-supplied price. */
export function computeEventListingPriceCents(
  listingType: "STANDARD" | "FEATURED",
  isMosqueOrganized: boolean
): number {
  if (isMosqueOrganized) return 0;
  if (listingType === "FEATURED") return 4900; // $49.00 CAD
  return 2500; // $25.00 CAD
}
