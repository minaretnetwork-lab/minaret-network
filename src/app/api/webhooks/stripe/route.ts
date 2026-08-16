import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";

// Stripe requires the raw body for signature verification — disable Next.js body parsing.
export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const eventListingId = session.metadata?.eventListingId;

    if (!eventListingId) {
      console.warn("checkout.session.completed received with no eventListingId in metadata");
      return NextResponse.json({ ok: true });
    }

    const listing = await prisma.eventListing.findUnique({
      where: { id: eventListingId },
    });

    if (!listing) {
      console.error(`EventListing not found for id: ${eventListingId}`);
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Only activate if still PENDING_PAYMENT — idempotent
    if (listing.status === "PENDING_PAYMENT") {
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiresAt = listing.eventDate < thirtyDays ? listing.eventDate : thirtyDays;

      await prisma.eventListing.update({
        where: { id: eventListingId },
        data: {
          status: "ACTIVE",
          expiresAt,
          stripePaymentIntentId: typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
        },
      });

      console.log(`EventListing ${eventListingId} activated via Stripe webhook`);
    }
  }

  return NextResponse.json({ ok: true });
}
