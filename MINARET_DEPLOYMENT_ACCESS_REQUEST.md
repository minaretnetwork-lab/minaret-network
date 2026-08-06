# Minaret Network — Deployment Access Request

Hi,

We have forked `nafeeshaq-nuvaro/minaret-network` and are hosting the fork on a private Windows machine. The public HTTPS address is:

**https://am5.tail033f8c.ts.net:8443**

The application is running, but it needs access to the existing Supabase/PostgreSQL project before listings, authentication, submissions, and administration will work.

## Preferred option: grant project access

Please invite the operator to the existing **Supabase project** with enough access to view project settings, API keys, database connection strings, authentication providers, and URL configuration.

If the production environment is managed through Vercel or another deployment platform, please also grant appropriate access there so the existing environment-variable names and values can be copied securely.

This option is preferred because credentials do not need to be sent in a message.

## Alternative: provide these environment values securely

If project access cannot be granted, please provide the following values from the existing deployment:

```dotenv
# Supabase PostgreSQL connection string used by Prisma.
DATABASE_URL=

# Direct/non-pooled PostgreSQL connection string, if the project uses one.
# Please identify whether this is required for schema changes or migrations.
DIRECT_URL=

# Supabase project API URL, for example https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_URL=

# Supabase public/anon API key.
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Supabase service-role key. This is highly sensitive and must be shared securely.
SUPABASE_SERVICE_ROLE_KEY=

# Mosque slug currently used by the production site.
NEXT_PUBLIC_DEFAULT_MOSQUE_SLUG=
```

Please also confirm:

- Whether `DATABASE_URL` is the pooled or direct connection string.
- Whether the database requires an IPv4-compatible Supabase pooler from this host.
- Whether the current database may be used by this fork, or whether a separate Supabase project/database should be created.
- Whether any additional environment variables exist in the current production deployment, even if they are not documented in the repository.
- Which Supabase Auth providers are enabled, including Google OAuth.
- Whether email confirmation, SMTP, CAPTCHA, rate limits, or other authentication settings require configuration.
- Whether the database schema and seed data are already current for this commit.
- Which user account should receive `ADMIN` or `SUPER_ADMIN` access for testing.

## Supabase authentication URL changes

Please add the following public URL to the Supabase project’s allowed URL configuration without removing existing production URLs:

- Site/allowed origin: `https://am5.tail033f8c.ts.net:8443`
- OAuth/email callback: `https://am5.tail033f8c.ts.net:8443/auth/callback`

Please retain any existing localhost, preview, and production redirect URLs.

If Supabase supports wildcard-free entries only, add the exact callback URL above. If additional application routes are required by the existing authentication setup, please provide them as well.

## Secure delivery requirements

Please **do not** send database passwords, connection strings, or the service-role key through ordinary email, SMS, GitHub issues, or chat.

Use one of these methods instead:

1. Grant access directly to the Supabase/deployment project.
2. Share the secrets through an approved password manager.
3. Use an encrypted, expiring one-time secret link and send its password through a separate channel.

The values will be stored only in the machine’s ignored `.env.local` file. They will not be committed to Git or pushed to GitHub.

## Repository details

- Original: https://github.com/nafeeshaq-nuvaro/minaret-network
- Fork: https://github.com/Gobbledegookie/minaret-network
- Public host: https://am5.tail033f8c.ts.net:8443

Thank you.
