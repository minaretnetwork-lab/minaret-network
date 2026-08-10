[CmdletBinding()]
param(
  [switch]$WithNominatim,
  [switch]$SkipDatabaseSetup,
  [switch]$SkipBuild,
  [ValidateRange(60, 900)]
  [int]$DockerTimeoutSeconds = 300
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "experiment-common.ps1")

$workspace = Get-ExperimentWorkspace
$publicOrigin = "https://am5.tail033f8c.ts.net:8443"
$envPath = Join-Path $workspace ".env.local"

Write-Host "Checking Docker Desktop..."
$dockerPath = Get-ExperimentDockerPath
if (Test-ExperimentDockerTokenRefreshRequired) {
  throw "Docker Desktop is installed and this account is in docker-users, but the current Windows sign-in token does not include that group yet. Sign out and back in, or restart Windows once, then rerun this script."
}
$dockerInfo = Invoke-ExperimentNativeQuiet -FilePath $dockerPath -Arguments @("info", "--format", "{{.ServerVersion}}")
if ($dockerInfo.ExitCode -ne 0) {
  if (Test-ExperimentDockerTokenRefreshRequired) {
    throw "Docker Desktop is installed and this account is in docker-users, but the current Windows sign-in token does not include that group yet. Sign out and back in, or restart Windows once, then rerun this script."
  }

  $desktopCandidates = @(
    (Join-Path $env:ProgramFiles "Docker\Docker\Docker Desktop.exe"),
    (Join-Path $env:LOCALAPPDATA "Programs\DockerDesktop\Docker Desktop.exe"),
    (Join-Path $env:LOCALAPPDATA "Docker\Docker\Docker Desktop.exe")
  )
  $desktopPath = $desktopCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
  if (-not $desktopPath) {
    throw "Docker Desktop is not installed or could not be located. Install it with either its Hyper-V or WSL2 backend, then rerun this script."
  }

  Write-Host "Starting Docker Desktop and waiting for the Linux engine..."
  Start-Process -FilePath $desktopPath -WindowStyle Hidden | Out-Null
  $timer = [System.Diagnostics.Stopwatch]::StartNew()
  do {
    Start-Sleep -Seconds 2
    $dockerInfo = Invoke-ExperimentNativeQuiet -FilePath $dockerPath -Arguments @("info", "--format", "{{.ServerVersion}}")
  } while ($dockerInfo.ExitCode -ne 0 -and $timer.Elapsed.TotalSeconds -lt $DockerTimeoutSeconds)
  $timer.Stop()

  if ($dockerInfo.ExitCode -ne 0) {
    if (Test-ExperimentDockerTokenRefreshRequired) {
      throw "Docker is installed, but this Windows session still lacks the docker-users token. Sign out and back in, or restart Windows once, then rerun this script."
    }
    throw "Docker Desktop did not become ready within $DockerTimeoutSeconds seconds. Open Docker Desktop, resolve any first-run prompt, and rerun this script."
  }
}

$npxPath = Get-ExperimentNpxPath
Push-Location $workspace
try {
  Write-Host "Starting the isolated Minaret Supabase services (initial image downloads can take several minutes)..."
  # Supabase prints API keys on a normal start. Capture all output so no key is
  # written to the terminal or to a temporary log file.
  $supabaseStart = Invoke-ExperimentNativeQuiet -FilePath $npxPath -Arguments @(
    "supabase",
    "start",
    "-x",
    "realtime,imgproxy,edge-runtime,logflare,vector,supavisor"
  )
  if ($supabaseStart.ExitCode -ne 0) {
    throw "Supabase failed to start. Its potentially secret-bearing output was suppressed; run scripts/experiment-status.ps1, then inspect Docker Desktop if more detail is needed."
  }

  $supabase = Get-ExperimentSupabaseStatusEnv -NpxPath $npxPath
  $databaseUri = [Uri]$supabase["DB_URL"]
  $apiUri = [Uri]$supabase["API_URL"]
  if ($databaseUri.Host -notin @("127.0.0.1", "localhost") -or $databaseUri.Port -ne 54322) {
    throw "Safety check failed: Supabase reported a database other than the isolated loopback port 54322. No schema or seed command was run."
  }
  if ($apiUri.Host -notin @("127.0.0.1", "localhost") -or $apiUri.Port -ne 54321) {
    throw "Safety check failed: Supabase reported an API other than the isolated loopback port 54321. No schema or seed command was run."
  }
  $existingEnv = Get-ExperimentDotEnvMap -Path $envPath

  $experimentPassword = if (
    $existingEnv.ContainsKey("EXPERIMENT_USER_PASSWORD") -and
    $existingEnv["EXPERIMENT_USER_PASSWORD"].Length -ge 12 -and
    $existingEnv["EXPERIMENT_USER_PASSWORD"] -ne "GENERATED_BY_EXPERIMENT_SETUP"
  ) {
    $existingEnv["EXPERIMENT_USER_PASSWORD"]
  }
  else {
    New-ExperimentSecret
  }

  $mosqueSlug = if (
    $existingEnv.ContainsKey("NEXT_PUBLIC_DEFAULT_MOSQUE_SLUG") -and
    -not [string]::IsNullOrWhiteSpace($existingEnv["NEXT_PUBLIC_DEFAULT_MOSQUE_SLUG"])
  ) {
    $existingEnv["NEXT_PUBLIC_DEFAULT_MOSQUE_SLUG"]
  }
  else {
    "al-falah"
  }

  # This public UI flag is intentionally independent of OAuth secrets. Preserve
  # an explicit true value so Google can be enabled after its provider config is added.
  $googleAuthEnabled = if (
    $existingEnv.ContainsKey("NEXT_PUBLIC_GOOGLE_AUTH_ENABLED") -and
    $existingEnv["NEXT_PUBLIC_GOOGLE_AUTH_ENABLED"] -eq "true"
  ) {
    "true"
  }
  else {
    "false"
  }

  $managedValues = [ordered]@{
    DATABASE_URL                  = $supabase["DB_URL"]
    DIRECT_URL                    = $supabase["DB_URL"]
    NEXT_PUBLIC_SUPABASE_URL      = $publicOrigin
    SUPABASE_INTERNAL_URL         = $supabase["API_URL"]
    NEXT_PUBLIC_SUPABASE_ANON_KEY = $supabase["ANON_KEY"]
    SUPABASE_SERVICE_ROLE_KEY     = $supabase["SERVICE_ROLE_KEY"]
    NEXT_PUBLIC_GOOGLE_AUTH_ENABLED = $googleAuthEnabled
    NEXT_PUBLIC_DEFAULT_MOSQUE_SLUG = $mosqueSlug
    NEXT_PUBLIC_SITE_URL          = $publicOrigin
    NOMINATIM_URL                 = "http://127.0.0.1:8088"
    EXPERIMENT_USER_PASSWORD      = $experimentPassword
  }
  Set-ExperimentDotEnvValues -Path $envPath -Values $managedValues
  Write-Host "Updated .env.local with local-stack values (secret values were not displayed)."

  if (-not $SkipDatabaseSetup) {
    # Prisma does not automatically load .env.local. Supply the values only to
    # these child processes. Seed Auth locally even though browsers use Funnel.
    $env:DATABASE_URL = $supabase["DB_URL"]
    $env:DIRECT_URL = $supabase["DB_URL"]
    # Admin uploads use SUPABASE_INTERNAL_URL, while any persisted/public
    # Storage URLs must be usable by remote browsers through Funnel.
    $env:NEXT_PUBLIC_SUPABASE_URL = $publicOrigin
    $env:SUPABASE_INTERNAL_URL = $supabase["API_URL"]
    $env:NEXT_PUBLIC_SUPABASE_ANON_KEY = $supabase["ANON_KEY"]
    $env:SUPABASE_SERVICE_ROLE_KEY = $supabase["SERVICE_ROLE_KEY"]
    $env:NEXT_PUBLIC_GOOGLE_AUTH_ENABLED = $googleAuthEnabled
    $env:NEXT_PUBLIC_DEFAULT_MOSQUE_SLUG = $mosqueSlug
    $env:NEXT_PUBLIC_SITE_URL = $publicOrigin
    $env:NOMINATIM_URL = "http://127.0.0.1:8088"
    $env:EXPERIMENT_USER_PASSWORD = $experimentPassword

    Write-Host "Applying the Prisma schema..."
    $dbPush = Invoke-ExperimentNativeQuiet -FilePath $npxPath -Arguments @("prisma", "db", "push")
    if ($dbPush.ExitCode -ne 0) {
      throw "Prisma db push failed. Secret-bearing command output was suppressed. The local database remains isolated."
    }

    Write-Host "Creating or refreshing experiment Auth users and fixtures..."
    $seed = Invoke-ExperimentNativeQuiet -FilePath $npxPath -Arguments @(
      "tsx", "prisma/seed-experiment.ts"
    )
    if ($seed.ExitCode -ne 0) {
      throw "The experiment seed failed. Secret-bearing command output was suppressed; no production database was targeted."
    }
  }

  if ($WithNominatim) {
    $dockerMemoryResult = Invoke-ExperimentNativeQuiet -FilePath $dockerPath -Arguments @(
      "info", "--format", "{{.MemTotal}}"
    )
    [long]$dockerMemoryBytes = 0
    if (
      $dockerMemoryResult.ExitCode -ne 0 -or
      -not [long]::TryParse($dockerMemoryResult.Output.Trim(), [ref]$dockerMemoryBytes) -or
      $dockerMemoryBytes -lt 8GB
    ) {
      throw "Nominatim requires at least 8 GiB allocated to Docker Desktop for this Ontario import. Set Docker Desktop > Settings > Resources > Memory to 12 GB, apply the restart, and rerun this command. Supabase and the site remain available."
    }

    $nominatimDirectory = Join-Path $workspace "infra\nominatim"
    $nominatimEnvPath = Join-Path $nominatimDirectory ".env"
    $nominatimEnv = Get-ExperimentDotEnvMap -Path $nominatimEnvPath
    $nominatimPassword = if (
      $nominatimEnv.ContainsKey("NOMINATIM_PASSWORD") -and
      $nominatimEnv["NOMINATIM_PASSWORD"].Length -ge 24 -and
      $nominatimEnv["NOMINATIM_PASSWORD"] -notmatch '^replace-'
    ) {
      $nominatimEnv["NOMINATIM_PASSWORD"]
    }
    else {
      New-ExperimentSecret
    }
    Set-ExperimentDotEnvValues -Path $nominatimEnvPath -Values ([ordered]@{
      NOMINATIM_PASSWORD = $nominatimPassword
    })

    Write-Host "Starting the optional Ontario Nominatim import in the background..."
    $nominatimStart = Invoke-ExperimentNativeQuiet -FilePath $dockerPath -Arguments @(
      "compose",
      "--env-file", $nominatimEnvPath,
      "-f", (Join-Path $nominatimDirectory "compose.yaml"),
      "up", "-d"
    )
    if ($nominatimStart.ExitCode -ne 0) {
      throw "Nominatim failed to start. Supabase and the seeded Minaret database remain available."
    }
    Write-Host "Nominatim is importing Ontario data. It may remain unhealthy for tens of minutes or several hours."
  }

  if (-not $SkipBuild) {
    # NEXT_PUBLIC_* values are embedded into browser bundles at build time.
    # The seed intentionally used the loopback API; restore the public origin
    # before creating the production build.
    $env:NEXT_PUBLIC_SUPABASE_URL = $publicOrigin
    $env:NEXT_PUBLIC_GOOGLE_AUTH_ENABLED = $googleAuthEnabled

    $taskName = "Minaret Network Local Site"
    $siteTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($siteTask -and $siteTask.State -eq "Running") {
      Write-Host "Stopping only the Minaret site task for a clean production build..."
      Stop-ScheduledTask -TaskName $taskName
      $timer = [System.Diagnostics.Stopwatch]::StartNew()
      do {
        Start-Sleep -Milliseconds 500
        $listener = Get-NetTCPConnection -State Listen -LocalPort 3220 -ErrorAction SilentlyContinue
      } while ($listener -and $timer.Elapsed.TotalSeconds -lt 30)
      $timer.Stop()
    }

    Write-Host "Creating the production Next.js build..."
    $npmPath = Get-ExperimentNpmPath
    $build = Invoke-ExperimentNativeQuiet -FilePath $npmPath -Arguments @("run", "build")
    if ($build.ExitCode -ne 0) {
      if ($siteTask) {
        Start-ScheduledTask -TaskName $taskName
      }
      throw "The production build failed. Output was suppressed because build errors can include environment details. Run 'npm.cmd run build' locally to diagnose it."
    }

    if ($siteTask) {
      Write-Host "Starting only the Minaret site task with the new production build..."
      Start-ScheduledTask -TaskName $taskName
    }
    else {
      Write-Host "Production build created. No '$taskName' scheduled task was found; start it with 'npm.cmd start -- -H 127.0.0.1 -p 3220'."
    }
  }
}
finally {
  Pop-Location
}

Write-Host "Experiment services are ready locally."
Write-Host "Local site:    http://127.0.0.1:3220"
Write-Host "Supabase UI:   http://127.0.0.1:54323"
Write-Host "Test email UI: http://127.0.0.1:54324"
Write-Host "Run scripts/experiment-publish.ps1 to mount Auth and Storage under the existing public Minaret URL."
if ($SkipBuild) {
  Write-Host "The build was skipped. Restart only the 'Minaret Network Local Site' task after rebuilding so it reloads .env.local."
}
