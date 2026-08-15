[CmdletBinding()]
param(
  [string]$ConfigPath = "$HOME\.cloudflared\config.yml",
  [string]$TunnelId = "a74c8762-57bf-425f-922f-b2f943ef58d3",
  [string]$CredentialsFile = "$HOME\.cloudflared\a74c8762-57bf-425f-922f-b2f943ef58d3.json"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$configDirectory = Split-Path -Parent $ConfigPath
if (-not (Test-Path -LiteralPath $configDirectory)) {
  [System.IO.Directory]::CreateDirectory($configDirectory) | Out-Null
}

$content = @"
tunnel: $TunnelId
credentials-file: $CredentialsFile

ingress:
  - hostname: minaretnetwork.ca
    service: http://127.0.0.1:3220
  - hostname: www.minaretnetwork.ca
    service: http://127.0.0.1:3220
  - hostname: staging.minaretnetwork.ca
    path: /auth/v1.*
    service: http://127.0.0.1:54321
  - hostname: www.staging.minaretnetwork.ca
    path: /auth/v1.*
    service: http://127.0.0.1:54321
  - hostname: staging.minaretnetwork.ca
    path: /storage/v1.*
    service: http://127.0.0.1:54321
  - hostname: www.staging.minaretnetwork.ca
    path: /storage/v1.*
    service: http://127.0.0.1:54321
  - hostname: staging.minaretnetwork.ca
    service: http://127.0.0.1:3220
  - hostname: www.staging.minaretnetwork.ca
    service: http://127.0.0.1:3220
  - hostname: consent.minaretnetwork.ca
    path: /auth/v1.*
    service: http://127.0.0.1:54321
  - hostname: consent.minaretnetwork.ca
    service: http://127.0.0.1:3220
  - service: http_status:404
"@

[System.IO.File]::WriteAllText($ConfigPath, $content, [System.Text.UTF8Encoding]::new($false))
Write-Host "Updated cloudflared config at $ConfigPath"
