# Complete Guide: Automatic MySQL Database Backup in Laravel

## Overview
This guide will help you set up a fully automatic MySQL database backup system in Laravel that runs at 11:50 PM every day without any user interaction.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1: Custom Laravel Command](#step-1-custom-laravel-command)
3. [Step 2: Create Backup Folder](#step-2-create-backup-folder)
4. [Step 3: Schedule the Command](#step-3-schedule-the-command)
5. [Step 4: Windows Task Scheduler Setup](#step-4-windows-task-scheduler-setup)
6. [Step 5: Testing](#step-5-testing)
7. [How It Works - Complete Explanation](#how-it-works---complete-explanation)

---

## Prerequisites

- Laravel application installed
- MySQL database configured
- `mysqldump` utility available (comes with MySQL installation)
- Windows operating system (for Task Scheduler setup)

**Verify mysqldump is available:**
```bash
mysqldump --version
```

If not found, add MySQL bin directory to your system PATH:
- Usually located at: `C:\Program Files\MySQL\MySQL Server X.X\bin`

---

## Step 1: Custom Laravel Command

The command already exists at `app/Console/Commands/DailyDatabaseBackup.php`. Here's what it does:

### Command Features:
- ✅ Exports full MySQL database to `.sql` file
- ✅ Creates backup folder automatically if it doesn't exist
- ✅ Uses `mysqldump` for reliable backups
- ✅ Includes routines and triggers
- ✅ Logs backup operations to audit logs
- ✅ Handles errors gracefully

### Command Location:
```
app/Console/Commands/DailyDatabaseBackup.php
```

### Command Signature:
```bash
php artisan backup:daily-database
```

### What the Command Does:
1. Reads database credentials from `config/database.php`
2. Creates backup directory: `storage/app/backups/`
3. Generates filename: `database_backup_YYYY-MM-DD_HH-MM-SS.sql`
4. Executes `mysqldump` to export the database
5. Verifies backup file was created successfully
6. Logs the operation to audit logs
7. Returns success/failure status

---

## Step 2: Create Backup Folder

The backup folder is **automatically created** by the command, but you can verify it exists:

### Automatic Creation:
The command creates the folder at: `storage/app/backups/`

### Manual Creation (Optional):
If you want to create it manually:

**Via Command Line:**
```bash
mkdir storage\app\backups
```

**Via File Explorer:**
1. Navigate to: `capstone-emr\storage\app\`
2. Create new folder named: `backups`

### Verify Folder Permissions:
The folder should have write permissions. The command sets `0755` permissions automatically.

---

## Step 3: Schedule the Command

### For Laravel 11 (routes/console.php):

**File:** `routes/console.php`

```php
<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule daily database backup at 11:50 PM Philippine Time
Schedule::command('backup:daily-database')
    ->dailyAt('23:50')
    ->timezone('Asia/Manila')
    ->description('Daily automatic database backup at 11:50 PM');
```

### For Laravel 10 and below (app/Console/Kernel.php):

**File:** `app/Console/Kernel.php`

```php
<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Schedule daily database backup at 11:50 PM Philippine Time
        $schedule->command('backup:daily-database')
            ->dailyAt('23:50')
            ->timezone('Asia/Manila')
            ->description('Daily automatic database backup at 11:50 PM');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
```

### Schedule Options Explained:

- `dailyAt('23:50')` - Runs at 11:50 PM every day
- `timezone('Asia/Manila')` - Uses Philippine Time
- `description()` - Human-readable description

**Other Schedule Options:**
```php
// Every hour at minute 50
->hourlyAt(50)

// Every day at specific time
->dailyAt('23:50')

// Every week on Monday at 11:50 PM
->weeklyOn(1, '23:50')

// Every month on the 1st at 11:50 PM
->monthlyOn(1, '23:50')
```

---

## Step 4: Windows Task Scheduler Setup

Laravel's scheduler needs to run every minute to check for scheduled tasks. Here's how to set it up on Windows:

### Method 1: Using Windows Task Scheduler (Recommended)

#### Step 4.1: Open Task Scheduler
1. Press `Win + R`
2. Type: `taskschd.msc`
3. Press Enter

#### Step 4.2: Create Basic Task
1. Click **"Create Basic Task"** in the right panel
2. **Name:** `Laravel Scheduler`
3. **Description:** `Runs Laravel scheduler every minute to execute scheduled tasks`
4. Click **Next**

#### Step 4.3: Set Trigger
1. **Trigger:** `Daily`
2. Click **Next**
3. **Start date:** Today's date
4. **Start time:** Any time (e.g., 12:00 AM)
5. **Recur every:** `1 days`
6. Click **Next**

#### Step 4.4: Set Action
1. **Action:** `Start a program`
2. Click **Next**
3. **Program/script:** 
   ```
   C:\php\php.exe
   ```
   (Replace with your PHP path - find it with: `where php` in command prompt)
4. **Add arguments:**
   ```
   artisan schedule:run
   ```
5. **Start in:**
   ```
   C:\Capstone\capstone-emr
   ```
   (Replace with your project path)
6. Click **Next**

#### Step 4.5: Finish
1. Check **"Open the Properties dialog for this task when I click Finish"**
2. Click **Finish**

#### Step 4.6: Advanced Settings
1. In the Properties window, go to **Triggers** tab
2. Select the trigger and click **Edit**
3. Check **"Repeat task every:"**
4. Set to: `1 minute`
5. Set **"for a duration of:"** to `Indefinitely`
6. Click **OK**
7. Go to **Settings** tab
8. Check **"Allow task to be run on demand"**
9. Check **"Run task as soon as possible after a scheduled start is missed"**
10. Check **"If the task fails, restart every:"** and set to `1 minute`
11. Click **OK**

### Method 2: Using Command Line (Alternative)

**Create Task via Command Prompt (Run as Administrator):**

```cmd
schtasks /create /tn "Laravel Scheduler" /tr "C:\php\php.exe artisan schedule:run" /sc minute /mo 1 /ru SYSTEM /f /rl HIGHEST
```

**Replace:**
- `C:\php\php.exe` with your PHP path
- Add `/d` parameter with your project directory

### Method 3: Using the Provided Batch Script

**File:** `backup-service.bat`

Simply double-click `backup-service.bat` or `start-backup-service.bat` to run the scheduler continuously.

**To run on Windows startup:**
1. Create a shortcut to `start-backup-service.bat`
2. Press `Win + R`, type `shell:startup`
3. Copy the shortcut to the Startup folder

---

## Step 5: Testing

### Test 1: Manual Command Execution

Run the command manually to verify it works:

```bash
php artisan backup:daily-database
```

**Expected Output:**
```
Starting daily database backup...
Daily database backup completed successfully!
Backup file: database_backup_2025-01-15_23-50-00.sql
Size: 2.5 MB
```

**Check Backup File:**
```bash
dir storage\app\backups
```

### Test 2: Verify Scheduler

Check if the scheduler can see your scheduled task:

```bash
php artisan schedule:list
```

**Expected Output:**
```
0 23 * * *  php artisan backup:daily-database ... Next Due: 2025-01-15 23:50:00
```

### Test 3: Run Scheduler Manually

Test the scheduler execution:

```bash
php artisan schedule:run
```

This will execute any scheduled tasks that are due.

### Test 4: Verify Task Scheduler

1. Open Task Scheduler
2. Find "Laravel Scheduler" task
3. Right-click → **Run**
4. Check the **History** tab for execution logs
5. Verify backup file was created

---

## How It Works - Complete Explanation

### The Complete Flow:

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTOMATIC BACKUP FLOW                      │
└─────────────────────────────────────────────────────────────┘

1. WINDOWS TASK SCHEDULER (Every Minute)
   │
   ├─> Runs: php artisan schedule:run
   │
   └─> Laravel checks scheduled tasks

2. LARAVEL SCHEDULER (routes/console.php)
   │
   ├─> Checks: Is it 11:50 PM?
   │
   ├─> YES → Executes: backup:daily-database command
   │
   └─> NO → Waits for next check

3. BACKUP COMMAND (DailyDatabaseBackup.php)
   │
   ├─> Reads database config from config/database.php
   │
   ├─> Creates backup directory: storage/app/backups/
   │
   ├─> Generates filename: database_backup_YYYY-MM-DD_HH-MM-SS.sql
   │
   ├─> Executes mysqldump command:
   │   mysqldump --host=localhost --user=root --password=*** 
   │            --single-transaction --routines --triggers 
   │            database_name > backup_file.sql
   │
   ├─> Verifies backup file was created
   │
   ├─> Logs to audit_logs table
   │
   └─> Returns success/failure

4. BACKUP FILE CREATED
   │
   └─> Location: storage/app/backups/database_backup_*.sql
```

### Detailed Step-by-Step Process:

#### **Step 1: Task Scheduler Activation (Every Minute)**
- Windows Task Scheduler runs every minute
- Executes: `php artisan schedule:run`
- This command checks all scheduled tasks in `routes/console.php`

#### **Step 2: Schedule Check (11:50 PM Detection)**
- Laravel scheduler reads `routes/console.php`
- Finds: `Schedule::command('backup:daily-database')->dailyAt('23:50')`
- Compares current time (Philippine Time) with 11:50 PM
- If time matches → Executes the command
- If time doesn't match → Skips and waits

#### **Step 3: Command Execution**
- Laravel calls `DailyDatabaseBackup::handle()`
- Command reads database configuration:
  ```php
  $dbConfig = config('database.connections.mysql');
  // Gets: host, database, username, password, port
  ```

#### **Step 4: Backup Directory Creation**
- Checks if `storage/app/backups/` exists
- If not, creates it with permissions `0755`
- Ensures directory is writable

#### **Step 5: Filename Generation**
- Creates unique filename with timestamp:
  ```php
  $timestamp = Carbon::now()->format('Y-m-d_H-i-s');
  $filename = "database_backup_{$timestamp}.sql";
  // Example: database_backup_2025-01-15_23-50-00.sql
  ```

#### **Step 6: MySQL Dump Execution**
- Builds `mysqldump` command:
  ```bash
  mysqldump --host=localhost --port=3306 
           --user=root --password=secret 
           --single-transaction 
           --routines --triggers 
           database_name > storage/app/backups/database_backup_*.sql
  ```
- `--single-transaction`: Ensures consistent backup
- `--routines`: Includes stored procedures
- `--triggers`: Includes database triggers
- Executes command via `exec()`

#### **Step 7: Verification**
- Checks if file exists
- Verifies file size > 0
- Returns success/failure

#### **Step 8: Audit Logging**
- Logs to `audit_logs` table:
  - Action: `daily-automatic-backup`
  - Description: Success or failure message
  - Metadata: Filename, size, type

#### **Step 9: Completion**
- Command returns exit code (0 = success, 1 = failure)
- Task Scheduler logs the execution
- Backup file is ready for use

### Time Zone Handling:

- All times use **Asia/Manila** (Philippine Time)
- Laravel converts server time to specified timezone
- Backup runs at 11:50 PM Philippine Time regardless of server timezone

### Error Handling:

1. **mysqldump not found:**
   - Error logged to audit_logs
   - Command returns failure status

2. **Database connection failed:**
   - Error logged
   - Backup skipped

3. **Disk space full:**
   - Error logged
   - Backup fails gracefully

4. **Permission denied:**
   - Error logged
   - Check folder permissions

### Backup File Management:

- Files are stored in: `storage/app/backups/`
- Each backup is a complete SQL dump
- Files can be restored using:
  ```bash
  mysql -u root -p database_name < backup_file.sql
  ```

### Monitoring:

**Check Recent Backups:**
```bash
dir storage\app\backups /O-D
```

**View Audit Logs:**
- Go to Audit Logs page in your application
- Filter by Action: `daily-automatic-backup`

**Check Task Scheduler History:**
1. Open Task Scheduler
2. Find "Laravel Scheduler"
3. Click "History" tab

---

## Troubleshooting

### Backup Not Running?

1. **Check Task Scheduler:**
   - Verify "Laravel Scheduler" task exists
   - Check if it's enabled
   - View History for errors

2. **Test Command Manually:**
   ```bash
   php artisan backup:daily-database
   ```

3. **Check Scheduler:**
   ```bash
   php artisan schedule:list
   ```

4. **Verify PHP Path:**
   ```bash
   where php
   ```

5. **Check Logs:**
   - `storage/logs/laravel.log`
   - Audit Logs in application

### Common Issues:

**Issue:** "mysqldump: command not found"
- **Solution:** Add MySQL bin directory to PATH

**Issue:** "Permission denied"
- **Solution:** Check folder permissions on `storage/app/backups/`

**Issue:** "Backup file is empty"
- **Solution:** Check database credentials in `.env`

**Issue:** "Task Scheduler not running"
- **Solution:** Verify task is enabled and user has permissions

---

## Summary

✅ **Command:** `app/Console/Commands/DailyDatabaseBackup.php`  
✅ **Schedule:** `routes/console.php` (Laravel 11) or `app/Console/Kernel.php` (Laravel 10)  
✅ **Backup Location:** `storage/app/backups/`  
✅ **Schedule Time:** 11:50 PM Philippine Time  
✅ **Task Scheduler:** Runs `php artisan schedule:run` every minute  
✅ **Fully Automatic:** No user interaction required  

The system will automatically:
1. Check every minute if it's 11:50 PM
2. Execute the backup command
3. Create SQL backup file
4. Log the operation
5. Continue running daily

---

## Quick Reference Commands

```bash
# Test backup manually
php artisan backup:daily-database

# List scheduled tasks
php artisan schedule:list

# Run scheduler manually
php artisan schedule:run

# Check backup files
dir storage\app\backups

# View Laravel logs
type storage\logs\laravel.log
```

---

**Setup Complete!** Your automatic MySQL backup system is now configured and will run every day at 11:50 PM without any user interaction.

