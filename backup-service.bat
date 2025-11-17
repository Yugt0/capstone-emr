@echo off
REM Automatic Backup Service for Windows
REM This script runs continuously and checks for backups every minute
REM Run this script to ensure automatic backups work without cron

echo Starting Automatic Backup Service...
echo This service will check for backups every minute
echo Press Ctrl+C to stop

:loop
REM Check if it's time for backup (runs schedule:run which checks all scheduled tasks)
cd /d "%~dp0"
php artisan schedule:run

REM Wait 60 seconds before next check
timeout /t 60 /nobreak >nul

goto loop

