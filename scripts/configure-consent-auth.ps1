[CmdletBinding()]
param(
  [string]$Environment = "production"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "experiment-common.ps1")

$workspace = Get-ExperimentWorkspace
$envCandidates = @(
  (Join-Path $workspace ".env.$Environment.local"),
  (Join-Path $workspace ".env.local")
)

$envMap = @{}
foreach ($envPath in $envCandidates) {
  if (-not (Test-Path -LiteralPath $envPath)) {
    continue
  }

  foreach ($line in [System.IO.File]::ReadAllLines($envPath)) {
    if ($line -match '^\s*#' -or $line -notmatch '=') {
      continue
    }

    $idx = $line.IndexOf("=")
    $key = $line.Substring(0, $idx).Trim()
    $value = $line.Substring($idx + 1).Trim()
    if ($value.Length -ge 2) {
      $first = $value.Substring(0, 1)
      $last = $value.Substring($value.Length - 1, 1)
      if (($first -eq '"' -and $last -eq '"') -or ($first -eq "'" -and $last -eq "'")) {
        $value = $value.Substring(1, $value.Length - 2)
      }
    }
    if ($key) {
      $envMap[$key] = $value
    }
  }
}

$googleSecret = $envMap["SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET"]
if ([string]::IsNullOrWhiteSpace($googleSecret)) {
  throw "SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET is missing from local environment files."
}

$clientId = if (-not [string]::IsNullOrWhiteSpace($envMap["SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID"])) {
  $envMap["SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID"]
} else {
  "1030105890262-70tati9hevbb4l3s0pv70oeq8l9ng1fr.apps.googleusercontent.com"
}

$publicOrigin = "https://consent.minaretnetwork.ca"
$stagingOrigin = "https://staging.minaretnetwork.ca"
$stagingWwwOrigin = "https://www.staging.minaretnetwork.ca"
$tailscaleOrigin = "https://am5.tail033f8c.ts.net:8443"

$allowList = @(
  "http://127.0.0.1:3220/auth/callback",
  "http://127.0.0.1:3220/auth/callback?next=/auth/update-password",
  "http://localhost:3220/auth/callback",
  "http://localhost:3220/auth/callback?next=/auth/update-password",
  "$publicOrigin/auth/callback",
  "$publicOrigin/auth/callback?next=/auth/re-consent?source=listing-restoration",
  "$publicOrigin/auth/callback?next=%2Fauth%2Fre-consent%3Fsource%3Dlisting-restoration",
  "$stagingOrigin/auth/callback",
  "$stagingOrigin/auth/callback?next=/auth/update-password",
  "$stagingOrigin/auth/callback?next=/dashboard",
  "$stagingOrigin/auth/callback?next=/professionals/register",
  "$stagingOrigin/auth/callback?next=%2Fprofessionals%2Fregister",
  "$stagingWwwOrigin/auth/callback",
  "$stagingWwwOrigin/auth/callback?next=/auth/update-password",
  "$stagingWwwOrigin/auth/callback?next=/dashboard",
  "$stagingWwwOrigin/auth/callback?next=/professionals/register",
  "$stagingWwwOrigin/auth/callback?next=%2Fprofessionals%2Fregister",
  "$tailscaleOrigin/auth/callback",
  "$tailscaleOrigin/auth/callback?next=/auth/update-password",
  "$tailscaleOrigin/auth/callback?next=/dashboard",
  "$tailscaleOrigin/auth/callback?next=/professionals/register",
  "$tailscaleOrigin/auth/callback?next=%2Fprofessionals%2Fregister"
) -join ","

$tempEnv = Join-Path ([System.IO.Path]::GetTempPath()) ("minaret-consent-auth-" + [guid]::NewGuid().ToString("N") + ".env")
$authEnv = @(
  "GOTRUE_API_HOST=0.0.0.0",
  "GOTRUE_API_PORT=9999",
  "API_EXTERNAL_URL=$publicOrigin/auth/v1",
  "GOTRUE_SITE_URL=$publicOrigin",
  "GOTRUE_URI_ALLOW_LIST=$allowList",
  "GOTRUE_DB_DRIVER=postgres",
  "GOTRUE_DB_DATABASE_URL=postgres://supabase_auth_admin:postgres@supabase_db_minaret-experiment:5432/postgres?search_path=auth",
  "GOTRUE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long",
  "GOTRUE_JWT_EXP=3600",
  "GOTRUE_JWT_AUD=authenticated",
  "GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated",
  "GOTRUE_JWT_ADMIN_GROUP_NAME=service_role",
  "GOTRUE_DISABLE_SIGNUP=false",
  "GOTRUE_EXTERNAL_EMAIL_ENABLED=true",
  "GOTRUE_MAILER_AUTOCONFIRM=false",
  "GOTRUE_SMS_AUTOCONFIRM=false",
  "GOTRUE_LOG_LEVEL=info",
  "GOTRUE_OPERATOR_TOKEN=super-secret-operator-token",
  "GOTRUE_RATE_LIMIT_HEADER=X-Forwarded-For",
  "GOTRUE_MAILER_EXTERNAL_HOSTS=am5.tail033f8c.ts.net",
  "GOTRUE_EXTERNAL_GOOGLE_ENABLED=true",
  "GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=$clientId",
  "GOTRUE_EXTERNAL_GOOGLE_SECRET=$googleSecret",
  "GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI=$publicOrigin/auth/v1/callback",
  "GOTRUE_EXTERNAL_GOOGLE_SKIP_NONCE_CHECK=false",
  "GOTRUE_EXTERNAL_GOOGLE_EMAIL_OPTIONAL=false"
)

try {
  [System.IO.File]::WriteAllLines($tempEnv, $authEnv, [System.Text.UTF8Encoding]::new($false))

  docker rm -f supabase_auth_minaret-experiment 2>$null | Out-Null
  docker create `
    --name supabase_auth_minaret-experiment `
    --network supabase_network_minaret-experiment `
    --network-alias auth `
    --restart unless-stopped `
    --label com.docker.compose.project=minaret-experiment `
    --label com.supabase.cli.project=minaret-experiment `
    --label "com.supabase.cli.workdir=$workspace" `
    --env-file $tempEnv `
    public.ecr.aws/supabase/gotrue:v2.194.0 | Out-Null

  docker start supabase_auth_minaret-experiment | Out-Null
}
finally {
  if (Test-Path -LiteralPath $tempEnv) {
    Remove-Item -LiteralPath $tempEnv -Force
  }
}

Start-Sleep -Seconds 3
$auth = docker ps --format "{{.Names}} {{.Status}}" |
  Select-String -Pattern "supabase_auth_minaret-experiment" |
  Select-Object -First 1
if (-not $auth) {
  docker logs --tail 60 supabase_auth_minaret-experiment
  throw "The local Supabase Auth container did not stay running."
}

Write-Host "Local Supabase Auth is running with consent.minaretnetwork.ca as the public auth origin."
