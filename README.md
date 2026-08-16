# Minaret Network

Minaret Network is a mosque-community professional directory and service marketplace for the Greater Toronto Area. Community members can discover professionals, request help, and communicate through the platform. Professionals can manage listings and respond to matching requests. Administrators moderate the directory, consent, recommendations, events, promotions, and operational reporting.

> **Canonical project handoff — updated August 16, 2026.** This README is the current source of truth for product behavior and deployment. The dated handoff and experiment documents in the repository are historical snapshots and may describe infrastructure that no longer exists.

## Current state at a glance

| Item | Current state |
|---|---|
| Source branch | `master` |
| Hosting | Self-hosted on a Windows workstation; **not Vercel** |
| Live application | `https://staging.minaretnetwork.ca` |
| Apex domain | `https://minaretnetwork.ca` and `www` show `/upgrades-in-progress` |
| Retired host | `consent.minaretnetwork.ca` has been removed |
| Public ingress | Cloudflare Tunnel |
| Application | Next.js production build on `127.0.0.1:3220` |
| Database, Auth, Storage | Self-hosted Supabase in Docker |
| Geocoding | Local Nominatim plus bundled GTA/Ontario coordinate fallback |
| Startup | Windows Task Scheduler after interactive sign-in |
| Deployment | Built and restarted on the host; pushing GitHub does not deploy by itself |
| Revenue state | $0 active promotional MRR as of August 16, 2026 |

The active environment is named `production`, but its public browser origin is deliberately `https://staging.minaretnetwork.ca`. There is only one active application/database environment. Do not create a second “staging” stack because of the hostname.

### Repository workflow

- Deployment repository: `https://github.com/Gobbledegookie/minaret-network.git`
- Collaborator/upstream repository: `https://github.com/nafeeshaq-nuvaro/minaret-network.git`
- The live deployment is built from `master` in the deployment repository.
- Nafees’s `nafees/updates` work was merged into `master` on August 15, 2026. Inspect and type-check future incoming commits before merging because a contributor branch may have started from an older live state.
- Local remote names such as `fork` and `upstream` are conventions on the current workstation, not requirements for a fresh clone.

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
- Mission, privacy, terms, advertising, category, and “Before You Hire” transparency pages
- Responsive desktop/mobile navigation and dashboard layouts

### Accounts and authentication

- Email/password authentication through self-hosted Supabase Auth
- Google OAuth through Supabase Auth
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
- Client-side image shrinking plus server-side upload validation
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
- Broadcast audit records; “broadcast” currently means in-platform lead visibility, not outbound WhatsApp delivery

### AI matching

- Optional OpenAI-assisted request classification using live database categories and approved listings
- Local keyword-scoring fallback when `OPENAI_API_KEY` is absent
- Location-aware results and nearby fallback
- Direct contact, profile, message, or service-request continuation from suggestions
- The apex holding page does not display the assistant

### Community events

- Public event index and detail pages
- Event submission and success flows
- Free mosque-organized events with authorization attestation
- Paid standard and featured event listings through Stripe Checkout
- Server-side prices: $25 CAD standard and $49 CAD featured
- Stripe webhook activation, expiry dates, reporting, and admin moderation
- Hourly local expiry sweep for expired events and stale promotion flags

Paid event checkout requires working Stripe keys and a reachable webhook. The rest of the site can run without Stripe because its client is initialized lazily.

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

The revenue dashboard is an operational projection, not an accounting ledger. It sums `priceMonthly` for `ACTIVE` featured and sponsored rows; it does not prove that money was collected. Active promotional test rows were cancelled on August 16, 2026, so current promotional MRR is zero.

## Technology stack

- Next.js `16.2.10` App Router and Turbopack
- React `19.2.4`
- TypeScript 5
- Tailwind CSS 4
- Prisma `5.22`
- PostgreSQL 17 in the local Supabase stack
- Self-hosted Supabase Auth, Storage, REST/PostgREST, Studio, and Mailpit
- Docker Desktop
- Local Nominatim/OpenStreetMap geocoding
- Cloudflare Tunnel
- Google OAuth
- Optional OpenAI API
- Optional Stripe Checkout/webhooks
- Consent-gated Google Analytics and Contentsquare

This Next.js release has breaking changes compared with older versions. Before changing framework-specific code, read the relevant guide under `node_modules/next/dist/docs/`, as required by [AGENTS.md](AGENTS.md).

## Deployment architecture

```text
Browser
  |
  | HTTPS
  v
Cloudflare Tunnel
  |-- staging.minaretnetwork.ca/*             -> 127.0.0.1:3220
  |-- staging.minaretnetwork.ca/auth/v1/*     -> 127.0.0.1:54321
  |-- staging.minaretnetwork.ca/storage/v1/*  -> 127.0.0.1:54321
  |-- minaretnetwork.ca/*                     -> 127.0.0.1:3220
  |                                               |
  |                                               `-> host middleware rewrites to
  |                                                   /upgrades-in-progress
  v
Windows host
  |-- Next.js production build
  |-- Docker Desktop
  |    |-- Supabase/PostgreSQL/Auth/Storage
  |    `-- Nominatim
  `-- Windows Task Scheduler supervisors
```

The Cloudflare tunnel credentials and live `config.yml` are machine-level secrets and are intentionally not committed. The tracked startup installer and scripts reconstruct the task definitions, but a replacement host still needs Cloudflare credentials, Google OAuth credentials, environment secrets, and a restored database/storage backup.

### Public routing

| Host/path | Behavior |
|---|---|
| `staging.minaretnetwork.ca` | Real application |
| `www.staging.minaretnetwork.ca` | Redirects to canonical staging host |
| `staging.minaretnetwork.ca/auth/v1/*` | Local Supabase Auth gateway |
| `staging.minaretnetwork.ca/storage/v1/*` | Local Supabase Storage gateway |
| `minaretnetwork.ca` and `www` | Temporary upgrades page |
| `consent.minaretnetwork.ca` | Retired; no route or special application flow remains |

### Local ports

| Service | Local address | Exposure |
|---|---|---|
| Next.js application | `127.0.0.1:3220` | Cloudflare application routes |
| Supabase API/Auth/Storage gateway | `127.0.0.1:54321` | Only scoped Auth/Storage paths through Cloudflare |
| PostgreSQL | `127.0.0.1:54322` | Host only |
| Supabase Studio | `127.0.0.1:54323` | Host only |
| Mailpit test inbox | `127.0.0.1:54324` | Host only |
| Nominatim | `127.0.0.1:8088` | Host only; called by the app |

Never expose PostgreSQL, Studio, Mailpit, the service-role key, or Nominatim directly to the public internet.

## Windows startup and resilience

The application starts after the owner signs into Windows. It is not a true pre-login Windows service because Docker Desktop requires the interactive user session.

| Scheduled task | Trigger | Responsibility |
|---|---|---|
| `Minaret Network Infrastructure` | 15 seconds after sign-in | Starts Docker Desktop when necessary, Supabase, and Nominatim; synchronizes generated local Supabase connection values into `.env.production.local` |
| `Minaret Network Local Site` | 45 seconds after sign-in | Starts one Cloudflare tunnel, waits for Supabase and required environment values, starts Next.js, and supervises health on port 3220 |
| `Minaret Network Expiry Sweep` | Hourly | Calls the protected local expiry endpoint using `CRON_SECRET` |

Startup tasks use hidden windows, ignore duplicate instances, start when available, and retry failures three times at two-minute intervals. Legacy Startup-folder shortcuts were removed from the active Startup folder so they cannot launch duplicate tunnels or obsolete staging commands.

Install or repair the tracked startup definitions without immediately starting the tasks:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/install-windows-startup.ps1
```

Useful logs are ignored by Git under `logs/`:

- `logs/startup-infrastructure.log`
- `logs/site-supervisor-production.err.log`
- `logs/server-production.out.log`
- `logs/server-production.err.log`
- `logs/auth-debug.log` when auth debugging is enabled

## Prerequisites for a replacement host

- Windows 11 with PowerShell 5.1+
- Git
- Node.js and npm
- Docker Desktop with the current user in `docker-users`
- Enough Docker memory for the Ontario Nominatim import (the scripts require at least 8 GiB; 12 GiB is recommended)
- Cloudflare Tunnel binary, tunnel credentials, DNS records, and ingress configuration
- Google OAuth client ID/secret and authorized callback configuration
- Optional OpenAI and Stripe credentials
- A current off-repository PostgreSQL + Storage backup

The current repository folder contains a space (`Minaret Fork`). Do not remove the explicit quoting in the PowerShell launchers.

## Environment configuration

Runtime secrets belong in `.env.production.local`, which is ignored by Git. Never commit real keys.

### Core values

| Variable | Purpose |
|---|---|
| `MINARET_ENVIRONMENT=production` | Active local environment name |
| `MINARET_PORT=3220` | Local application port |
| `NEXT_DIST_DIR=.next-production` | Production build directory |
| `DATABASE_URL`, `DIRECT_URL` | Local PostgreSQL connection |
| `NEXT_PUBLIC_SUPABASE_URL=https://staging.minaretnetwork.ca` | Browser-visible same-origin Supabase route |
| `SUPABASE_INTERNAL_URL=http://127.0.0.1:54321` | Server-side Supabase route |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe Supabase anonymous key; generated by the local stack |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged local Supabase key; server only |
| `NEXT_PUBLIC_SITE_URL=https://staging.minaretnetwork.ca` | Canonical app/auth redirect origin |
| `NEXT_PUBLIC_DEFAULT_MOSQUE_SLUG=al-falah` | Default community context |
| `NOMINATIM_URL=http://127.0.0.1:8088` | Local geocoder |
| `CRON_SECRET` | Protects the hourly expiry endpoint |

### Feature-specific values

| Variable | Required for |
|---|---|
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` | Displaying Google sign-in after provider configuration |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` | Local Supabase Google provider |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` | Local Supabase Google provider |
| `OPENAI_API_KEY` | OpenAI matching instead of local fallback |
| `OPENAI_MATCH_MODEL` | Optional model override |
| `STRIPE_SECRET_KEY` | Paid event Checkout creation |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `NEXT_PUBLIC_BASE_URL=https://staging.minaretnetwork.ca` | Stripe success/cancel URLs |

`NEXT_PUBLIC_*` values are embedded during `next build`. Changing them in an environment file does not update an existing browser bundle; rebuild and restart the application.

## Initial setup

Install dependencies:

```powershell
npm install
npx prisma generate
```

Prepare the one active production environment without fixture data:

```powershell
npm run env:setup:production
```

This starts the local Supabase stack, writes `.env.production.local`, applies the Prisma schema, builds `.next-production`, and registers/starts the site task when permissions allow.

Install the complete current boot sequence separately when moving machines or repairing Task Scheduler:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/install-windows-startup.ps1
```

Do not run the clean reset command during normal setup. It is intentionally destructive.

## Routine deployment from GitHub

GitHub is the source of truth, but there is no automatic deployment pipeline.

```powershell
git fetch fork
git checkout master
git pull --ff-only fork master
npm install
npx prisma generate
npx tsc --noEmit
npm run build
```

Then restart only the Minaret site supervisor:

```powershell
Stop-ScheduledTask -TaskName "Minaret Network Local Site"
Start-ScheduledTask -TaskName "Minaret Network Local Site"
```

After deployment, verify:

```powershell
Invoke-WebRequest http://127.0.0.1:3220 -UseBasicParsing
Invoke-WebRequest http://127.0.0.1:54321/auth/v1/health -UseBasicParsing
Invoke-WebRequest https://staging.minaretnetwork.ca -UseBasicParsing
Invoke-WebRequest https://minaretnetwork.ca -UseBasicParsing
```

Expected behavior:

- Local app: HTTP 200
- Supabase Auth health: HTTP 200
- Staging host: HTTP 200 with the real application
- Apex host: HTTP 200 with the upgrades page

When the Prisma schema changes, take a backup first and apply the schema deliberately. This project currently uses `prisma db push` for the local deployment; do not invent or run a seed step unless the change explicitly requires one.

## Database, Storage, backup, and recovery

`prisma/schema.prisma` is the application schema source of truth. Supabase also stores Auth and Storage metadata in the same local PostgreSQL instance.

Useful development commands:

```powershell
npm run db:generate
npm run db:push
npm run db:studio
```

Create a timestamped database and Storage backup outside the repository:

```powershell
npm run experiment:backup
```

The script’s `experiment` naming is historical; it backs up the active local stack. By default it writes beneath `Documents\Minaret Backups` and includes:

- PostgreSQL custom-format dump
- Supabase Storage objects
- Non-secret Supabase configuration
- SHA-256 manifest

It does not include environment secrets, Google OAuth credentials, or the rebuildable Nominatim database.

Restore is intentionally not automated because it overwrites live state. Before a restore:

1. Confirm the exact backup directory and checksum.
2. Take a new backup of the current state.
3. Stop the Minaret site task.
4. Restore into an isolated/empty target first where possible.
5. Verify Auth users, application tables, and Storage together before exposing traffic.

Never use `supabase stop --all`, remove Docker volumes, reseed, or reset the active database as routine troubleshooting.

The guarded destructive reset is:

```powershell
npm run env:reset:production
```

It requires the explicit confirmation token embedded in the script and should be used only when intentionally rebuilding a clean database.

## Authentication and consent details

Authentication is served from the same public staging origin. Google Cloud must authorize:

```text
https://staging.minaretnetwork.ca/auth/v1/callback
```

The application then receives OAuth completion at `/auth/callback`. Do not point Google back to the retired consent hostname.

Important behavior:

- Google is the prominent login option; email/password remains available.
- Outbound production email is not configured, so email/password confirmation/reset delivery needs separate transactional-email work.
- Supabase identities are linked to application `User` rows by Supabase ID and normalized email fallback.
- Account roles are single-valued (`MEMBER`, `PROFESSIONAL`, `ADMIN`, `SUPER_ADMIN`), but the Users UI independently displays `PROFESSIONAL` when an approved listing exists. An admin can therefore show both badges.
- Terms version `1.0` is enforced on dashboard, admin, and professional-registration routes.
- The one-time `consent.minaretnetwork.ca` collection flow was retired after the five targeted legacy listings consented. Their consent timestamps/versions remain stored on their normal listing records.
- New users/listings go through the standard consent built into signup, re-consent, service request, and professional registration flows.

## Analytics, privacy, and vendors

The platform records lightweight first-party analytics events in the local database. Google Analytics and Contentsquare load only when the visitor chooses **Accept all** in the cookie banner, and they do not load on the apex holding page.

The Google Analytics measurement ID and Contentsquare script ID are currently declared in `src/components/google-analytics.tsx`, not environment variables. Changing either requires a code change and production rebuild.

Update [VENDORS.md](VENDORS.md) whenever a processor, data flow, retention assumption, or credential changes. Current external dependencies include Cloudflare, Google OAuth/Analytics, Contentsquare, optional OpenAI, and optional Stripe.

## Validation commands

Use checks proportional to the change:

```powershell
npx tsc --noEmit
npx eslint path\to\changed-file.tsx
npm run build
```

The production build currently emits a non-fatal warning because `src/app/api/webhooks/stripe/route.ts` exports a deprecated Pages Router-style `config` object. The App Router handler already reads the raw request body using `req.text()`, but the warning should be resolved and Stripe webhook behavior retested before treating paid events as launch-ready.

## Important operational gotchas

1. **Not Vercel:** there is no Vercel project, `vercel.json`, Vercel Cron, or automatic GitHub deployment.
2. **Login required for boot:** Task Scheduler starts the stack after interactive Windows sign-in, not immediately at power-on.
3. **One environment:** `production` serves the real app on the staging hostname. Do not start historical `minaret-staging*` volumes as a second stack.
4. **Build-time public variables:** rebuild after changing any `NEXT_PUBLIC_*` value.
5. **Generated Supabase keys:** infrastructure startup refreshes generated connection keys into `.env.production.local`; do not blank or hand-copy them into Git.
6. **Cloudflare is external state:** tracked scripts do not contain tunnel credentials or DNS configuration.
7. **The apex is intentionally parked:** do not remove the host rewrite or enable analytics there without an explicit launch decision.
8. **Promotion MRR is projected:** active featured/sponsored rows create MRR even if no payment was collected.
9. **Stripe is optional and not fully launch-verified:** missing keys must not crash unrelated pages; paid events require webhook testing.
10. **No outbound WhatsApp broadcast:** matching professionals see requests inside the platform only.
11. **Email delivery is incomplete:** do not promise email verification/reset delivery until SMTP is configured and tested.
12. **Backups are external:** Docker volumes are not a backup; run and verify the backup script before risky database work.
13. **Unrelated Docker workloads exist:** do not stop or modify `youtube-audio-downloader` while operating Minaret.

## Repository map

```text
src/app/(public)/              Public pages, directory, events, request flow
src/app/auth/                  Login, OAuth callback, re-consent, password flows
src/app/dashboard/             Member and professional dashboards
src/app/admin/                 Moderation and operations dashboards
src/app/api/                   AI, analytics, geocoding, messaging, events, expiry
src/components/                Public, dashboard, admin, event, and shared UI
src/lib/actions/               Server-side business operations
src/lib/supabase/              Browser, server, admin, and middleware clients
src/proxy.ts                   Host routing and session middleware
prisma/schema.prisma           Application data model
supabase/config.toml           Local Auth/API/Storage configuration
infra/nominatim/compose.yaml   Local Ontario Nominatim service
scripts/install-windows-startup.ps1
scripts/startup-infrastructure.ps1
scripts/site-supervisor.ps1
scripts/start-site.ps1
scripts/start-local.mjs
scripts/run-expire-sponsorships.ps1
scripts/experiment-backup.ps1
```

## Implementation timeline

This is a milestone history derived from Git, not a substitute for `git log`.

| Date | Milestone |
|---|---|
| 2026-07-07 | Repository initialized from Create Next App. |
| 2026-07-09 | Core Minaret directory, professional listings, featured/sponsored data model, mosque revenue view, member contact fields, user dropdown, and super-admin management added. |
| 2026-07-13 | Google signup entry, GPS/autocomplete, professional multi-step wizard, scheduling, searchable categories, and registration consent added. |
| 2026-07-18 | Public browsing opened, search tightened, star ratings added, and Lucide icon system standardized. |
| 2026-07-19 | Homepage/navigation redesign, contact gate, responsive layouts, stepped service requests, request detail pages, category suggestions, and broader GTA location coverage added. |
| 2026-07-24 | Auth-at-submit request drafts, profile backfill, recommendation moderation, session timeout, and additional mobile/interaction fixes added. |
| 2026-08-06–07 | Local self-hosting began: Docker/Supabase stack, Nominatim, backup/status scripts, and runtime hardening were introduced. |
| 2026-08-09 | Admin analytics dashboard and multiple-listing support completed. |
| 2026-08-10 | Professional request matching, incoming leads, in-platform messaging, unread status, request closing, and AI matching assistant added. |
| 2026-08-11 | Google OAuth moved to the Minaret public origin; admin Users page, nearest-location fallback, city autocomplete, listing details, image normalization, mosque suggestions, GA, and production-environment tooling added. |
| 2026-08-12 | Self-hosting documentation, image hardening, edit drafts, multi-category listings, admin notifications, cookie consent, and listing transparency notices added. |
| 2026-08-14 | Legal/privacy phase added: consent capture, re-consent, recommendation reporting, affiliation visibility, tiers, regulated-profession gates, and phone masking. |
| 2026-08-15 | Vercel configuration removed; staging became the real app host while apex remained parked; Mission, Before You Hire, events/Stripe, hourly expiry, consent restoration/retirement, profile persistence fixes, category creation, and mobile navigation fixes landed. |
| 2026-08-16 | Windows startup orchestration and credential synchronization repaired; admin dual professional roles and sortable Users columns added; active test promotional MRR cleared to zero; documentation consolidated here. |

For exact commits and authorship:

```powershell
git log --date=short --pretty=format:"%ad %h %s"
```

## Historical documents

These files remain for audit/history only and are not operational instructions:

- `PROJECT_HANDOFF_2026-08-13.md`
- `CLAUDE_HANDOFF_2026-08-15.md`
- `EXPERIMENT_LOCAL_STACK.md`
- `MINARET_DEPLOYMENT_ACCESS_REQUEST.md`

When any of them conflicts with this README or the current code, follow this README and verify the live configuration before acting.
