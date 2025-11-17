@echo off
REM Start the backup service in a new window
REM This allows the service to run in the background

start "Automatic Backup Service" cmd /c backup-service.bat

echo Backup service started in a new window.
echo You can close this window - the service will continue running.
echo To stop the service, close the "Automatic Backup Service" window.
pause

