# Minaret local-stack experiment

This runbook operates only the `agent/local-self-hosting-experiments` stack. It does not replace the hosted upstream project, and its scripts are scoped to the Minaret application, local Supabase services, Nominatim, and the Minaret Funnel routes.

## What is self-hosted

| Capability | Experiment service | Access |
|---|---|---|
| Application | Existing Next.js task | Local and public |
| Database | Supabase CLI PostgreSQL 17 | Host-only, protected by Windows Firewall |
| Email/password authentication | Supabase Auth | Same public Minaret origin |
| Uploaded photos and logos | Supabase Storage local filesystem | Same public Minaret origin |
| Supabase administration | Supabase Studio | Host-only, protected by Windows Firewall |
| Auth test email | Supabase CLI Mailpit inbox | Host-only, protected by Windows Firewall |
| Reverse geocoding | Optional Nominatim 5.3 with Ontario OpenStreetMap data | Loopback through the app's server route |

Google login is intentionally not configured yet. It remains the sole external authentication dependency and needs the repository owner's Google OAuth client ID and secret. The Login and Signup pages therefore show Google sign-in as unavailable while `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false`. Do not enable the public flag or the provider in `supabase/config.toml` until those credentials and callback settings are available; once configured, set the flag to `true` and rebuild the app.

## One-time prerequisite: restart Windows

The machine has sufficient RAM, CPU, disk, and hardware virtualization. Docker Desktop 4.85 is installed with its Hyper-V backend, its service is automatic, and `Aftab` is in the local `docker-users` group. The installer enabled Hyper-V, so Windows must issue a fresh boot and sign-in token before Docker can run Linux containers.

1. Save any unrelated work that is open on the computer.
2. Restart Windows once.
3. Sign back in as `Aftab`. Docker Desktop is configured to start automatically.

No WSL installation is required for this configuration. The scripts start Docker Desktop when it is installed but not running, prepend Docker's installed CLI directory to child-process `PATH` when needed, and detect the specific “member of `docker-users`, but missing from this sign-in token” state. They do not trigger a reboot.

PowerShell script execution is restricted on this machine, so use a process-scoped bypass for these checked-in scripts:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\experiment-start.ps1
```

## Start and seed the core stack

From the repository root, run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\experiment-start.ps1
```

The script:

1. Starts Docker Desktop if necessary and waits for its Linux engine.
2. Runs `npx.cmd supabase start -x realtime,imgproxy,edge-runtime,logflare,vector,supavisor` in the `minaret-experiment` project.
3. Captures `supabase status -o env` in memory and writes only the required values to ignored `.env.local`. Supabase keys are never printed or stored in a temporary log.
4. Refuses to run Prisma unless Supabase reports the expected loopback database and API ports (`54322` and `54321`).
5. Preserves unrelated `.env.local` values and preserves an existing experiment password. Otherwise it generates a strong random password.
6. Runs Prisma `db push` against only the local database and executes `prisma/seed-experiment.ts` using the loopback Supabase Auth endpoint.
7. Stops only the Minaret site task, creates a production Next.js build with the public browser origin, and restarts only that task.

To skip the production build and task restart while diagnosing infrastructure, add `-SkipBuild`. After a manual build, restart only Minaret so it reloads `.env.local`:

```powershell
Stop-ScheduledTask -TaskName "Minaret Network Local Site"
Start-ScheduledTask -TaskName "Minaret Network Local Site"
```

To start infrastructure without applying the schema or refreshing fixtures:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\experiment-start.ps1 -SkipDatabaseSetup
```

## Automatic infrastructure startup

After the first successful setup, register the isolated infrastructure task once:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\experiment-install-autostart.ps1
```

This machine has that task registered as `Minaret Experiment Infrastructure`. It runs 30 seconds after the current user signs in and invokes only:

```text
experiment-start.ps1 -WithNominatim -SkipDatabaseSetup -SkipBuild
```

The task starts Docker Desktop when necessary, restores Supabase and Nominatim, and leaves both application data and the existing production build untouched. It uses the current user with limited privileges and ignores duplicate starts. The separate `Minaret Network Local Site` task continues to start the application itself.

The installer is idempotent and replaces only its own purpose-specific task. To remove that startup behavior without stopping any currently running service:

```powershell
Unregister-ScheduledTask -TaskName "Minaret Experiment Infrastructure" -Confirm:$false
```

## Public same-origin Auth and Storage

The app's browser client uses `https://am5.tail033f8c.ts.net:8443` as its Supabase origin. This is deliberate: a remote browser cannot call this computer's `127.0.0.1`.

After Supabase is healthy, add two narrowly scoped Funnel mounts:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\experiment-publish.ps1
```

The resulting routing design is:

| Public path | Local target |
|---|---|
| `/` and ordinary site paths | Existing Minaret app on `127.0.0.1:3220` |
| `/auth/v1/*` | Supabase gateway target `127.0.0.1:54321/auth/v1` |
| `/storage/v1/*` | Supabase gateway target `127.0.0.1:54321/storage/v1` |

The script uses path mounts on HTTPS port `8443`; it does not replace the root handler.

Remove only those two Supabase mounts with:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\experiment-publish.ps1 -Disable
```

## URLs and ports

| Purpose | URL |
|---|---|
| Minaret public | <https://am5.tail033f8c.ts.net:8443> |
| Minaret local | <http://127.0.0.1:3220> |
| Supabase internal API | <http://127.0.0.1:54321> |
| PostgreSQL | `postgresql://127.0.0.1:54322/postgres` (credentials intentionally omitted) |
| Supabase Studio | <http://127.0.0.1:54323> |
| Auth test-email inbox | <http://127.0.0.1:54324> |
| Nominatim health/API | <http://127.0.0.1:8088/status> |

The Supabase CLI publishes its development ports through Docker on the host. Windows Firewall is enabled with `BlockInbound` on every profile and has no Minaret or Docker inbound allow rule, so those administration ports remain host-only. The publish script exposes only the two explicit Auth and Storage paths through Tailscale Funnel. Never add a Funnel route or inbound firewall exception for PostgreSQL, Studio, the service-role key, or the test-email inbox. Nominatim is explicitly bound to `127.0.0.1`.

## Experiment login accounts

All accounts use the same strong random value stored as `EXPERIMENT_USER_PASSWORD` in ignored `.env.local`. The setup and status scripts never display it.

| Role/state | Email |
|---|---|
| Super admin | `superadmin@minaret-demo.example.com` |
| Admin | `admin@minaret-demo.example.com` |
| Member | `layla.noor@minaret-demo.example.com` |
| Member | `tariq.hussain@minaret-demo.example.com` |
| Approved professional | `amira.rahman@minaret-demo.example.com` |
| Approved professional | `yusuf.khan@minaret-demo.example.com` |
| Approved professional | `farah.siddiqui@minaret-demo.example.com` |
| Approved professional | `omar.farooq@minaret-demo.example.com` |
| Approved professional | `imran.sheikh@minaret-demo.example.com` |
| Approved professional | `samir.qureshi@minaret-demo.example.com` |
| Pending professional | `nadia.ali@minaret-demo.example.com` |
| Rejected professional | `bilal.ahmed@minaret-demo.example.com` |
| Suspended professional | `huda.hassan@minaret-demo.example.com` |

When an authorized local operator needs the shared password, this explicit command reveals it only in that local terminal:

```powershell
$line = Get-Content .env.local | Where-Object { $_ -like 'EXPERIMENT_USER_PASSWORD=*' } | Select-Object -First 1
$line.Substring($line.IndexOf('=') + 1).Trim('"')
```

Do not paste that password into chat, email, screenshots, commits, or issue reports. The `.example.com` identities and all directory records are fictional test fixtures.

## Optional exact Nominatim service

Start Supabase and the Ontario Nominatim container together with:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\experiment-start.ps1 -WithNominatim
```

This uses the exact Nominatim service already declared in `infra/nominatim/compose.yaml`, not a mock API. Its first run downloads the current Ontario OpenStreetMap PBF (roughly 1 GB) and builds a much larger PostgreSQL/PostGIS index. Depending on disk and network speed, the initial import can take tens of minutes to several hours and consume many gigabytes. The `/status` endpoint may be unavailable throughout that import. Subsequent starts reuse the named volume.

The Ontario import needs more memory than Docker Desktop's 2 GB factory minimum. This machine allocates 12 GB to Docker's Hyper-V VM; the start script refuses to launch Nominatim below 8 GiB instead of allowing an out-of-memory restart loop. Set the limit in Docker Desktop under **Settings > Resources > Advanced > Memory limit**, then apply Docker's restart. The compose file uses conservative PostgreSQL memory and indexing settings and deliberately avoids the 75+ GB flat-node file intended for continent/planet imports.

Nominatim is independent from Supabase's PostgreSQL and does not use port `54322`. The application retains its bundled GTA/Ontario centroid fallback while Nominatim is unavailable. OpenStreetMap attribution and periodic data updates remain required for ongoing use.

## Status

Run the secret-free status report at any time:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\experiment-status.ps1
```

It reports Docker/container state, sanitized Supabase endpoints, local/public Minaret HTTP checks, and the complete Funnel route table.

## Backup

With Supabase running, create a timestamped backup outside the repository:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\experiment-backup.ps1
```

The default destination is `Minaret Backups` under the current Windows Documents folder. Use `-DestinationRoot D:\Minaret-Backups` to choose another drive. Each backup includes:

- A custom-format PostgreSQL dump containing application data, Supabase Auth users/metadata, and Storage metadata.
- The local Supabase Storage files.
- A copy of the non-secret Supabase configuration and a SHA-256 manifest.

It intentionally excludes `.env.local`, Google credentials, and Nominatim's rebuildable map index. Keep a separate secure, encrypted copy of `.env.local` if retaining the experiment login password matters. Backup folders contain user records and should not be committed or publicly shared.

Restore is intentionally not automated because it overwrites the target database. Restore only into a clean experiment stack after confirming the exact backup directory and taking a fresh backup of the current state.

## Stop or roll back

Stop Supabase while retaining all Docker volumes:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\experiment-stop.ps1
```

Stop Nominatim too and remove the two public Supabase mounts:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\experiment-stop.ps1 -StopNominatim -Unpublish
```

This deliberately leaves Docker Desktop, Tailscale, and the Minaret site task running. It never uses `supabase stop --all`, `--no-backup`, `docker compose down -v`, or a Funnel reset.

After stopping and unpublishing, switching back to `master` rolls back the application code. Docker volumes remain available if the experiment branch is revisited. Deleting the `minaret-experiment` or `minaret-experiment-geocoder` volumes is destructive and should only be done after an explicit backup and target review.
