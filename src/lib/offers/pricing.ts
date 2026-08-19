export const TIER_PRICING = {
  WEEKEND:  { label: "Weekend",  price: 4.99,  description: "Up to 3 days" },
  STANDARD: { label: "Standard", price: 9.99,  description: "4–7 days" },
  FEATURED: { label: "Featured", price: 19.99, description: "8–30 days · shown first" },
} as const;

export type OfferTierKey = keyof typeof TIER_PRICING;

export function getTierFromDays(days: number): OfferTierKey {
  if (days <= 3) return "WEEKEND";
  if (days <= 7) return "STANDARD";
  return "FEATURED";
}

export function getPriceForDays(days: number): number {
  return TIER_PRICING[getTierFromDays(days)].price;
}
