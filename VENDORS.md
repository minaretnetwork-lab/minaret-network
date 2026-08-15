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

## AI / LLM — (none currently connected)

No OpenAI, Anthropic, or other LLM API is currently wired into the application.

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
