[CmdletBinding()]
param(
  [string]$Source = (Join-Path $PSScriptRoot '..\publish\win-x64'),
  [switch]$StartNow
)

$ErrorActionPreference = 'Stop'
$installRoot = Join-Path $env:LOCALAPPDATA 'PPTistPlugin'
$runtimeRoot = Join-Path $installRoot 'runtime'
$manifestSource = Join-Path $PSScriptRoot '..\..\office-addin'
if (-not (Test-Path (Join-Path $Source 'PPTist.Overlay.exe'))) { throw "Overlay runtime was not found: $Source" }
if (-not (Test-Path (Join-Path $manifestSource 'manifest.xml'))) { throw "Office Add-in manifest was not found: $manifestSource" }
New-Item -ItemType Directory -Force $runtimeRoot, (Join-Path $installRoot 'office-addin') | Out-Null
Copy-Item -Path (Join-Path $Source '*') -Destination $runtimeRoot -Recurse -Force
Copy-Item -Path (Join-Path $manifestSource '*') -Destination (Join-Path $installRoot 'office-addin') -Recurse -Force
$catalog = 'HKCU:\Software\Microsoft\Office\16.0\WEF\TrustedCatalogs\{2c7d5d7a-2664-4b59-b8d1-37c2cfecf43a}'
New-Item -Path $catalog -Force | Out-Null
New-ItemProperty -Path $catalog -Name Id -Value '{2c7d5d7a-2664-4b59-b8d1-37c2cfecf43a}' -PropertyType String -Force | Out-Null
New-ItemProperty -Path $catalog -Name Url -Value (Join-Path $installRoot 'office-addin') -PropertyType String -Force | Out-Null
New-ItemProperty -Path $catalog -Name Flags -Value 1 -PropertyType DWord -Force | Out-Null
$exe = Join-Path $runtimeRoot 'PPTist.Overlay.exe'
New-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name PPTistOverlay -Value ('"' + $exe + '"') -PropertyType String -Force | Out-Null
Write-Host "PPTist PowerPoint companion installed to $installRoot"
Write-Host "In PowerPoint: File -> Get Add-ins -> Manage My Add-ins -> Upload My Add-in, then select $installRoot\office-addin\manifest.xml"
if ($StartNow) { Start-Process -FilePath $exe -WindowStyle Hidden }
