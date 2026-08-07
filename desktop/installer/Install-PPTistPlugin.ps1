[CmdletBinding()]
param(
  [string]$Source = (Join-Path $PSScriptRoot '..\publish\win-x64'),
  [switch]$StartNow
)

$ErrorActionPreference = 'Stop'
$installRoot = Join-Path $env:LOCALAPPDATA 'PPTistPlugin'
$runtimeRoot = Join-Path $installRoot 'runtime'
$configRoot = Join-Path $installRoot 'config'

function Test-OfficePowerPoint {
  $candidates = @(
    'HKLM:\SOFTWARE\Microsoft\Office\ClickToRun\Configuration',
    'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Office\ClickToRun\Configuration'
  )
  foreach ($key in $candidates) {
    if (Test-Path $key) {
      $path = (Get-ItemProperty $key -ErrorAction SilentlyContinue).InstallPath
      if ($path -and (Test-Path (Join-Path $path 'root\Office16\POWERPNT.EXE'))) { return $true }
    }
  }
  return [bool](Get-ChildItem 'HKLM:\SOFTWARE\Microsoft\Office\PowerPoint','HKLM:\SOFTWARE\WOW6432Node\Microsoft\Office\PowerPoint' -ErrorAction SilentlyContinue)
}

function Test-WpsPresentation {
  $keys = @('HKLM:\SOFTWARE\Kingsoft\Office','HKLM:\SOFTWARE\WOW6432Node\Kingsoft\Office','HKCU:\Software\Kingsoft\Office')
  foreach ($key in $keys) { if (Test-Path $key) { return $true } }
  return $false
}

if (-not (Test-Path (Join-Path $Source 'PPTist.Overlay.exe'))) {
  throw ('Overlay runtime was not found: ' + $Source + '. Run Build-PPTistPlugin.ps1 first.')
}

New-Item -ItemType Directory -Force $runtimeRoot, $configRoot | Out-Null
Copy-Item -Path (Join-Path $Source '*') -Destination $runtimeRoot -Recurse -Force

$hosts = [ordered]@{
  installedAt = (Get-Date).ToString('o')
  overlayEndpoint = 'http://127.0.0.1:32147'
  office = [ordered]@{ detected = (Test-OfficePowerPoint); adapter = 'office' }
  wps = [ordered]@{ detected = (Test-WpsPresentation); adapter = 'wps' }
}
$hosts | ConvertTo-Json -Depth 4 | Set-Content -Path (Join-Path $configRoot 'hosts.json') -Encoding UTF8

$exe = Join-Path $runtimeRoot 'PPTist.Overlay.exe'
$command = [string][char]34 + $exe + [char]34
New-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'PPTistOverlay' -Value $command -PropertyType String -Force | Out-Null

Write-Host ('PPTist overlay installed to: ' + $installRoot)
Write-Host ('PowerPoint detected: ' + $hosts.office.detected)
Write-Host ('WPS detected: ' + $hosts.wps.detected)
Write-Host 'Health endpoint: http://127.0.0.1:32147/health'

if ($StartNow) { Start-Process -FilePath $exe -WindowStyle Hidden }
