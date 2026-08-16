# Minaret Network: comprehensive Claude handoff

> **Historical snapshot (August 15, 2026).** This file is retained for audit context and is no longer operational guidance. Infrastructure and product behavior changed after it was written. Read `README.md` for the current source of truth.

Last verified: August 15, 2026 (America/Toronto)

This document captured a detailed Claude handoff on August 15, 2026. It is useful for reconstructing decisions made by that date, but it is not the current source of truth.

If this file conflicts with `README.md` or the current code/configuration, `README.md` and the verified current state win. `PROJECT_HANDOFF_2026-08-13.md` is an even earlier historical snapshot.

## 1. Executive summary

Minaret Network is a consumer-facing professional directory and service marketplace for mosque communities in the Greater Toronto Area. Community members can discover trusted local professionals, submit service requests, receive matches, and communicate through internal messaging. Professionals can create and manage listings, receive leads, and respond to requests. Administrators moderate users, professionals, recommendations, categories, mosques, and promoted placements.

The application is currently self-hosted on Aftab's Windows desktop. It uses one active local environment called `production`, but the active public application origin is deliberately `https://staging.minaretnetwork.ca`. The apex domain remains parked on a temporary holding page for privacy and launch-readiness reasons.

The most important operational rule is:

- `staging.minaretnetwork.ca` must serve the real application.
- `minaretnetwork.ca` and `www.minaretnetwork.ca` must serve only the "Upgrades in progress" holding page.
- Do not create or restore a second staging application/database environment unless Aftab explicitly requests it.

## 2. Repository and branch state

- Repository: `C:\Users\aftab\Documents\Codex\Minaret Fork`
- Current branch at handoff: `master`
- Package name remains `al-falah`; this is historical and does not reflect the current product name.
- The worktree is intentionally dirty and contains important live changes.
- Do not reset, discard, overwrite, or broadly reformat existing changes.
- Before every task, run `git status --short` and inspect overlapping diffs.

Current modified tracked files at handoff:

```text
prisma/schema.prisma
scripts/setup-environment.ps1
scripts/start-google-auth-local.ps1
scripts/start-local.mjs
scripts/start-site.ps1
src/app/auth/callback/route.ts
src/app/auth/google/route.ts
src/app/dashboard/messages/page.tsx
src/app/dashboard/page.tsx
src/app/dashboard/requests/page.tsx
src/components/ai/assistant-bubble.tsx
src/components/dashboard/archive-conversation-button.tsx
src/components/featured/featured-business-card.tsx
src/lib/actions/service-requests.ts
src/lib/client-location.ts
src/lib/public-asset-url.ts
src/lib/site-origin.ts
src/proxy.ts
supabase/config.toml
```

Current important untracked files/directories:

```text
PROJECT_HANDOFF_2026-08-13.md
scripts/ensure-site.ps1
src/app/upgrades-in-progress/
src/components/dashboard/archive-context-menu.tsx
src/components/dashboard/messages-list.tsx
src/components/dashboard/recent-requests-panel.tsx
src/components/dashboard/request-archive-button.tsx
```

These are not disposable scratch files. They are part of the currently deployed behavior.

## 3. Product purpose and users

### Community members

Members can:

- search and browse approved professionals;
- filter by category, location, language, and service area;
- submit service requests;
- receive professional matches;
- message professionals inside the site;
- contact professionals through WhatsApp, email, or phone where available;
- close, reopen, archive, restore, and review requests;
- use the AI match assistant;
- recommend professionals and suggest mosques or categories.

### Professionals

Professionals can:

- create multiple professional listings;
- submit listings for approval;
- withdraw/call back applications for editing;
- manage business details, service areas, languages, schedule, contact information, images, gallery, walk-in availability, business address, and mosque affiliation;
- view incoming matching requests;
- respond through internal messaging or external contact methods;
- manage their dashboard and promoted-placement state.

### Administrators

Admin and super-admin roles exist. Administrators can:

- review, approve, reject, suspend, and inspect professional applications;
- manage users and promote roles;
- moderate recommendations;
- manage mosques, categories, and suggestions;
- inspect service requests and activity;
- manage featured and sponsored placements manually;
- view lightweight analytics and engagement signals.

## 4. Deliberate product decisions

Preserve these unless Aftab explicitly changes them:

- The UI should be approachable and non-technical.
- Mobile access to requests, conversations, and dashboard actions is a priority.
- Messaging should feel lightweight and direct.
- Featured and sponsored placements are admin-managed for now.
- Public self-serve purchase/application flows for featured or sponsored status are suppressed or presented as "coming soon."
- The apex domain is intentionally not the live application.
- Analytics must remain consent-gated.
- Avoid introducing extra environments or infrastructure complexity without a clear need.
- Prefer lean workflows; do not spend context or time on broad refactors unrelated to the requested change.

## 5. Technology stack

Core versions at handoff:

- Next.js `16.2.10`, App Router
- React `19.2.4`
- TypeScript 5
- Tailwind CSS 4
- Prisma `5.22.0`
- Local Supabase CLI stack
- PostgreSQL 17 through the Supabase image
- Supabase Auth, Storage, REST/PostgREST, Studio, and related services
- Sharp `0.34.4` for server-side image processing
- Sonner for notifications
- OpenAI API for AI matching
- Local Nominatim for geocoding
- Cloudflare Tunnel for public HTTPS routing
- Windows PowerShell and Windows Task Scheduler for local service resilience

Critical framework instruction from `AGENTS.md` and `CLAUDE.md`:

> This is a newer Next.js version with breaking changes. Before modifying framework-specific code, read the relevant guide under `node_modules/next/dist/docs/` and follow current deprecation guidance.

Do not rely only on general Next.js knowledge.

## 6. Active hosting architecture

### Public routing

| Host | Intended result |
|---|---|
| `https://staging.minaretnetwork.ca` | Real working application |
| `https://minaretnetwork.ca` | "Upgrades in progress" holding page |
| `https://www.minaretnetwork.ca` | Holding page |
| `https://www.staging.minaretnetwork.ca` | Redirect to canonical staging host |

The host split is implemented primarily in:

- `src/proxy.ts`
- `src/lib/site-origin.ts`
- `src/app/upgrades-in-progress/page.tsx`
- Cloudflare Tunnel ingress configuration outside this repository

The proxy rewrites apex/www requests internally to `/upgrades-in-progress`. Because rewrites may preserve the visible browser pathname as `/`, host-specific client UI cannot rely on `usePathname()` alone.

The AI assistant therefore explicitly checks the browser hostname and must not render on:

- `minaretnetwork.ca`
- `www.minaretnetwork.ca`
- the direct `/upgrades-in-progress` route

Do not remove this hostname guard from `src/components/ai/assistant-bubble.tsx`.

### Local ports

| Service | Address |
|---|---|
| Next.js application | `http://127.0.0.1:3220` |
| Supabase API/Auth gateway | `http://127.0.0.1:54321` |
| PostgreSQL | `127.0.0.1:54322` |
| Supabase Studio | `http://127.0.0.1:54323` |
| Nominatim | `http://127.0.0.1:8088` |

There is an unrelated `youtube-audio-downloader` Docker container on this computer. It is not part of Minaret Network and must not be stopped, modified, backed up, or deployed as part of this project.

### Single-environment rule

The active environment is named `production`, but its public origin is `https://staging.minaretnetwork.ca`.

Old volumes named like `minaret-staging` or `minaret-staging-local` may still exist as historical remnants. Their presence does not mean a second environment should be restarted. Do not delete old volumes without explicit approval; they may be useful for recovery.

## 7. Current verified health

On August 15, 2026, the following checks returned HTTP 200:

- `http://127.0.0.1:3220`
- `http://127.0.0.1:54321/auth/v1/health`
- `https://staging.minaretnetwork.ca`
- `https://minaretnetwork.ca`

The staging page did not contain the holding-page marker. The apex page did contain "Upgrades in progress."

The Windows scheduled task `Minaret Network Local Site` was in `Ready` state and its last result was `0`.

Health is time-sensitive. Recheck it rather than assuming this snapshot is still current.

## 8. Startup and resilience

Relevant files:

- `scripts/setup-environment.ps1`
- `scripts/start-site.ps1`
- `scripts/start-local.mjs`
- `scripts/ensure-site.ps1`

Windows scheduled task:

- Name: `Minaret Network Local Site`
- Trigger: 45 seconds after interactive logon
- Repetition: every 5 minutes for one day after login
- Multiple instances: ignored
- Failure restart policy: three retries, two minutes apart
- Health wrapper: `scripts/ensure-site.ps1 -Environment production`

The health wrapper:

1. verifies that the environment file exists;
2. checks Supabase Auth readiness;
3. exits without starting Next if Auth is not ready yet;
4. exits if the site is already healthy;
5. starts the site only when Auth is healthy and the site is unavailable;
6. waits up to 45 seconds for the site to become healthy;
7. throws when the launcher returns but the site never becomes reachable.

The launcher was hardened after a reboot failure caused by stale PID reuse. `scripts/start-local.mjs` must verify that a PID belongs to the actual Minaret Next process rather than trusting any live process with the same numeric PID. Do not revert this ownership check.

The five-minute task previously flashed a PowerShell window. `scripts/ensure-site.ps1` now hides its own console immediately. Future task registration also adds `-NonInteractive -WindowStyle Hidden`. The installed task may still show the older argument string, but the script-level window hiding is active and is what makes the current task unobtrusive.

## 9. Build and deployment model

- Active production build directory: `.next-production`
- Active environment file: `.env.production.local`
- `next.config.ts` reads `NEXT_DIST_DIR`, defaulting to `.next`.
- The site normally runs through `scripts/start-local.mjs`, which chooses `next start` when a production build exists.

Typical validation for changed source files:

```powershell
npx.cmd eslint "path/to/changed-file.tsx"
npx.cmd tsc --noEmit --pretty false
```

Typical production build:

```powershell
$env:NEXT_DIST_DIR = ".next-production"
npx.cmd next build
```

Important Windows caveat:

- `prisma generate` can fail with `EPERM` while the running Next server holds Prisma's Windows query-engine DLL open.
- Do not repeatedly regenerate Prisma unnecessarily.
- If regeneration is required, stop only the verified Minaret Next process, regenerate, build, and restart safely.

Safe restart principles:

- Read `run/server-production.pid`.
- Verify the PID is `node.exe` and its command line contains the repository's Next CLI, `start`, and `-p 3220`.
- Refuse to stop an unverified process.
- Start the scheduled task or `scripts/start-site.ps1` afterward.
- Wait for local health, then check staging and apex routing.

Do not use broad process-killing commands.

## 10. Validation caveats

The repository-wide `npm run lint` currently scans generated `.next-build-check` output and can produce thousands of irrelevant errors. Until the ESLint ignore configuration is repaired, use targeted ESLint on changed source files plus `npx.cmd tsc --noEmit --pretty false` and a production build.

Known pre-existing source lint issues also exist outside the recently changed files. Do not claim a globally clean lint run unless the generated-output issue and existing findings have been addressed deliberately.

After deployment, verify at minimum:

```text
local app               -> HTTP 200
local Supabase Auth     -> HTTP 200
staging public app      -> HTTP 200 and NOT holding page
apex domain             -> HTTP 200 and IS holding page
```

For authenticated dashboard changes, browser-based testing with an existing signed-in session is preferable. Unauthenticated HTTP smoke tests should redirect protected routes to `/auth/login?redirectTo=...`.

## 11. Authentication

Authentication is handled by the local Supabase Auth stack.

Supported methods:

- email/password;
- Google OAuth.

Current public auth origin:

- `https://staging.minaretnetwork.ca`

The Google route and callback prefer `NEXT_PUBLIC_SITE_URL` over request-derived origin:

- `src/app/auth/google/route.ts`
- `src/app/auth/callback/route.ts`

This was necessary because forwarded/request origins changed while the public host configuration was being stabilized.

Supabase Auth URLs are also configured in `supabase/config.toml`. Google Cloud OAuth settings outside the repository must agree with the Supabase callback and staging origin.

Do not print, commit, or paste secret values from environment files. Relevant environment key names include:

```text
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_INTERNAL_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED
NEXT_PUBLIC_SITE_URL
NOMINATIM_URL
OPENAI_API_KEY
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET
```

The anon key is designed for client use, but the service-role key, database credentials, Google secret, and OpenAI key are sensitive.

## 12. Database and principal models

Prisma schema: `prisma/schema.prisma`

Principal models:

- `Mosque`
- `User`
- `Category`
- `ServiceArea`
- `Professional`
- `ProfessionalEditDraft`
- `VerificationBadge`
- `Credential`
- `GalleryImage`
- `Recommendation`
- `SponsoredPricingTier`, `SponsoredListing`, `SponsoredWaitlist`
- `FeaturedPricingTier`, `FeaturedListing`, `FeaturedWaitlist`
- `ServiceRequest`
- `Conversation`
- `Message`
- `CategorySuggestion`
- `MosqueSuggestion`
- `AnalyticsEvent`

Important enums include user roles, professional statuses, edit-draft statuses, badge types, recommendation statuses, sponsored/featured statuses, contact methods, request statuses, and analytics event types.

Database facts observed during recent work:

- The application database itself was approximately 13 MB at inspection time.
- Prisma model `ServiceRequest` maps to SQL table `service_requests`; do not query the Prisma model name as a literal SQL table name.
- `service_requests.requesterArchivedAt` exists in the active database as a nullable timestamp.
- Request archiving is soft state, not deletion.
- Conversation archiving is per participant through requester/professional archive timestamps.

Avoid destructive schema resets. The command `npm run env:reset:production` is explicitly destructive and requires a confirmation token. Never run it as a normal setup or troubleshooting step.

## 13. Supabase Storage and asset URLs

Supabase Storage holds professional photos, logos, galleries, and related files.

Recent domain moves exposed two failure modes:

1. existing database URLs pointed at `https://minaretnetwork.ca/storage/...`, which now returns the holding page;
2. some image files survived in storage while their database URL fields were cleared.

`src/lib/public-asset-url.ts` now normalizes Minaret storage URLs from localhost, apex, www, or staging hosts to the active configured public origin. Featured cards call this normalizer.

Recently repaired featured assets:

- Canset photo URL was moved from apex to staging.
- Realty Wealth Group photo URL was moved from apex to staging.
- Nuvaro AI's surviving photo and logo files were re-associated with its professional record.
- Farma's Kitchen was using its Google avatar.
- Affordable Car and Truck Rental had no uploaded image at the time and correctly used initials.

Do not assume a missing rendered image means the file is gone. Check, in order:

1. professional `logoUrl`/`photoUrl` and user `avatarUrl`;
2. storage metadata in `storage.objects`;
3. the actual public asset response and content type;
4. old inactive Docker volumes or backups, read-only, if recovery is necessary.

## 14. Image upload handling

Image upload robustness is implemented, despite the older handoff calling it unfinished.

Relevant files:

- `src/lib/upload-image-config.ts`
- `src/lib/upload-images.ts`
- `scripts/smoke-test-image-uploads.ts`
- professional registration/update server actions and UI

Current behavior:

- accepts JPEG/JPG, PNG, WebP, HEIC, HEIF, and AVIF MIME types;
- permits source files up to 40 MB;
- applies EXIF rotation;
- resizes photos to fit within 2200 x 2200;
- resizes logos to fit within 1600 x 1600;
- converts normalized output to WebP;
- uses quality 82 for photos and 90/near-lossless handling for logos;
- preserves logo alpha quality where applicable.

Support still depends on the installed Sharp build being able to decode the submitted phone format. Keep user-facing failure messages helpful.

## 15. Service requests, conversations, and archiving

Recent request/conversation work is deployed but remains uncommitted.

Implemented behavior:

- active/open items sort before closed items;
- open, closed/cancelled, and archived request filters;
- active and archived conversation views;
- mobile swipe-to-archive for eligible closed items;
- explicit Archive/Restore controls;
- desktop right-click Archive/Restore context menus;
- only one right-click context menu can be open at a time;
- click-away, scrolling, and Escape close the active context menu;
- successful archive actions show a six-second toast with Undo;
- reopening a request clears its archived state;
- only owners can archive their requests;
- only participants can archive their side of a conversation;
- only closed/cancelled requests or conversations can be archived.

Relevant files:

- `prisma/schema.prisma`
- `src/lib/actions/service-requests.ts`
- `src/lib/actions/messages.ts`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/requests/page.tsx`
- `src/app/dashboard/messages/page.tsx`
- `src/components/dashboard/recent-requests-panel.tsx`
- `src/components/dashboard/request-archive-button.tsx`
- `src/components/dashboard/messages-list.tsx`
- `src/components/dashboard/archive-context-menu.tsx`
- `src/components/dashboard/archive-conversation-button.tsx`

Server actions must authenticate, verify ownership/participation, validate eligible state, mutate only trusted records, and revalidate affected paths.

## 16. AI match assistant

The AI assistant is loaded lazily through:

- `src/components/ai/lazy-assistant-bubble.tsx`
- `src/components/ai/assistant-bubble.tsx`

It uses application/database listings as its source of truth and the OpenAI API for classification/matching.

Recent interaction changes:

- Enter submits the initial issue text.
- Shift+Enter inserts a new line.
- IME composition is respected.
- Location detection allows 15 seconds for the initial permission prompt.
- Temporary geolocation failures automatically retry once after a short delay.
- Actual permission denial is not retried and shows a specific message.
- The assistant must never render on apex/www holding-page hosts.

Location search uses local reverse geocoding through `/api/geocode/reverse` and Nominatim.

## 17. Categories

Category page improvements are complete, despite the older handoff calling them unfinished.

The categories page now:

- sorts alphabetically;
- provides live client-side search;
- shows approved-professional counts;
- offers a toggle to show only categories with professionals;
- displays an empty-filter result clearly.

Relevant files:

- `src/app/(public)/categories/page.tsx`
- `src/components/categories/categories-browser.tsx`

## 18. Analytics and privacy

Google Analytics was introduced with cookie-consent gating.

Relevant files include:

- `src/components/cookie-banner.tsx`
- `src/components/google-analytics.tsx`
- `src/components/analytics-tracker.tsx`
- `src/lib/analytics-client.ts`
- `src/app/api/analytics/event/route.ts`

The apex holding page and privacy posture are deliberate. Do not enable analytics or interactive live-app widgets on the holding page without explicit direction.

## 19. Important source map

### Application shell and routing

- `src/app/layout.tsx` - global shell, assistant loader, toasts, analytics
- `src/app/(public)/layout.tsx` - public-site layout
- `src/app/dashboard/layout.tsx` - authenticated dashboard shell
- `src/app/admin/layout.tsx` - admin shell
- `src/proxy.ts` - host routing and Supabase session middleware
- `src/lib/site-origin.ts` - canonical origin handling

### Authentication

- `src/lib/supabase/` - browser, server, admin, and middleware clients
- `src/app/auth/google/route.ts`
- `src/app/auth/callback/route.ts`
- `src/lib/actions/auth.ts`

### Business data and server actions

- `src/lib/actions/professionals.ts`
- `src/lib/actions/service-requests.ts`
- `src/lib/actions/messages.ts`
- `src/lib/actions/featured.ts`
- `src/lib/actions/sponsored.ts`
- `src/lib/actions/admin.ts`
- `src/lib/actions/admins.ts`
- `src/lib/actions/recommendations.ts`
- `src/lib/actions/mosques.ts`

### Public discovery and matching

- `src/app/(public)/page.tsx`
- `src/app/(public)/professionals/`
- `src/components/professionals/`
- `src/components/home/`
- `src/components/featured/`
- `src/components/ai/`

### Infrastructure

- `supabase/config.toml`
- `infra/nominatim/compose.yaml`
- `scripts/setup-environment.ps1`
- `scripts/start-site.ps1`
- `scripts/start-local.mjs`
- `scripts/ensure-site.ps1`
- `scripts/experiment-backup.ps1`

## 20. Backups and recovery

Backup script:

```powershell
npm run experiment:backup
```

It creates a PostgreSQL custom-format dump plus Supabase Storage files under the default external backup root:

```text
C:\Users\aftab\Documents\Minaret Backups
```

Backups include application tables, Auth metadata/users, Storage metadata, and Storage files. They do not intentionally include `.env` secrets.

At the last inspection, the only existing formal backup was dated August 7, 2026 and predated several newer business records. Do not assume it contains the latest data. A fresh verified backup should be a priority before major schema, hosting, or infrastructure changes.

Old Docker volumes may contain historical database/storage data. Treat them as recovery artifacts. Inspect them read-only first and never delete them casually.

## 21. Known documentation drift

Do not blindly follow these stale statements in `README.md`:

- It says the production public URL is `https://minaretnetwork.ca`; the active real app is currently staging.
- Its Google OAuth examples point at the apex.
- Its public-routing section does not reflect the holding-page split.

`PROJECT_HANDOFF_2026-08-13.md` also lists image uploads and categories as unfinished; they are implemented in the current code.

The README should eventually be updated, but do so as an intentional documentation task and preserve this handoff's current operational truth.

## 22. Known risks and recommended follow-up

### Highest priority

1. Take and verify a current off-repository database + Storage backup.
2. Commit the current coherent live changes deliberately after reviewing the full diff.
3. Repair ESLint ignores so generated `.next-*` output is never linted.
4. Perform authenticated smoke tests for request/message archive, restore, Undo, and navigation behavior.

### Worth testing

- Older reports of message links returning 404.
- Admin changes not appearing in the expected management screen.
- Google OAuth after reboot/startup changes.
- First-time browser geolocation permission on iPhone, Android, and desktop browsers.
- HEIC/HEIF decoding with real device uploads, not only synthetic JPEG/PNG/WebP fixtures.
- Featured/sponsored asset rendering across staging and apex storage URL histories.

### Infrastructure limitations

- The site depends on Aftab's desktop being powered on, logged in, connected, and running Docker Desktop and the Cloudflare tunnel.
- The local deployment is a single-machine failure domain.
- The scheduled task begins after interactive logon rather than as a true Windows service at boot.
- A future AWS/Lightsail migration was discussed hypothetically but has not been authorized or implemented.

## 23. Security and safety rules

- Never expose `.env` values, database credentials, OAuth secrets, service-role keys, tunnel credentials, or the OpenAI key.
- Never reset or reseed the active production database during routine work.
- Never delete Docker volumes, backups, professional assets, or user records without explicit authorization and a verified target.
- Verify process identity before stopping a PID.
- Preserve the unrelated YouTube downloader container.
- Treat server actions as public mutation endpoints: authenticate, authorize, validate, and constrain inputs.
- Keep admin access checks server-side.
- Do not use request-derived origins for OAuth redirects when the configured public site origin is available.
- Do not relaunch the apex domain without explicit approval.

## 24. Recommended first-session procedure for Claude

1. Read `AGENTS.md` and this file completely.
2. Run `git branch --show-current` and `git status --short`.
3. Inspect diffs for any files the requested task will touch.
4. Check local app and Supabase Auth health.
5. Check staging and apex public behavior.
6. Read the relevant Next.js 16 guide under `node_modules/next/dist/docs/` before framework-specific edits.
7. Make the smallest scoped change that satisfies the request.
8. Run targeted ESLint, TypeScript, and a production build in proportion to risk.
9. Restart only the verified Minaret process when deployment is requested or clearly part of the task.
10. Recheck staging and apex behavior after deployment.
11. Report exactly what changed, what was tested, and anything still unverified.

## 25. Suggested Claude project description

Use the following in Claude's project-description field:

> Minaret Network is a mosque-community professional directory and service marketplace for the Greater Toronto Area. It supports professional listings, user accounts, service requests, internal messaging, admin moderation, mosque affiliations and recommendations, featured/sponsored placements, consent-gated analytics, and an AI matching assistant. The app uses Next.js 16, React 19, TypeScript, Prisma, PostgreSQL, and a self-hosted Supabase stack, with local Nominatim geocoding and Cloudflare Tunnel public access. The one active local environment is named production but serves the real app at staging.minaretnetwork.ca; minaretnetwork.ca and www must remain on the temporary upgrades page. Read CLAUDE_HANDOFF_2026-08-15.md and AGENTS.md before making changes, inspect the dirty worktree carefully, preserve unrelated changes, and consult the bundled Next.js docs before framework-specific edits.

## 26. Suggested opening prompt for a new Claude session

> Read `CLAUDE_HANDOFF_2026-08-15.md` and `AGENTS.md` completely and treat the handoff as the source of truth where older documentation conflicts. Before making changes, inspect the current branch, git status, relevant diffs, local health, staging behavior, and apex holding page. Do not discard uncommitted work, do not create another environment, do not expose secrets, and do not relaunch the apex domain unless I explicitly ask.
