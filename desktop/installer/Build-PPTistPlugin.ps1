[CmdletBinding()]
param(
  [switch]$Install,
  [switch]$StartNow
)

$ErrorActionPreference = 'Stop'
$project = Join-Path $PSScriptRoot '..\src\PPTist.Overlay\PPTist.Overlay.csproj'
$publishRoot = Join-Path $PSScriptRoot '..\publish\win-x64'
$dotnet = (Get-Command dotnet -ErrorAction SilentlyContinue).Source

if (-not $dotnet) {
  throw '.NET SDK 8 was not found. Install the SDK or use a GitHub Release package.'
}

& $dotnet publish $project -c Release -r win-x64 --self-contained true -p:PublishSingleFile=false -o $publishRoot
if ($LASTEXITCODE -ne 0) { throw 'Overlay runtime build failed.' }

Write-Host ('Installer files created at: ' + $publishRoot)
if ($Install) {
  & (Join-Path $PSScriptRoot 'Install-PPTistPlugin.ps1') -Source $publishRoot -StartNow:$StartNow
}
