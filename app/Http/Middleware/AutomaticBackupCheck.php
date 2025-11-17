<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class AutomaticBackupCheck
{
    /**
     * Handle an incoming request.
     * Checks if automatic backup needs to run and triggers it in the background.
     */
    public function handle(Request $request, Closure $next)
    {
        // Only check on API requests (not every request to avoid overhead)
        // Check randomly ~10% of requests to reduce load, or every 5 minutes
        $shouldCheck = false;
        
        // Check based on time - if it's been more than 1 minute since last check
        $lastCheckFile = storage_path('app/backup_last_check.txt');
        $lastCheckTime = 0;
        
        if (file_exists($lastCheckFile)) {
            $lastCheckTime = (int) file_get_contents($lastCheckFile);
        }
        
        $currentTime = time();
        $timeSinceLastCheck = $currentTime - $lastCheckTime;
        
        // Check every 1 minute (60 seconds) or on 20% of requests for more frequent checks
        if ($timeSinceLastCheck >= 60 || rand(1, 5) === 1) {
            $shouldCheck = true;
            file_put_contents($lastCheckFile, $currentTime);
        }
        
        if ($shouldCheck) {
            // Run backup check in background to avoid blocking the request
            $this->checkAndTriggerAutomaticBackup();
        }
        
        return $next($request);
    }

    /**
     * Check and trigger automatic backup if needed
     */
    private function checkAndTriggerAutomaticBackup(): void
    {
        try {
            // Set timezone to Philippine Time
            $now = Carbon::now('Asia/Manila');
            
            // Check if it's after 11:50 PM today
            $backupTime = Carbon::today('Asia/Manila')->setTime(23, 50, 0);
            
            // Check if current time is at or after backup time
            if ($now->lt($backupTime)) {
                return; // Too early, backup hasn't been scheduled yet today
            }
            
            // Check if we're within 1 minute window (11:50:00 to 11:50:59)
            $oneMinuteAfter = $backupTime->copy()->addMinute();
            if ($now->gt($oneMinuteAfter)) {
                return; // Too late, already past the 1-minute window
            }
            
            // Check if a backup has already run today
            $todayBackup = DB::table('audit_logs')
                ->where('action', 'daily-automatic-backup')
                ->where('description', 'like', '%completed successfully%')
                ->whereDate('created_at', $now->toDateString())
                ->first();
            
            // If backup already ran today, skip
            if ($todayBackup) {
                return;
            }
            
            // Check if we're within a reasonable time window (11:26 PM to 11:59 PM)
            $endOfDay = Carbon::today('Asia/Manila')->setTime(23, 59, 59);
            
            if ($now->gt($endOfDay)) {
                return; // Past today, don't trigger
            }
            
            // Trigger the backup in the background
            Log::info('Automatic backup triggered via middleware (cron fallback)');
            
            $phpPath = PHP_BINARY;
            $artisanPath = base_path('artisan');
            $command = escapeshellarg($phpPath) . ' ' . escapeshellarg($artisanPath) . ' backup:daily-database';
            
            // Run in background (Windows compatible)
            if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                // Windows: use PowerShell for better compatibility
                $psCommand = "Start-Process -FilePath " . escapeshellarg($phpPath) . " -ArgumentList " . escapeshellarg($artisanPath . ' backup:daily-database') . " -WindowStyle Hidden -NoNewWindow";
                pclose(popen("powershell -Command " . escapeshellarg($psCommand), "r"));
            } else {
                // Linux/Mac: use nohup or & to run in background
                exec($command . " > /dev/null 2>&1 &");
            }
            
        } catch (\Exception $e) {
            // Log error but don't fail the request
            Log::error('Failed to check/trigger automatic backup in middleware: ' . $e->getMessage());
        }
    }
}

