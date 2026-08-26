"use server";

import { prisma } from "@/lib/prisma";
import { computeEventListingPriceCents, getStripeClient } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const FREE_UNTIL = new Date("2026-11-01T00:00:00.000Z");

export interface SubmitEventListingInput {
  organizerName: string;
  organizerContact: string;
  title: string;
  description: string;
  eventDate: string;       // ISO string from client
  eventEndDate?: string;   // optional, ISO string
  isRecurring?: boolean;
  recurrenceNote?: string;
  location: string;
  listingType: "STANDARD" | "FEATURED";
  isMosqueOrganized: boolean;
  mosqueName?: string;
  mosqueAuthorizationConfirmed?: boolean;
  imageUrl?: string;
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

  const eventEndDate = input.eventEndDate ? new Date(input.eventEndDate) : null;
  if (eventEndDate && eventEndDate < eventDate) throw new Error("End date must be on or after the start date.");

  // Server-side price — ignore any client-supplied price field
  const listingType = input.listingType === "FEATURED" ? "FEATURED" : "STANDARD";
  const isPromo = new Date() < FREE_UNTIL;
  const priceChargedCents = isPromo ? 0 : computeEventListingPriceCents(listingType, input.isMosqueOrganized);

  if (input.isMosqueOrganized || isPromo) {
    // Free path: mosque-organized always, or any listing during promo period
    const now = new Date();
    await prisma.eventListing.create({
      data: {
        organizerUserId: user?.id ?? null,
        organizerName: input.organizerName.trim(),
        organizerContact: input.organizerContact.trim(),
        title: input.title.trim(),
        description: input.description.trim(),
        eventDate,
        eventEndDate,
        isRecurring: input.isRecurring ?? false,
        recurrenceNote: input.recurrenceNote?.trim() || null,
        location: input.location.trim(),
        listingType,
        isMosqueOrganized: input.isMosqueOrganized,
        mosqueName: input.isMosqueOrganized ? input.mosqueName!.trim() : null,
        mosqueAuthorizationConfirmedAt: input.isMosqueOrganized ? now : null,
        status: "PENDING_ADMIN",
        priceChargedCents,
        imageUrl: input.imageUrl ?? null,
      },
    });

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
      eventEndDate,
      isRecurring: input.isRecurring ?? false,
      recurrenceNote: input.recurrenceNote?.trim() || null,
      location: input.location.trim(),
      listingType,
      isMosqueOrganized: false,
      status: "PENDING_PAYMENT",
      priceChargedCents,
      imageUrl: input.imageUrl ?? null,
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

export async function adminSetEventFeatured(id: string, featured: boolean) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }
  await prisma.eventListing.update({
    where: { id },
    data: { listingType: featured ? "FEATURED" : "STANDARD" },
  });
  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/");
}

export async function adminApproveEventListing(id: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }

  const listing = await prisma.eventListing.findUnique({ where: { id } });
  if (!listing) throw new Error("Listing not found");

  const now = new Date();
  // Listing expires at end of the last event day (midnight after eventEndDate, or eventDate if single-day)
  const lastDay = listing.eventEndDate ?? listing.eventDate;
  const expiresAt = new Date(lastDay);
  expiresAt.setHours(23, 59, 59, 999);

  await prisma.eventListing.update({
    where: { id },
    data: { status: "ACTIVE", approvedAt: now, expiresAt },
  });

  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/");
}

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
