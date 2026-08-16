"use server";

import { prisma } from "@/lib/prisma";
import { computeEventListingPriceCents, getStripeClient } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface SubmitEventListingInput {
  organizerName: string;
  organizerContact: string;
  title: string;
  description: string;
  eventDate: string; // ISO string from client
  location: string;
  listingType: "STANDARD" | "FEATURED";
  isMosqueOrganized: boolean;
  mosqueName?: string;
  mosqueAuthorizationConfirmed?: boolean;
}

/**
 * Creates an event listing row and returns either:
 *   { checkoutUrl: string }  — for paid listings (redirect to Stripe)
 *   { success: true }        — for mosque-organized free listings (immediate activation)
 */
export async function submitEventListing(input: SubmitEventListingInput): Promise<
  { checkoutUrl: string } | { success: true }
> {
  const user = await getCurrentUser();

  // Validate mosque fields server-side
  if (input.isMosqueOrganized) {
    if (!input.mosqueName?.trim()) throw new Error("Mosque name is required for mosque-organized listings.");
    if (!input.mosqueAuthorizationConfirmed) throw new Error("You must confirm authorization to submit on behalf of this mosque.");
  }

  const eventDate = new Date(input.eventDate);
  if (isNaN(eventDate.getTime())) throw new Error("Invalid event date.");
  if (eventDate < new Date()) throw new Error("Event date must be in the future.");

  // Server-side price — ignore any client-supplied price field
  const listingType = input.listingType === "FEATURED" ? "FEATURED" : "STANDARD";
  const priceChargedCents = computeEventListingPriceCents(listingType, input.isMosqueOrganized);

  if (input.isMosqueOrganized) {
    // Mosque-organized: free, straight to active
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiresAt = eventDate < thirtyDays ? eventDate : thirtyDays;

    await prisma.eventListing.create({
      data: {
        organizerUserId: user?.id ?? null,
        organizerName: input.organizerName.trim(),
        organizerContact: input.organizerContact.trim(),
        title: input.title.trim(),
        description: input.description.trim(),
        eventDate,
        location: input.location.trim(),
        listingType,
        isMosqueOrganized: true,
        mosqueName: input.mosqueName!.trim(),
        mosqueAuthorizationConfirmedAt: now,
        status: "ACTIVE",
        priceChargedCents: 0,
        expiresAt,
      },
    });

    revalidatePath("/events");
    return { success: true };
  }

  // Paid listing: create as PENDING_PAYMENT, then create Stripe session
  const listing = await prisma.eventListing.create({
    data: {
      organizerUserId: user?.id ?? null,
      organizerName: input.organizerName.trim(),
      organizerContact: input.organizerContact.trim(),
      title: input.title.trim(),
      description: input.description.trim(),
      eventDate,
      location: input.location.trim(),
      listingType,
      isMosqueOrganized: false,
      status: "PENDING_PAYMENT",
      priceChargedCents,
    },
  });

  const stripe = getStripeClient();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "cad",
          product_data: {
            name: `${listingType === "FEATURED" ? "Featured" : "Standard"} Event Listing — ${input.title.trim()}`,
            description: "30-day community event listing on Minaret Network (or until event date, whichever comes first).",
          },
          unit_amount: priceChargedCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      eventListingId: listing.id,
    },
    success_url: `${baseUrl}/events/submit/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/events/submit?cancelled=1`,
  });

  // Store the session ID so the webhook can match it
  await prisma.eventListing.update({
    where: { id: listing.id },
    data: { stripeCheckoutSessionId: session.id },
  });

  return { checkoutUrl: session.url! };
}

export async function reportEventListing(
  eventListingId: string,
  reason: string,
  detail?: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("You must be signed in to report a listing.");

  await prisma.eventListingReport.create({
    data: {
      eventListingId,
      reportedById: user.id,
      reason,
      detail: detail?.trim() || null,
    },
  });
}

// ── Admin actions ────────────────────────────────────────────────────────────

export async function adminRemoveEventListing(id: string, removalReason: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }
  if (!removalReason.trim()) throw new Error("Removal reason is required.");

  await prisma.eventListing.update({
    where: { id },
    data: {
      status: "REMOVED",
      removalReason: removalReason.trim(),
      removedAt: new Date(),
    },
  });

  revalidatePath("/admin/events");
  revalidatePath("/events");
}

export async function adminResolveEventReport(
  reportId: string,
  status: "ACTIONED" | "DISMISSED",
  resolutionNote?: string
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }

  await prisma.eventListingReport.update({
    where: { id: reportId },
    data: {
      status,
      resolutionNote: resolutionNote?.trim() || null,
      resolvedAt: new Date(),
    },
  });

  revalidatePath("/admin/events");
}

/** Public query: only ACTIVE listings that haven't expired yet. */
export async function getPublicEventListings() {
  return prisma.eventListing.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    orderBy: [
      { listingType: "desc" }, // FEATURED first
      { eventDate: "asc" },
    ],
  });
}

export async function getPublicEventListing(id: string) {
  return prisma.eventListing.findFirst({
    where: { id, status: "ACTIVE", expiresAt: { gt: new Date() } },
  });
}

export async function getAdminEventListings() {
  return prisma.eventListing.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reports: { where: { status: "OPEN" }, select: { id: true } },
    },
  });
}
