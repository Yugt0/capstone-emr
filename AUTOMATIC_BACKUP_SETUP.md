# Automatic Backup System - Setup Guide

## How It Works

The automatic backup system now works **completely automatically** without any user interaction required. Here's how:

### 1. **Automatic Middleware Check** (Primary Method)
   - A middleware (`AutomaticBackupCheck`) runs on every API request
   - It intelligently checks for backups:
     - Every 5 minutes (time-based check)
     - OR on 10% of random requests (to ensure frequent checks when app is active)
   - If it's after 7:00 AM and no backup has run today, it automatically triggers the backup
   - **No user interaction needed** - backups happen automatically as long as the application is being used

### 2. **Background Service Script** (Optional - For Idle Systems)
   - If your system might be idle for long periods, you can run the background service
   - **Windows**: Run `start-backup-service.bat` or `backup-service.bat`
   - **PowerShell**: Run `backup-service.ps1`
   - This ensures backups run even when no one is using the application

### 3. **Laravel Scheduler** (Traditional Method - Optional)
   - If you have cron/Task Scheduler configured, it will also work
   - Runs at 7:00 AM Philippine Time daily

## Setup Instructions

### Automatic (No Setup Required!)
The system works automatically out of the box. As long as:
- The application is running
- Users are making API requests (which happens naturally when using the app)
- It's after 7:00 AM Philippine Time

Backups will run automatically without any configuration!

### Optional: Background Service (For Idle Systems)

If you want to ensure backups run even when the application is completely idle:

**Windows:**
1. Double-click `start-backup-service.bat` in the project root
2. A new window will open running the backup service
3. Keep this window open (or minimize it)
4. The service will check for backups every minute

**To run on startup:**
1. Create a shortcut to `start-backup-service.bat`
2. Place it in Windows Startup folder: `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`

**PowerShell (Alternative):**
```powershell
.\backup-service.ps1
```

## How to Verify It's Working

1. **Check the Backup Dashboard:**
   - Go to Backup System → Dashboard
   - Look at "Automatic Backup Status"
   - You should see the last automatic backup date/time

2. **Check Audit Logs:**
   - Go to Audit Logs
   - Filter by Action: `daily-automatic-backup`
   - You should see entries for successful backups

3. **Check Backup Files:**
   - Navigate to `storage/app/backups/`
   - You should see files named `database_backup_YYYY-MM-DD_07-XX-XX.sql`

## Troubleshooting

### Backups Not Running?

1. **Check if it's after 7:00 AM:**
   - Backups only run after 7:00 AM Philippine Time
   - Use the "Run Now" button to test manually

2. **Check Application Activity:**
   - The middleware requires API requests to trigger
   - If the app is completely idle, use the background service

3. **Check Logs:**
   - Check `storage/logs/laravel.log` for backup-related errors

4. **Run Background Service:**
   - If the app might be idle, run `start-backup-service.bat`

### Manual Testing

To test if backups work:
1. Go to Backup System → Dashboard
2. Click "Run Now" button (this triggers an automatic backup immediately)
3. Wait a few seconds and refresh the page
4. Check if the backup appears in the list

## Technical Details

- **Backup Time:** 7:00 AM Philippine Time (Asia/Manila timezone)
- **Check Frequency:** Every 5 minutes OR 10% of API requests
- **Backup Location:** `storage/app/backups/`
- **Backup Format:** SQL dump files
- **Logging:** All backup operations are logged in audit_logs table

## Notes

- The system is designed to run backups **automatically** without any user interaction
- As long as the application is being used (which generates API requests), backups will be checked and triggered automatically
- The middleware approach ensures backups work even without cron/Task Scheduler configured
- Multiple methods work together to ensure reliability

