# Automatic Backup Service for Windows PowerShell
# This script runs continuously and checks for backups every minute
# Run this script to ensure automatic backups work without cron

Write-Host "Starting Automatic Backup Service..." -ForegroundColor Green
Write-Host "This service will check for backups every minute" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Get the script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

while ($true) {
    try {
        # Run Laravel scheduler (checks all scheduled tasks including backups)
        & php artisan schedule:run
        
        # Wait 60 seconds before next check
        Start-Sleep -Seconds 60
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor Red
        Start-Sleep -Seconds 60
    }
}

