[CmdletBinding()]
param([switch]$Install, [switch]$StartNow)

$ErrorActionPreference = 'Stop'
$dotnet = 'C:\Users\Administrator\Documents\Codex\2026-08-06\you\work\.dotnet-sdk\dotnet.exe'
if (-not (Test-Path $dotnet)) { $dotnet = (Get-Command dotnet -ErrorAction SilentlyContinue).Source }
if (-not $dotnet) { throw '.NET SDK 8 was not found.' }
$desktopRoot = Join-Path $PSScriptRoot '..'
$repoRoot = (Resolve-Path (Join-Path $desktopRoot '..')).Path
$overlayProject = Join-Path $desktopRoot 'src\PPTist.Overlay\PPTist.Overlay.csproj'
$publishRoot = Join-Path $desktopRoot 'publish\win-x64'
& $dotnet publish $overlayProject -c Release -r win-x64 --self-contained false -p:PublishSingleFile=false -o $publishRoot
if ($LASTEXITCODE -ne 0) { throw 'Overlay runtime build failed.' }
if ($Install) {
  & (Join-Path $PSScriptRoot 'Install-PPTistPlugin.ps1') -Source $publishRoot -StartNow:$StartNow
  if ($LASTEXITCODE -ne 0) { throw 'PPTist companion install failed.' }
}
Write-Host "Overlay build ready: $publishRoot"
