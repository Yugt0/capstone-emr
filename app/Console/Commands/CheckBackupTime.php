<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class CheckBackupTime extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'backup:check-time';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check if it\'s time for automatic backup and trigger it';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            // Set timezone to Philippine Time
            $now = Carbon::now('Asia/Manila');
            
            // Backup time: 11:50 PM
            $backupTime = Carbon::today('Asia/Manila')->setTime(23, 50, 0);
            
            // Check if current time is at or after backup time
            if ($now->lt($backupTime)) {
                return 0; // Too early, backup hasn't been scheduled yet today
            }
            
            // Check if we're within 1 minute window (11:26:00 to 11:26:59)
            $oneMinuteAfter = $backupTime->copy()->addMinute();
            if ($now->gt($oneMinuteAfter)) {
                return 0; // Too late, already past the 1-minute window
            }
            
            // Check if a backup has already run today
            $todayBackup = DB::table('audit_logs')
                ->where('action', 'daily-automatic-backup')
                ->where('description', 'like', '%completed successfully%')
                ->whereDate('created_at', $now->toDateString())
                ->first();
            
            // If backup already ran today, skip
            if ($todayBackup) {
                $this->info('Backup already completed today.');
                return 0;
            }
            
            // Trigger the backup
            $this->info('Backup time reached! Triggering automatic backup...');
            Log::info('Automatic backup triggered via time check command at ' . $now->format('Y-m-d H:i:s'));
            
            Artisan::call('backup:daily-database');
            
            $this->info('Backup command executed.');
            return 0;
            
        } catch (\Exception $e) {
            $this->error('Failed to check/trigger backup: ' . $e->getMessage());
            Log::error('Failed to check/trigger backup in CheckBackupTime command: ' . $e->getMessage());
            return 1;
        }
    }
}

