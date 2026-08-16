import Stripe from "stripe";

// Lazy — only instantiated when actually called, so missing key doesn't crash page renders.
let _stripe: Stripe | null = null;
export function getStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-07-29.dahlia" });
  return _stripe;
}

/** Server-side price computation — never trust a client-supplied price. */
export function computeEventListingPriceCents(
  listingType: "STANDARD" | "FEATURED",
  isMosqueOrganized: boolean
): number {
  if (isMosqueOrganized) return 0;
  if (listingType === "FEATURED") return 4900; // $49.00 CAD
  return 2500; // $25.00 CAD
}
