# Vendor & Data Flow Inventory

Internal reference document. Update whenever a new third-party data processor is added or its configuration changes.

---

## Database — Supabase (PostgreSQL)

| Item | Value |
|------|-------|
| Provider | Supabase |
| Region | `us-east-1` (AWS) |
| Plan | Free / Pro — confirm in Supabase dashboard |
| Data processed | All application data: users, professionals, service requests, messages, recommendations |
| Connection | App uses the pgbouncer pooler URL for queries; `DIRECT_URL` for Prisma migrations |
| Data residency | United States |
| DPA | Supabase Data Processing Agreement — available at supabase.com/legal |

---

## Authentication — Supabase Auth

| Item | Value |
|------|-------|
| Provider | Supabase |
| Data processed | Email, password hash, OAuth tokens, session metadata |
| Retention | Sessions expire per Supabase defaults; deleted accounts purge on Supabase's schedule |

---

## File Storage — Supabase Storage

| Item | Value |
|------|-------|
| Provider | Supabase Storage (backed by S3 in `us-east-1`) |
| Data processed | Profile photos, business logos, gallery images, credential documents |
| Access control | Policies configured in Supabase dashboard — confirm public vs. private bucket settings |

---

## AI / LLM — OpenAI

| Item | Value |
|------|-------|
| Provider | OpenAI (platform.openai.com) |
| Integration point | `src/app/api/ai/match-request/route.ts` — category/location classification for service-request matching |
| Model in use | Confirm in code (`OPENAI_API_KEY` env var; model name logged in route) |
| Data sent | User's free-text service-request description + category list (no PII, no phone, no email) |
| Retention | OpenAI standard API: ~30-day abuse-monitoring retention by default; not used for model training (confirm at platform.openai.com/account/data-controls) |
| ZDR | Zero Data Retention agreement not yet in place — evaluate if volume or data sensitivity warrants it |
| Fallback | Keyword-scoring fallback (`fallbackClassify`) runs locally if `OPENAI_API_KEY` is unset — no data sent externally in that case |
| Last verified | 2026-08-15 |

---

## WhatsApp / Broadcast Notifications

**Current status: not implemented.**

The "broadcast" feature (service requests visible to matching professionals) currently operates through the in-app leads dashboard only. No messages are sent via WhatsApp or any external channel.

When WhatsApp is added, document here:
- Whether it uses the Meta Cloud API directly or a Business Solution Provider (BSP)
- Which BSP (Twilio, 360dialog, Gupshup, MessageBird, etc.) if applicable
- Where messages are processed and stored (provider's data region)
- What member data is included in outbound messages (currently: name, description, category, service area — never raw phone number until member explicitly reveals it)

---

## Analytics — (none currently)

No Google Analytics, GA4, Mixpanel, or other analytics vendor is currently integrated.

---

## Payments — Stripe

| Item | Value |
|------|-------|
| Provider | Stripe (stripe.com) |
| Integration point | `src/lib/stripe.ts` (singleton), `src/lib/actions/event-listings.ts` (Checkout session creation), `src/app/api/webhooks/stripe/route.ts` (webhook handler) |
| Feature | Event listing payments — one-time Checkout sessions for STANDARD ($25 CAD) and FEATURED ($49 CAD) event listings |
| Data sent | Listing metadata (title, organizer name, listing type) via Stripe Checkout `line_items` and `metadata`; no PII beyond organizer contact (stored locally, not sent to Stripe) |
| Webhook | `checkout.session.completed` — Stripe calls our webhook endpoint; signature verified with `stripe.webhooks.constructEvent` before any DB write |
| Price security | Server-side only — `computeEventListingPriceCents()` in `src/lib/stripe.ts`; client never supplies a price |
| Key env vars | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL` |
| Data residency | Stripe US (default); confirm in Stripe Dashboard &gt; Settings &gt; Data localization |
| DPA | Stripe Data Processing Agreement — stripe.com/legal/dpa |
| Last verified | 2026-08-15 |

---

## Broadcast Log

All service-request broadcasts (platform channel or future WhatsApp) are recorded in the `broadcast_logs` table:

| Column | Description |
|--------|-------------|
| `service_request_id` | The request that was broadcast |
| `professional_id` | The professional who received the notification |
| `channel` | `platform` (leads dashboard) or `whatsapp` when implemented |
| `sent_at` | Timestamp of the broadcast event |

This log is the primary audit trail for demonstrating that member data was shared only with professionals in the broadcast-eligible tier.
