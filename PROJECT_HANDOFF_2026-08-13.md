# Minaret Network handoff

> **Historical snapshot (August 13, 2026).** Do not use this file as a deployment runbook. Read `README.md` for the current architecture, features, startup tasks, domains, and gotchas.

Last updated: August 13, 2026

This file captured the project state for a Codex handoff on August 13, 2026. It is retained as historical context; later changes are documented in the root README and Git history.

## Project identity

- Project name: Minaret Network
- Repo folder: `C:\Users\aftab\Documents\Codex\Minaret Fork`
- Main purpose: mosque-community professional directory with:
  - professional listings
  - user accounts
  - service requests
  - internal messaging
  - admin moderation
  - featured/sponsored placement controls
  - AI matching assistant

## Current hosting model

This site is self-hosted on Aftab’s Windows machine.

Current public behavior:

- Main working site: [https://staging.minaretnetwork.ca](https://staging.minaretnetwork.ca)
- Apex public domain: [https://minaretnetwork.ca](https://minaretnetwork.ca)
  - currently shows an “upgrades in progress / we’ll be back” holding page
  - this is intentional due privacy concerns

Important:

- We are currently using the local `production` environment as the active working environment, but its public origin is set to `https://staging.minaretnetwork.ca`
- staging as a separate environment has been intentionally removed
- do not recreate a second app/database environment unless explicitly requested

## Current local stack

The app runs locally on:

- Next app: `http://127.0.0.1:3220`
- Supabase API: `http://127.0.0.1:54321`
- Supabase DB: `127.0.0.1:54322`
- Supabase Studio: `http://127.0.0.1:54323`

Also present locally:

- local Nominatim/geocoding service
- local Cloudflare tunnel process routing traffic from the internet to local services

There is also an unrelated `youtube-audio-downloader` container on the machine. It is not part of Minaret Network.

## Startup / resilience work already done

The site now has hardened local startup behavior.

Relevant scripts:

- [scripts/setup-environment.ps1](C:\Users\aftab\Documents\Codex\Minaret%20Fork\scripts\setup-environment.ps1)
- [scripts/start-site.ps1](C:\Users\aftab\Documents\Codex\Minaret%20Fork\scripts\start-site.ps1)
- [scripts/ensure-site.ps1](C:\Users\aftab\Documents\Codex\Minaret%20Fork\scripts\ensure-site.ps1)

What the current scheduled task does:

- scheduled task name: `Minaret Network Local Site`
- delayed startup after logon
- starts a hidden site supervisor instead of a visible repeating check
- the supervisor keeps running quietly in the background
- it only restarts the site if:
  - Supabase auth is healthy
  - but the local site is not responding
- avoids duplicate instances without reopening a console every five minutes

This was added specifically to reduce flaky reboot/login behavior and intermittent Google auth failures caused by dependencies not being ready yet.

## Auth state

Auth is local Supabase auth with:

- email/password
- Google OAuth

Google OAuth current state:

- current active working URL for auth is staging domain:
  - `https://staging.minaretnetwork.ca`
- Google auth was previously bouncing due environment/origin instability
- latest checked state on August 13, 2026:
  - Google auth on staging completed successfully
  - callback succeeded
  - token exchange succeeded
  - user fetches succeeded

Important implementation detail:

- current auth flow was adjusted to prefer `NEXT_PUBLIC_SITE_URL` over request-derived origin in:
  - [src/app/auth/google/route.ts](C:\Users\aftab\Documents\Codex\Minaret%20Fork\src\app\auth\google\route.ts)
  - [src/app/auth/callback/route.ts](C:\Users\aftab\Documents\Codex\Minaret%20Fork\src\app\auth\callback\route.ts)

## Domain routing state

Intentional current routing:

- `staging.minaretnetwork.ca` → real site
- `minaretnetwork.ca` and `www.minaretnetwork.ca` → holding page

There was earlier work around `www` and `http` behavior. The main principle now is:

- users should end up on the correct canonical working host
- apex should remain parked on the holding page until user explicitly wants full public relaunch

## Analytics / privacy

Google Analytics has been introduced with consent gating.

Related work includes:

- cookie consent banner
- analytics only after consent

Privacy concerns are the reason the main apex domain was taken down temporarily.

## Important product features already built

These features exist in some form and should be preserved:

- professional directory
- user dashboard
- service requests
- internal messaging
- incoming service requests for professionals
- admin panel
- featured businesses
- sponsored listings
- AI assistant / match assistant
- mosque affiliation flow
- mosque recommendation flow
- Google auth
- local/self-hosted deployment model

## Admin / moderation behavior already added

- super admin and admin roles exist
- admin can manage users/professionals
- admin-facing user tables and stats exist
- pending professional approvals exist
- user promotion to admin/super admin exists
- sponsored / featured admin management exists

## Current user-facing behavior decisions already made

These are deliberate product choices from the user and should generally be preserved:

- site is non-technical and consumer-facing
- internal messaging should feel lightweight and direct
- requests, chats, and dashboard actions should be easily accessible on mobile
- featured/sponsored are admin-managed for now
- public-facing “apply for featured/sponsored” flows are intentionally suppressed or replaced with “coming soon”
- apex domain is intentionally not serving the live site right now

## Known current in-progress / not-fully-finished areas

These are the biggest active threads that may still need cleanup or follow-up:

### 1. Request archiving / sorting UX (completed August 13, 2026)

The active local production build now includes:

- open requests and conversations sorted before closed ones
- separate open / closed / archived request views
- separate active / archived conversation views
- mobile swipe-to-archive for closed requests and conversations
- explicit Archive / Restore controls on the full requests page
- Restore controls in the archived conversations view

The required nullable `requesterArchivedAt` column is present in the active local database. The changed archive files pass targeted ESLint and TypeScript checks, and the production build completed successfully.

Files likely involved:

- [prisma/schema.prisma](C:\Users\aftab\Documents\Codex\Minaret%20Fork\prisma\schema.prisma)
- [src/lib/actions/service-requests.ts](C:\Users\aftab\Documents\Codex\Minaret%20Fork\src\lib\actions\service-requests.ts)
- [src/app/dashboard/page.tsx](C:\Users\aftab\Documents\Codex\Minaret%20Fork\src\app\dashboard\page.tsx)
- [src/app/dashboard/requests/page.tsx](C:\Users\aftab\Documents\Codex\Minaret%20Fork\src\app\dashboard\requests\page.tsx)
- [src/app/dashboard/messages/page.tsx](C:\Users\aftab\Documents\Codex\Minaret%20Fork\src\app\dashboard\messages\page.tsx)
- [src/components/dashboard/messages-list.tsx](C:\Users\aftab\Documents\Codex\Minaret%20Fork\src\components\dashboard\messages-list.tsx)
- [src/components/dashboard/recent-requests-panel.tsx](C:\Users\aftab\Documents\Codex\Minaret%20Fork\src\components\dashboard\recent-requests-panel.tsx)

Before changing these, inspect git status carefully.

### 2. File upload robustness

User requested:

- accept a wide variety of image formats/sizes from iPhone/Android
- avoid forcing a tiny upload limit
- compress/normalize on server side for web use

This was requested but not yet clearly completed.

### 3. Message navigation / admin management small regressions

There were recent user reports that:

- some message links were hitting 404
- some admin management UI changes didn’t appear where expected

Treat recent navigation/UI regressions as worth smoke testing.

### 4. Category page improvements

User requested category page improvements including:

- alphabetical ordering
- live search
- filter to only show categories with professionals

Confirm final state before assuming complete.

## Recent notable code/config changes

These were important recent changes near the current state:

- `scripts/setup-environment.ps1`
  - active public origin set to `https://staging.minaretnetwork.ca`
  - scheduled task behavior improved
- `scripts/start-site.ps1`
  - now waits for local auth readiness before launching the site
- `scripts/ensure-site.ps1`
  - new self-healing startup checker
- `src/lib/site-origin.ts`
  - origin normalization for staging / host handling
- `src/proxy.ts`
  - apex domain routing to holding page
- `src/app/upgrades-in-progress/page.tsx`
  - holding page
- `supabase/config.toml`
  - auth/site URLs shifted to staging domain
- `src/app/auth/google/route.ts`
  - site URL source hardened
- `src/app/auth/callback/route.ts`
  - site URL source hardened

## Operational rules for future work

- do not bring staging back as a second environment unless explicitly requested
- prefer one working environment only
- preserve apex-domain holding page unless user asks to relaunch main public site
- be careful with local infra and scheduled tasks; the user is sensitive to token/context waste and wants leaner workflows
- avoid subagents unless truly necessary

## What to inspect first in a new Codex task

In a fresh task, start with:

1. `git status`
2. current branch
3. current local health:
   - site on `127.0.0.1:3220`
   - auth on `127.0.0.1:54321`
4. confirm:
   - [https://staging.minaretnetwork.ca](https://staging.minaretnetwork.ca) serves live app
   - [https://minaretnetwork.ca](https://minaretnetwork.ca) serves holding page
5. review uncommitted request/message archive work before changing dashboard/request UX

## Good prompt to use in the next Codex task

Suggested opener:

“Use `PROJECT_HANDOFF_2026-08-13.md` in the repo as the source of truth for current state. First inspect git status and summarize any uncommitted work before making changes. The active public app should remain on `staging.minaretnetwork.ca`, while `minaretnetwork.ca` should stay on the temporary upgrades page.”
