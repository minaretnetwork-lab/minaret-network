# Minaret Network

Minaret Network is a self-hosted community professional directory for mosque communities in the GTA. It helps members find mosque-affiliated and community-recommended professionals, submit service requests, message professionals, and use an AI matching assistant to find relevant listings.

The current deployment is designed to run locally on a Windows machine, with public access provided through Cloudflare Tunnel.

## What the site does

- Public professional directory with category, location, language, and service-area filtering
- Homepage search by service/category/name and GTA city/area
- AI match assistant bubble that suggests relevant local professionals from the database
- Service request flow for users who want professionals to respond
- Incoming service requests for professionals, matched by category and location
- Internal messaging tied to service requests
- Professional registration and listing management
- Admin approval flow for professional applications
- Mosque affiliation and mosque suggestion workflow
- Sponsored and featured listings managed manually by admins for now
- Admin dashboards for professionals, users, categories, mosques, recommendations, service requests, and analytics
- Google OAuth login plus manual email/password login
- Local staging and production environments, each with its own database and app port

## Tech stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Prisma ORM
- Local Supabase stack for Auth, Postgres, and Storage
- Google OAuth through Supabase Auth
- OpenAI API for the AI matching assistant
- Cloudflare Tunnel for public HTTPS access to the locally hosted app

## Current hosting model

The app is hosted locally on the machine and exposed publicly through Cloudflare.

There are two local environments:

| Environment | Public URL | Local app port | Local Postgres port | Next build dir | Env file |
|---|---:|---:|---:|---|---|
| Production | `https://minaretnetwork.ca` | `3220` | `54322` | `.next-production` | `.env.production.local` |
| Staging | `https://staging.minaretnetwork.ca` | `3221` | `54422` | `.next-staging` | `.env.staging.local` |

Production is the clean/live site. Staging is for testing changes, seeded data, and validating workflows before promotion.

## Prerequisites

- Windows with PowerShell
- Node.js
- Docker Desktop
- npm dependencies installed with `npm install`
- Supabase CLI available through `npx supabase`
- Cloudflare Tunnel configured for:
  - `minaretnetwork.ca` to the local production app
  - `staging.minaretnetwork.ca` to the local staging app
- Google OAuth credentials configured for both production and staging callback URLs
- Optional OpenAI API key for the AI match assistant

## Environment setup

The repo includes scripts for setting up and running both environments.

### Staging

Set up staging with fixture/test data:

```powershell
npm run env:setup:staging
```

This creates or updates:

- `.env.staging.local`
- local staging Supabase runtime under `.minaret-runtime/staging`
- staging database schema
- staging fixture data
- `.next-staging` build
- Windows scheduled task: `Minaret Network Staging Site`

Start staging manually:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-site.ps1 -Environment staging
```

### Production

Set up production without fixture data:

```powershell
npm run env:setup:production
```

This creates or updates:

- `.env.production.local`
- production Supabase database/schema
- `.next-production` build
- Windows scheduled task: `Minaret Network Local Site`

Start production manually:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-site.ps1 -Environment production
```

### Clean production reset

Production reset is intentionally guarded because it destroys live data.

```powershell
npm run env:reset:production
```

Only use this when intentionally preparing a clean launch state.

## Promotion workflow

The normal workflow is:

1. Make and test changes on staging.
2. Build staging and verify the relevant pages.
3. Promote the same code to production.
4. Sync the production database schema if the Prisma schema changed.
5. Build production into `.next-production`.
6. Restart the production local server.
7. Smoke-check public and protected routes.

Example production build environment:

```powershell
$env:DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres'
$env:DIRECT_URL=$env:DATABASE_URL
$env:NEXT_PUBLIC_SUPABASE_URL='https://minaretnetwork.ca'
$env:NEXT_PUBLIC_SITE_URL='https://minaretnetwork.ca'
$env:MINARET_ENV_FILE='.env.production.local'
$env:MINARET_ENVIRONMENT='production'
$env:NEXT_DIST_DIR='.next-production'
npx next build
```

If `next build` changes `tsconfig.json` by adding environment-specific `.next-*` type paths, restore it before committing:

```powershell
git restore --worktree -- tsconfig.json
```

## Database

Prisma is the source of truth for the database schema.

Useful commands:

```powershell
npm run db:generate
npm run db:push
npm run db:studio
```

When targeting a specific environment, set `DATABASE_URL` and `DIRECT_URL` first.

Production database:

```powershell
$env:DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres'
$env:DIRECT_URL=$env:DATABASE_URL
```

Staging database:

```powershell
$env:DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54422/postgres'
$env:DIRECT_URL=$env:DATABASE_URL
```

Then apply schema:

```powershell
npx prisma db push
npx prisma generate
```

## Authentication

Authentication is handled by local Supabase Auth.

Supported sign-in methods:

- Google OAuth
- Email/password

Important notes:

- Email/password signup does not require email confirmation right now because outbound email has not been configured.
- The app should not send users to a “check your inbox” verification screen unless transactional email is added later.
- Google OAuth users may appear as provider-verified in the admin Users table.
- Google OAuth callback URLs must be registered in Google Cloud Console for both:
  - `https://minaretnetwork.ca/auth/v1/callback`
  - `https://staging.minaretnetwork.ca/auth/v1/callback`

## AI matching

The AI match assistant uses the current database as its source of truth. It does not guess from a static list.

At runtime, the assistant:

1. Reads approved professionals, categories, locations, and listing details.
2. Classifies the visitor’s request.
3. Matches the request to suitable businesses.
4. Prefers local/location-matching results.
5. Falls back to next-best nearby results when there is no exact local match.
6. Allows the user to message, WhatsApp, email, call, or broadcast a request.

The AI assistant requires `OPENAI_API_KEY` in the environment.

## Professional listings

Professional users can:

- Create more than one professional listing
- Submit applications for admin review
- Call back submitted applications for edits
- Resubmit after editing
- Delete rejected, submitted, withdrawn, or live listings
- Manage contact details, service areas, business address, walk-in availability, languages, schedule, gallery images, and mosque affiliation

Live listing deletion requires an explicit confirmation to reduce accidental removal.

Application statuses:

- `PENDING`
- `WITHDRAWN`
- `APPROVED`
- `REJECTED`
- `SUSPENDED`

## Admin capabilities

Admins can:

- Review professional applications
- Click into application detail pages
- Approve, reject, or suspend professionals
- Manually mark approved professionals as sponsored or featured
- Confirm mosque affiliation badges
- Moderate recommendations
- Manage categories and category suggestions
- Manage mosques and mosque suggestions
- View registered users, roles, listings, requests, and activity signals
- View lightweight analytics such as visitors, searches, searched regions, popular listings, and top search terms

Users with approved professional listings are displayed as professionals in the admin Users table, even if their base account role is still `MEMBER`.

## Service requests and messaging

Members can submit service requests by category, location, description, preferred date, and contact method.

Professionals see incoming requests when they match:

- the professional listing category
- the relevant service area/location

Professionals can respond by:

- internal site messaging
- WhatsApp
- email
- phone

Internal messaging is tied to the service request so both sides can follow the conversation history.

## Public access

The site is exposed publicly through Cloudflare Tunnel, while the app and databases continue to run locally.

The public domains should route to:

- production app on `127.0.0.1:3220`
- staging app on `127.0.0.1:3221`

Cloudflare DNS and tunnel configuration should be kept in sync with the local ports above.

## Project structure

```text
src/
  app/
    (public)/                 Public site pages
    admin/                    Admin dashboard and moderation tools
    api/                      API routes for AI, analytics, geocode, messages, applications
    auth/                     Login, signup, OAuth callback, sign-out
    dashboard/                Member/professional dashboard
    professionals/register    Professional registration flow
  components/
    admin/                    Admin tables and management components
    dashboard/                Dashboard widgets and forms
    home/                     Homepage search and content sections
    layout/                   Navigation and footer
    professionals/            Directory cards, filters, registration form
    ui/                       Shared UI primitives
  lib/
    actions/                  Server actions
    supabase/                 Supabase clients
    prisma.ts                 Prisma singleton
    service-area-coordinates.ts
    utils.ts
  types/
    index.ts
prisma/
  schema.prisma
  seed.ts
  seed-experiment.ts
  seed-test-data.ts
scripts/
  setup-environment.ps1
  start-site.ps1
  start-local.mjs
```

## Notes for future maintainers

- This project uses a newer Next.js version. Check `node_modules/next/dist/docs/` before changing framework-specific behavior.
- Keep production and staging databases separate.
- Do not seed production with fixtures.
- Do not expose service role keys or local database credentials.
- If outbound email is added later, update the auth flow and documentation so email verification and transactional notifications are accurate.
- Sponsored and featured self-serve purchasing is intentionally disabled for now; admins manage those statuses manually.
