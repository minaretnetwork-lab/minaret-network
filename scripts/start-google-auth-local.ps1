[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $workspace ".env.local"
if (-not (Test-Path -LiteralPath $envPath)) {
  throw ".env.local was not found."
}

$envMap = @{}
foreach ($line in Get-Content -LiteralPath $envPath) {
  if ($line -match '^\s*#' -or $line -notmatch '=') {
    continue
  }
  $idx = $line.IndexOf("=")
  $key = $line.Substring(0, $idx).Trim()
  $value = $line.Substring($idx + 1).Trim().Trim('"').Trim("'")
  if ($key) {
    $envMap[$key] = $value
  }
}

$googleSecret = $envMap["SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET"]
if ([string]::IsNullOrWhiteSpace($googleSecret)) {
  throw "SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET is missing from .env.local."
}

$clientId = "1030105890262-70tati9hevbb4l3s0pv70oeq8l9ng1fr.apps.googleusercontent.com"
$publicOrigin = "https://minaretnetwork.ca"
$tailscaleOrigin = "https://am5.tail033f8c.ts.net:8443"
$allowList = @(
  "http://127.0.0.1:3220/auth/callback",
  "http://127.0.0.1:3220/auth/callback?next=/auth/update-password",
  "http://localhost:3220/auth/callback",
  "http://localhost:3220/auth/callback?next=/auth/update-password",
  "$publicOrigin/auth/callback",
  "$publicOrigin/auth/callback?next=/auth/update-password",
  "$publicOrigin/auth/callback?next=/dashboard",
  "https://www.minaretnetwork.ca/auth/callback",
  "https://www.minaretnetwork.ca/auth/callback?next=/auth/update-password",
  "https://www.minaretnetwork.ca/auth/callback?next=/dashboard",
  "$tailscaleOrigin/auth/callback",
  "$tailscaleOrigin/auth/callback?next=/auth/update-password",
  "$tailscaleOrigin/auth/callback?next=/dashboard"
) -join ","

$tempEnv = Join-Path ([System.IO.Path]::GetTempPath()) ("minaret-auth-" + [guid]::NewGuid().ToString("N") + ".env")
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
  docker logs --tail 40 supabase_auth_minaret-experiment
  throw "The local Supabase Auth container did not stay running."
}

Write-Host "Local Supabase Auth is running with Google enabled."
