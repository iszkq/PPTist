[CmdletBinding()]
param(
  [string]$Source = (Join-Path $PSScriptRoot '..\publish\win-x64'),
  [string]$SourceX86 = (Join-Path $PSScriptRoot '..\publish\win-x86'),
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
if (-not (Test-Path (Join-Path $Source 'PPTist.HostAddin.comhost.dll'))) {
  throw ('Office/WPS add-in was not found: ' + $Source + '. Run Build-PPTistPlugin.ps1 first.')
}
if (-not (Test-Path (Join-Path $SourceX86 'PPTist.HostAddin.comhost.dll'))) {
  throw ('32-bit Office/WPS add-in was not found: ' + $SourceX86 + '. Run Build-PPTistPlugin.ps1 first.')
}

New-Item -ItemType Directory -Force $runtimeRoot, $configRoot | Out-Null
Copy-Item -Path (Join-Path $Source '*') -Destination $runtimeRoot -Recurse -Force
Copy-Item -Path (Join-Path $SourceX86 '*') -Destination (Join-Path $runtimeRoot 'addin-x86') -Recurse -Force

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

# Register the common COM add-in per user. This is intentionally not a machine
# registration, so it needs no administrator permission and works for every
# presentation opened by the current Windows user.
$progId = 'PPTist.HostAddin'
$clsid = '{E5707554-F46A-4F29-A918-5FEAD9A8F136}'
function Register-PptistComAddin([string]$classRoot, [string]$comHost) {
  $clsidRoot = Join-Path $classRoot ('CLSID\' + $clsid)
  $inprocRoot = Join-Path $clsidRoot 'InprocServer32'
  New-Item -ItemType Directory -Force $inprocRoot | Out-Null
  Set-Item -Path $inprocRoot -Value $comHost
  New-ItemProperty -Path $inprocRoot -Name 'ThreadingModel' -PropertyType String -Value 'Both' -Force | Out-Null
  $progRoot = Join-Path $classRoot $progId
  New-Item -ItemType Directory -Force (Join-Path $progRoot 'CLSID') | Out-Null
  Set-Item -Path $progRoot -Value 'PPTist HTML animation add-in'
  Set-Item -Path (Join-Path $progRoot 'CLSID') -Value $clsid
}
Register-PptistComAddin 'HKCU:\Software\Classes' (Join-Path $runtimeRoot 'PPTist.HostAddin.comhost.dll')
if ([Environment]::Is64BitOperatingSystem) {
  Register-PptistComAddin 'HKCU:\Software\Classes\Wow6432Node' (Join-Path $runtimeRoot 'addin-x86\PPTist.HostAddin.comhost.dll')
}

if (Test-OfficePowerPoint) {
  $officeAddin = 'HKCU:\Software\Microsoft\Office\PowerPoint\Addins\' + $progId
  New-Item -ItemType Directory -Force $officeAddin | Out-Null
  New-ItemProperty -Path $officeAddin -Name 'FriendlyName' -PropertyType String -Value 'PPTist HTML 动效' -Force | Out-Null
  New-ItemProperty -Path $officeAddin -Name 'Description' -PropertyType String -Value '在当前演示页插入和编辑 HTML 动效' -Force | Out-Null
  New-ItemProperty -Path $officeAddin -Name 'LoadBehavior' -PropertyType DWord -Value 3 -Force | Out-Null
  if ([Environment]::Is64BitOperatingSystem) {
    $officeAddin32 = 'HKCU:\Software\Wow6432Node\Microsoft\Office\PowerPoint\Addins\' + $progId
    New-Item -ItemType Directory -Force $officeAddin32 | Out-Null
    New-ItemProperty -Path $officeAddin32 -Name 'FriendlyName' -PropertyType String -Value 'PPTist HTML 动效' -Force | Out-Null
    New-ItemProperty -Path $officeAddin32 -Name 'Description' -PropertyType String -Value '在当前演示页插入和编辑 HTML 动效' -Force | Out-Null
    New-ItemProperty -Path $officeAddin32 -Name 'LoadBehavior' -PropertyType DWord -Value 3 -Force | Out-Null
  }
}

Write-Host ('PPTist overlay installed to: ' + $installRoot)
Write-Host ('PowerPoint detected: ' + $hosts.office.detected)
Write-Host ('WPS detected: ' + $hosts.wps.detected)
Write-Host 'Health endpoint: http://127.0.0.1:32147/health'

if ($StartNow) { Start-Process -FilePath $exe -WindowStyle Hidden }
