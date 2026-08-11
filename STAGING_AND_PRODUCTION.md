# Minaret staging and production

This repo can run two local/self-hosted environments side by side:

- Production: clean public site at `https://minaretnetwork.ca`, local app port `3220`, Supabase ports `54321-54324`.
- Staging: test-data site at `https://staging.minaretnetwork.ca`, local app port `3221`, Supabase ports `54421-54424`.

## Staging

Use staging for testing dummy users, listings, service requests, chats, and LLM matching.

```powershell
npm run env:setup:staging
```

This creates:

- `.env.staging.local`
- `.next-staging/`
- `.minaret-runtime/staging/`
- Windows scheduled task: `Minaret Network Staging Site`, if Windows allows task creation from the current shell.

If Windows denies scheduled-task creation, staging can still run as a transient background process. To make it auto-start on login, rerun the setup command from an elevated PowerShell.

Cloudflare tunnel routes needed for public staging:

- `staging.minaretnetwork.ca` → `http://127.0.0.1:3221`
- `staging.minaretnetwork.ca/auth/v1/*` → `http://127.0.0.1:54421/auth/v1/*`
- `staging.minaretnetwork.ca/storage/v1/*` → `http://127.0.0.1:54421/storage/v1/*`

If Google auth is enabled for staging, add this redirect URI in Google Cloud:

```text
https://staging.minaretnetwork.ca/auth/v1/callback
```

## Production

Use production for the real public launch.

```powershell
npm run env:setup:production
```

To intentionally wipe production users/listings/requests/chats and keep only system data such as categories, service areas, mosque, and pricing tiers:

```powershell
npm run env:reset:production
```

That reset is intentionally guarded in `scripts/setup-environment.ps1` and `prisma/seed-clean.ts`.

## Notes

Environment files are git-ignored. Builds and runtime copies are also git-ignored so fixture/staging data does not leak into the repo.
