# Minaret Network

Minaret Network is a mosque-community professional directory and service marketplace for the Greater Toronto Area. Community members can discover professionals, request help, and communicate through the platform. Professionals can manage listings and respond to matching requests. Administrators moderate the directory, consent, recommendations, events, promotions, and operational reporting.

> **Updated August 20, 2026.** This README reflects the current cloud deployment. Historical documents in the repository describe a retired self-hosted stack and are not operational instructions.

## Current state at a glance

| Item | Current state |
|---|---|
| Source branch | `master` |
| Hosting | Vercel (cloud) |
| Live URL | `https://minaretnetwork.ca` |
| Custom domain | `minaretnetwork.ca` — connected (Cloudflare DNS → Vercel) |
| Database / Auth / Storage | Cloud Supabase (`osmlhdskgvigfprzpnrn.supabase.co`) |
| Geocoding | Nominatim API + bundled GTA/Ontario coordinate fallback |
| Deployment | Push to `master` on `mn` remote → Vercel auto-deploys |
| Retired infrastructure | Windows Task Scheduler, Docker Desktop, local Supabase, Cloudflare Tunnel, Nominatim container |

## Repository workflow

| Remote | URL |
|---|---|
| `mn` | `https://github.com/minaretnetwork-lab/minaret-network.git` (primary — Vercel watches this) |
| `origin` | `https://github.com/Gobbledegookie/minaret-network.git` (legacy — do not push here) |

Always push to `mn`. Pushing to `mn master` triggers an automatic Vercel deployment.

```bash
git push mn master
```

## Product capabilities

### Public discovery

- Professional directory with keyword, category, mosque, language, gender, badge, and service-area filters
- Name and business autocomplete from the homepage
- GPS/location assistance and city autocomplete
- Nearest-area fallback when an exact local match is unavailable
- Multiple categories and service areas per professional listing
- Public professional detail pages, galleries, contact methods, availability, and recommendations
- Sign-in gate for contact information and resumable messaging after authentication
- Mosque-affiliation, community-recommendation, and admin-approved presentation
- Mission, privacy, terms, advertising, category, and "Before You Hire" transparency pages
- Responsive desktop/mobile navigation and dashboard layouts

### Accounts and authentication

- Google OAuth through Supabase Auth (primary)
- Email/password authentication through Supabase Auth
- Account profile management, phone/WhatsApp preferences, and account deletion
- Sixty-minute inactivity sign-out
- Provider-verification indicator for OAuth-backed accounts
- Terms/privacy re-consent gate driven by `CURRENT_TOS_VERSION`
- Age attestation, listing consent, mosque-affiliation consent, and broadcast consent records
- Cookie choice between essential-only and optional external analytics

### Professional listings

- Multi-step registration wizard
- Multiple listings per user
- Multiple categories and service areas per listing
- Business address, walk-in availability, languages, schedule, bio, credentials, gallery, photo, and logo
- Client-side image shrinking plus server-side upload validation (stored in Supabase Storage)
- Application statuses: `PENDING`, `WITHDRAWN`, `APPROVED`, `REJECTED`, `SUSPENDED`
- Owner edit, withdraw/resubmit, and guarded deletion flows
- Pending edit drafts so approved listings can remain live while changes await review
- Optional public mosque-affiliation display toggle
- Listing tiers: `STANDARD`, `FEATURED`, `SPONSORED`, `BROADCAST_ELIGIBLE`
- Regulated-profession and broadcast-consent gates

### Service requests and messaging

- Typeform-style service request flow with category, service area, description, date, and contact preference
- Draft preservation through sign-in when authentication is needed at submission
- Category/location matching to eligible professionals
- Nearest-distance controls for incoming requests
- Incoming lead alerts and professional lead dashboard
- Request statuses, close/reopen controls, and user/professional archiving
- Request-linked conversations, unread indicators, Enter-to-send, and closed-chat locking
- Phone, WhatsApp, email, and internal-message response options

### AI matching

- Optional OpenAI-assisted request classification using live database categories and approved listings
- Local keyword-scoring fallback when `OPENAI_API_KEY` is absent
- Location-aware results and nearby fallback
- Direct contact, profile, message, or service-request continuation from suggestions

### Community events

- Public event index and detail pages
- Event submission with free promo active until Oct 31, 2026 (all tiers free during promo)
- Free mosque-organized events with authorization attestation
- Paid standard and featured event listings through Stripe Checkout (post-promo: $25 / $49 CAD)
- Stripe webhook activation, expiry dates, reporting, and admin moderation
- Hourly expiry sweep via Vercel Cron for expired events and stale promotion flags

### Community offers

- Professionals can post limited-time deals/promotions
- Flip-card UI: image on front, contact details on back
- Admin moderation (PENDING → ACTIVE/REJECTED)
- Homepage and browse page display

### Administration

- Professional application/detail review, approve, reject, suspend, and affiliation controls
- Pending professional edit review
- Super-admin promotion/demotion and account suspension tools
- Searchable Users page with sortable columns and independent professional/admin status badges
- Category creation and category-suggestion moderation
- Mosque administration and mosque-suggestion moderation
- Recommendation moderation, reporting, and removal
- Service-request and event moderation
- Featured/sponsored placement, waitlist, and pricing-tier management
- Revenue summary by mosque
- Visitor, search, location, listing, and engagement analytics
- Mobile admin navigation and notification counts

## Technology stack

- Next.js `16.2.10` App Router
- React `19.2.4`
- TypeScript 5
- Tailwind CSS 4
- Prisma `5.22`
- PostgreSQL (cloud Supabase)
- Supabase Auth, Storage, REST/PostgREST (cloud)
- Google OAuth
- Optional OpenAI API
- Optional Stripe Checkout/webhooks
- Consent-gated Google Analytics and Contentsquare
- Vercel hosting and Vercel Cron

## Deployment architecture

```text
Browser
  |
  | HTTPS
  v
Vercel (minaretnetwork.ca / minaret-network-cyan.vercel.app)
  |-- Next.js App Router (serverless functions)
  |-- Vercel Cron → /api/cron/expire (hourly)
  |
  v
Cloud Supabase (osmlhdskgvigfprzpnrn.supabase.co)
  |-- PostgreSQL (application data)
  |-- Auth (Google OAuth + email/password)
  `-- Storage (professional-photos, professional-logos,
               offer-images, event-images)
```

### Deployment flow

1. Push to `master` on the `mn` remote
2. Vercel detects the push and starts a new build automatically
3. Build runs `next build` with environment variables from Vercel project settings
4. Deploy goes live at the Vercel URL (~1 minute after push)

No manual build or restart step is required.

## Environment configuration

Secrets are stored in Vercel project environment variables — never committed to Git. For local development, copy `.env.local.example` to `.env.local` and fill in values.

### Core values

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection (pooled) |
| `DIRECT_URL` | Supabase PostgreSQL direct connection (for migrations) |
| `NEXT_PUBLIC_SUPABASE_URL` | Cloud Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged Supabase key — server only |
| `NEXT_PUBLIC_SITE_URL` | Canonical app/auth redirect origin (must match Supabase allowed redirect URLs) |
| `NEXT_PUBLIC_DEFAULT_MOSQUE_SLUG` | Default community context (`al-falah`) |
| `CRON_SECRET` | Protects the hourly expiry endpoint |

### Feature-specific values

| Variable | Required for |
|---|---|
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` | Displaying Google sign-in |
| `OPENAI_API_KEY` | OpenAI matching instead of local fallback |
| `OPENAI_MATCH_MODEL` | Optional model override |
| `STRIPE_SECRET_KEY` | Paid event Checkout creation |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `NEXT_PUBLIC_BASE_URL` | Stripe success/cancel URLs |

`NEXT_PUBLIC_*` values are embedded at build time. Changing them in Vercel triggers a new build automatically if set before the push; otherwise redeploy manually from the Vercel dashboard.

## Local development

```bash
npm install
npx prisma generate
cp .env.local.example .env.local   # fill in Supabase credentials
npm run dev
```

The dev server runs on `http://localhost:3000`. Google OAuth requires the callback URL to be registered in both Google Cloud Console and Supabase Auth settings.

## Database changes

```bash
npm run db:generate   # regenerate Prisma client after schema changes
npm run db:push       # push schema to cloud Supabase (take a backup first)
npm run db:studio     # open Prisma Studio
```

Always take a Supabase backup before pushing schema changes. Use the Supabase dashboard → Database → Backups, or the Supabase CLI.

## Authentication

Google OAuth callback registered at:

```
https://minaret-network-cyan.vercel.app/auth/callback
```

Both this URL and the Vercel site URL must appear in the Supabase project's **Auth → URL Configuration → Redirect URLs** list. If `NEXT_PUBLIC_SITE_URL` is changed, update Supabase redirect URLs to match or Google OAuth will silently redirect to the home page instead of signing in.

Important behavior:

- Google is the primary login option; email/password remains available.
- Outbound email (password reset, verification) requires a configured SMTP provider in Supabase.
- Supabase identities are linked to application `User` rows by Supabase ID and normalized email fallback.
- Account roles are single-valued (`MEMBER`, `PROFESSIONAL`, `ADMIN`, `SUPER_ADMIN`).
- Terms version `1.0` is enforced on dashboard, admin, and professional-registration routes.

## Validation commands

```bash
npx tsc --noEmit
npx eslint path/to/changed-file.tsx
npm run build
```

## Important operational notes

1. **Push to `mn`, not `origin`** — `origin` points to a legacy repo that Vercel does not watch.
2. **`NEXT_PUBLIC_SITE_URL` must match Supabase redirect URLs** — a mismatch silently breaks Google OAuth login.
3. **Build-time public variables** — changing any `NEXT_PUBLIC_*` variable requires a new build to take effect.
4. **Stripe is optional** — missing Stripe keys must not crash unrelated pages; paid events require webhook endpoint configuration in the Stripe dashboard pointing to the Vercel deployment URL.
5. **No outbound WhatsApp broadcast** — matching professionals see requests inside the platform only.
6. **Email delivery requires SMTP** — do not promise password reset/verification until a transactional email provider is configured in Supabase Auth.
7. **Professional photos** — all professional photos and logos are now stored in cloud Supabase Storage. The retired `staging.minaretnetwork.ca` URLs have been replaced.
8. **Custom domain live** — `minaretnetwork.ca` is connected to Vercel. Cloudflare DNS uses CNAME with "DNS only" (no orange proxy).
9. **Free promo expires Oct 31, 2026** — event listings and featured/sponsored listings are free until then; pricing resumes automatically on Nov 1.

## Repository map

```text
src/app/(public)/              Public pages, directory, events, offers, request flow
src/app/auth/                  Login, OAuth callback, re-consent, password flows
src/app/dashboard/             Member and professional dashboards
src/app/admin/                 Moderation and operations dashboards
src/app/api/                   AI, analytics, geocoding, messaging, events, expiry
src/components/                Public, dashboard, admin, event, offers, and shared UI
src/lib/actions/               Server-side business operations
src/lib/supabase/              Browser, server, admin, and middleware clients
prisma/schema.prisma           Application data model
```

## Implementation timeline

| Date | Milestone |
|---|---|
| 2026-07-07 | Repository initialized. |
| 2026-07-09 | Core directory, professional listings, featured/sponsored data model, mosque revenue view. |
| 2026-07-13 | Google signup, GPS/autocomplete, professional wizard, consent. |
| 2026-07-18 | Public browsing, search, star ratings, Lucide icon system. |
| 2026-07-19 | Homepage/nav redesign, contact gate, service requests, category suggestions, GTA locations. |
| 2026-07-24 | Auth-at-submit drafts, profile backfill, recommendation moderation, session timeout. |
| 2026-08-06–07 | Self-hosted stack (Docker/Supabase/Nominatim) — later retired. |
| 2026-08-09 | Admin analytics, multiple-listing support. |
| 2026-08-10 | Request matching, incoming leads, messaging, AI matching assistant. |
| 2026-08-11 | Google OAuth, admin Users page, nearest-location fallback, image normalization, GA. |
| 2026-08-12 | Image hardening, edit drafts, multi-category listings, admin notifications, cookie consent. |
| 2026-08-14 | Consent capture, re-consent, recommendation reporting, tiers, regulated-profession gates. |
| 2026-08-15 | Community events, Stripe, hourly expiry, Mission/Before You Hire pages. |
| 2026-08-16 | Windows startup orchestration (self-hosted era ends). |
| 2026-08-19–20 | **Migrated to Vercel + cloud Supabase.** Google OAuth login fixed. Nav updated (Advertise with Us, removed Community Offers nav item). Hero image updated (overhead team photo, green tint). Red promo banner. Community offers flip-card UI. Free event/listing promo until Oct 31. |

## Historical documents

These files remain for audit only and describe infrastructure that no longer exists:

- `PROJECT_HANDOFF_2026-08-13.md`
- `CLAUDE_HANDOFF_2026-08-15.md`
- `EXPERIMENT_LOCAL_STACK.md`
- `MINARET_DEPLOYMENT_ACCESS_REQUEST.md`
- `scripts/install-windows-startup.ps1` and related PowerShell launchers

When any of them conflicts with this README or the current code, follow this README.
