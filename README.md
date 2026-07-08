# Al-Falah Trusted Professionals Network

A production-quality web platform that helps mosque members find trusted, verified professionals from within the community.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: Supabase Auth (email + Google OAuth)
- **Database**: Supabase PostgreSQL (via Prisma ORM)
- **Validation**: Zod + React Hook Form

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
copy .env.local.example .env.local
```

Fill in your Supabase project URL, anon key, service role key, and database URLs.

### 3. IMPORTANT — Remove the scaffolding conflict

`create-next-app` generates `src/app/page.tsx` which conflicts with the route group homepage at `src/app/(public)/page.tsx`. Delete it before building:

```bash
# Windows (PowerShell)
Remove-Item src\app\page.tsx

# Mac/Linux
rm src/app/page.tsx
```

### 4. Set up database

```bash
# Push schema to Supabase (no migration history)
npm run db:push

# Seed categories and service areas
npm run db:seed
```

### 5. Run development server

```bash
npm run dev
```

Open http://localhost:3000.

## Supabase Setup

1. Create a new Supabase project at supabase.com
2. Go to **Authentication > Providers** and enable:
   - Email (enable "Confirm email")
   - Google OAuth (add your Google OAuth credentials)
3. Go to **Authentication > URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
4. Copy your project URL, anon key, service role key, and database passwords into `.env.local`

## User Roles

| Role | Access |
|------|--------|
| `MEMBER` | Browse, search, contact, submit requests & recommendations |
| `PROFESSIONAL` | All member access + manage own listing |
| `ADMIN` | Full access + approve professionals, moderate content |
| `SUPER_ADMIN` | Full platform control |

To promote a user to admin, update their `role` in the Supabase `users` table via Prisma Studio:

```bash
npm run db:studio
```

## Database Commands

```bash
npm run db:push      # Push schema without migration history
npm run db:migrate   # Create and apply a new migration
npm run db:seed      # Seed categories and service areas
npm run db:studio    # Open Prisma Studio (database GUI)
npm run db:generate  # Regenerate Prisma client after schema changes
```

## Project Structure

```
src/
├── app/
│   ├── (public)/           # Public pages — Navbar + Footer layout
│   │   ├── layout.tsx      # Shared public layout
│   │   ├── page.tsx        # Homepage
│   │   ├── professionals/  # Directory + individual profiles
│   │   ├── categories/     # Category browser
│   │   └── request/        # Service request form
│   ├── admin/              # Admin panel (ADMIN/SUPER_ADMIN only)
│   │   ├── page.tsx        # Dashboard with stats
│   │   ├── professionals/  # Approve/reject/badge professionals
│   │   ├── recommendations/# Moderate recommendations
│   │   ├── requests/       # View service requests
│   │   └── categories/     # Manage categories
│   ├── auth/               # Login, signup, OAuth callback, sign-out
│   └── dashboard/          # Member dashboard
│       ├── page.tsx        # Overview
│       ├── profile/        # Edit profile
│       ├── requests/       # My service requests
│       └── professional/   # Professional listing status
├── components/
│   ├── admin/              # Admin table + moderation components
│   ├── home/               # Hero search, category grid
│   ├── layout/             # Navbar, Footer
│   ├── professionals/      # Cards, search, filters, badges, forms
│   └── service-request-form.tsx
├── lib/
│   ├── actions/            # Server Actions
│   │   ├── auth.ts
│   │   ├── admin.ts
│   │   ├── professionals.ts
│   │   ├── recommendations.ts
│   │   └── service-requests.ts
│   ├── supabase/           # Browser, server, middleware clients
│   ├── constants.ts        # Categories, languages, service areas
│   ├── prisma.ts           # Prisma singleton
│   └── utils.ts            # cn, slugify, formatDate, etc.
├── middleware.ts            # Route protection + session refresh
├── types/index.ts           # Shared TypeScript types
└── prisma/
    ├── schema.prisma        # Full normalized schema (mosque-scoped)
    └── seed.ts              # Seed script
```

## Multi-Mosque Architecture

The database is mosque-scoped from day one. Every entity belongs to a mosque via `mosqueId`. The `NEXT_PUBLIC_DEFAULT_MOSQUE_SLUG` env var controls which mosque the app serves. Supporting multiple mosques in a future version requires only:

1. A request-level mosque resolver (subdomain or path prefix)
2. Passing the resolved mosque slug through context
3. No schema changes — all queries already accept `mosqueSlug`

## Deployment

```bash
npx vercel --prod
```

Set all `NEXT_PUBLIC_*` and private env vars in Vercel project settings.
Update the Supabase redirect URL to your production domain.
