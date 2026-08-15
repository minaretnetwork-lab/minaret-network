# Vendor & Data Flow Inventory

Internal reference document. Update whenever a new third-party data processor is added or its configuration changes.

---

## Database — Supabase (PostgreSQL)

| Item | Value |
|------|-------|
| Provider | Self-hosted Supabase |
| Hosting | Local Docker stack on the Minaret Network Windows host |
| Managed region/plan | Not applicable; this is not a Supabase-hosted project |
| Data processed | All application data: users, professionals, service requests, messages, recommendations |
| Connection | App and Prisma connect to the local Supabase/PostgreSQL services |
| Data residency | The local Windows host and off-repository backup location; confirm any future cloud migration separately |

---

## Authentication — Supabase Auth

| Item | Value |
|------|-------|
| Provider | Self-hosted Supabase Auth; Google is available as an OAuth identity provider |
| Data processed | Email, password hash, OAuth tokens, session metadata |
| Retention | Controlled by the locally configured Auth service and application deletion workflows |

---

## File Storage — Supabase Storage

| Item | Value |
|------|-------|
| Provider | Self-hosted Supabase Storage backed by a local Docker volume |
| Data processed | Profile photos, business logos, gallery images, credential documents |
| Access control | Policies configured in Supabase dashboard — confirm public vs. private bucket settings |

---

## AI / LLM — OpenAI

The AI match assistant sends the visitor's service issue, approximate location text, and available category names to the OpenAI Responses API for classification. It does not send the visitor's account email or phone number to OpenAI in the matching request. If the API is unavailable, the application falls back to local keyword matching.

---

## WhatsApp / Broadcast Notifications

**Outbound broadcast status: not implemented.**

The "broadcast" feature (service requests visible to matching professionals) currently operates through the in-app leads dashboard only. No messages are sent via WhatsApp or any external channel.

The site does provide user-initiated WhatsApp links on eligible professional discovery/contact surfaces. Those links open WhatsApp directly and are separate from the broadcast system.

When WhatsApp is added, document here:
- Whether it uses the Meta Cloud API directly or a Business Solution Provider (BSP)
- Which BSP (Twilio, 360dialog, Gupshup, MessageBird, etc.) if applicable
- Where messages are processed and stored (provider's data region)
- What member data is included in outbound messages (currently: name, description, category, service area — never raw phone number until member explicitly reveals it)

---

## Analytics — Google Analytics and Contentsquare

Google Analytics and Contentsquare are integrated on the real staging application. Contentsquare may provide heatmaps, session replay, and Voice of Customer feedback. Both tools load only after the visitor selects **Accept all** in the cookie banner. Selecting **Essential only** prevents them from loading. The apex and `www` holding-page hosts must not load analytics.

---

## Payments / Stripe — (not yet integrated)

Stripe is planned for billing on listing tiers but has not been connected yet.

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
