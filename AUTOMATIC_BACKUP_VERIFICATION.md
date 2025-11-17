# Automatic Backup Verification Guide

## How to Verify Automatic Backups Are Working

### 1. **Check the Backup System Dashboard (Easiest Method)**

1. Open the **Backup System** page in your EMR application
2. Go to the **Dashboard** tab
3. Look for the **"Automatic Backup Status"** card which shows:
   - **Last Automatic Backup**: Date and time of the last successful automatic backup
   - **Total Automatic Backups**: Count of all successful automatic backups
   - **Success Rate**: Percentage of successful backups
   - **Last Failed Backup**: If any backup failed, it will show here

### 2. **Check Audit Logs**

Automatic backups are logged in the Audit Log system:

1. Go to **Audit Logs** page
2. Filter by:
   - **Action**: `daily-automatic-backup`
   - **Model**: `Database`
3. Look for entries with:
   - ✅ **Success**: "Daily automatic database backup completed successfully"
   - ❌ **Failure**: "Daily automatic database backup failed" or "exception"

### 3. **Check Backup Files**

Automatic backups are saved in: `storage/app/backups/`

**Via Terminal:**
```bash
# List all backup files
ls -lh storage/app/backups/

# Count automatic backups (files created at 7 AM)
ls storage/app/backups/database_backup_*.sql | wc -l
```

**Via File Manager:**
- Navigate to: `capstone-emr/storage/app/backups/`
- Look for files named: `database_backup_YYYY-MM-DD_07-XX-XX.sql`
- Files created at 7:00 AM are automatic backups

### 4. **Check Laravel Schedule**

**View scheduled tasks:**
```bash
php artisan schedule:list
```

You should see:
```
0 7 * * *  php artisan backup:daily-database ... Next Due: [time]
```

**Test the command manually:**
```bash
php artisan backup:daily-database
```

This will create a backup immediately and show:
- ✅ "Daily database backup completed successfully!"
- Backup file name and size

### 5. **Check Laravel Logs**

Automatic backup operations are logged in: `storage/logs/laravel.log`

**View recent backup logs:**
```bash
# Linux/Mac
tail -f storage/logs/laravel.log | grep "backup"

# Windows PowerShell
Get-Content storage/logs/laravel.log -Tail 100 | Select-String "backup"
```

### 6. **Verify Cron Job is Running**

**Important:** For automatic backups to work, the Laravel scheduler must be running.

**Check if cron is set up:**
```bash
crontab -l
```

You should see:
```
* * * * * cd /path-to-project/capstone-emr && php artisan schedule:run >> /dev/null 2>&1
```

**If not set up, add it:**
```bash
crontab -e
```

Then add:
```
* * * * * cd /path-to-your-project/capstone-emr && php artisan schedule:run >> /dev/null 2>&1
```

### 7. **Database Query (Advanced)**

Check audit_logs table directly:

```sql
-- Get last 10 automatic backups
SELECT 
    created_at,
    description,
    new_values
FROM audit_logs
WHERE action = 'daily-automatic-backup'
ORDER BY created_at DESC
LIMIT 10;

-- Count successful vs failed
SELECT 
    CASE 
        WHEN description LIKE '%completed successfully%' THEN 'Success'
        ELSE 'Failed'
    END as status,
    COUNT(*) as count
FROM audit_logs
WHERE action = 'daily-automatic-backup'
GROUP BY status;
```

## Expected Behavior

### ✅ **Working Correctly:**
- Backup runs every day at 7:00 AM Philippine Time
- New backup file appears in `storage/app/backups/`
- Audit log entry created with "completed successfully"
- Dashboard shows increasing "Total Automatic Backups" count
- Success rate is 95% or higher

### ❌ **Not Working:**
- No backup files created at 7 AM
- No audit log entries for `daily-automatic-backup`
- Dashboard shows "Never" for last automatic backup
- Cron job not running or not configured

## Troubleshooting

### If backups aren't running automatically:

1. **Check cron job:**
   ```bash
   crontab -l
   ```

2. **Test the command manually:**
   ```bash
   php artisan backup:daily-database
   ```

3. **Check schedule:**
   ```bash
   php artisan schedule:list
   ```

4. **Check Laravel logs:**
   ```bash
   tail -f storage/logs/laravel.log
   ```

5. **Verify timezone:**
   - Schedule is set to `Asia/Manila` (Philippine Time)
   - Server timezone should match or be correctly converted

## Quick Verification Checklist

- [ ] Schedule is registered: `php artisan schedule:list` shows the backup task
- [ ] Command works: `php artisan backup:daily-database` creates a backup
- [ ] Dashboard shows automatic backup status
- [ ] Audit logs contain `daily-automatic-backup` entries
- [ ] Backup files exist in `storage/app/backups/`
- [ ] Cron job is configured and running

## Support

If automatic backups are not working:
1. Check the troubleshooting section above
2. Review Laravel logs for errors
3. Verify database connection is working
4. Ensure mysqldump is installed and accessible
5. Check file permissions on `storage/app/backups/` directory


