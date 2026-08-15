[CmdletBinding()]
param(
  [ValidateSet("production")]
  [string]$Environment = "production"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$workspace = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$envPath = Join-Path $workspace ".env.$Environment.local"
$endpoint = "http://127.0.0.1:3220/api/cron/expire-sponsorships"

function Get-DotEnvValue {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [Parameter(Mandatory = $true)]
    [string]$Key
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    return $null
  }

  foreach ($line in [System.IO.File]::ReadAllLines($Path)) {
    if ($line -match "^\s*$Key\s*=(.*)$") {
      $rawValue = $matches[1].Trim()
      if ($rawValue.Length -ge 2) {
        $first = $rawValue.Substring(0, 1)
        $last = $rawValue.Substring($rawValue.Length - 1, 1)
        if (($first -eq '"' -and $last -eq '"') -or ($first -eq "'" -and $last -eq "'")) {
          return $rawValue.Substring(1, $rawValue.Length - 2)
        }
      }
      return $rawValue
    }
  }

  return $null
}

$secret = Get-DotEnvValue -Path $envPath -Key "CRON_SECRET"
if ([string]::IsNullOrWhiteSpace($secret)) {
  throw "CRON_SECRET is missing from $envPath."
}

$response = Invoke-WebRequest -Uri $endpoint -Headers @{ Authorization = "Bearer $secret" } -UseBasicParsing -TimeoutSec 30
if ($response.StatusCode -ne 200) {
  throw "Expiry endpoint returned HTTP $($response.StatusCode)."
}
