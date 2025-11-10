<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;

class EmergencyStorageCleanup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'storage:emergency-cleanup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Emergency storage cleanup - removes all non-essential files to free up space';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚨 EMERGENCY STORAGE CLEANUP STARTING...');
        $this->warn('This will remove ALL backup files and temporary data!');
        
        if (!$this->confirm('Are you sure you want to proceed? This action cannot be undone!')) {
            $this->info('Emergency cleanup cancelled.');
            return 0;
        }
        
        $freedSpace = 0;
        
        try {
            // 1. Remove ALL backup files
            $this->info('🗑️  Removing all backup files...');
            $backupFiles = Storage::disk('local')->files('Laravel');
            foreach ($backupFiles as $file) {
                if (pathinfo($file, PATHINFO_EXTENSION) === 'zip') {
                    $size = Storage::disk('local')->size($file);
                    Storage::disk('local')->delete($file);
                    $freedSpace += $size;
                    $this->line("  Deleted: " . basename($file) . " (" . round($size / 1024 / 1024, 2) . " MB)");
                }
            }
            
            // 2. Clear Laravel caches
            $this->info('🧹 Clearing Laravel caches...');
            Artisan::call('cache:clear');
            Artisan::call('config:clear');
            Artisan::call('route:clear');
            Artisan::call('view:clear');
            
            // 3. Remove log files (keep only last 3 days)
            $this->info('📝 Cleaning log files...');
            $logPath = storage_path('logs');
            if (is_dir($logPath)) {
                $logFiles = glob($logPath . '/*.log');
                foreach ($logFiles as $logFile) {
                    if (filemtime($logFile) < strtotime('-3 days')) {
                        $size = filesize($logFile);
                        unlink($logFile);
                        $freedSpace += $size;
                        $this->line("  Deleted old log: " . basename($logFile));
                    }
                }
            }
            
            // 4. Remove temporary files
            $this->info('🗂️  Cleaning temporary files...');
            $tempDirs = [
                storage_path('app/temp'),
                storage_path('framework/cache'),
                storage_path('framework/sessions'),
                storage_path('framework/views')
            ];
            
            foreach ($tempDirs as $tempDir) {
                if (is_dir($tempDir)) {
                    $files = glob($tempDir . '/*');
                    foreach ($files as $file) {
                        if (is_file($file)) {
                            $size = filesize($file);
                            unlink($file);
                            $freedSpace += $size;
                        }
                    }
                }
            }
            
            // 5. Remove old session files
            $this->info('🔐 Cleaning session files...');
            $sessionPath = storage_path('framework/sessions');
            if (is_dir($sessionPath)) {
                $sessionFiles = glob($sessionPath . '/*');
                foreach ($sessionFiles as $sessionFile) {
                    if (is_file($sessionFile) && filemtime($sessionFile) < strtotime('-1 day')) {
                        $size = filesize($sessionFile);
                        unlink($sessionFile);
                        $freedSpace += $size;
                    }
                }
            }
            
            // 6. Check current storage status
            $storagePath = storage_path();
            $freeBytes = disk_free_space($storagePath);
            $totalBytes = disk_total_space($storagePath);
            $usedBytes = $totalBytes - $freeBytes;
            $usedPercent = round(($usedBytes / $totalBytes) * 100, 1);
            
            $this->info('✅ EMERGENCY CLEANUP COMPLETED!');
            $this->info("📊 Freed space: " . round($freedSpace / 1024 / 1024, 2) . " MB");
            $this->info("💾 Free space: " . round($freeBytes / 1024 / 1024 / 1024, 2) . " GB");
            $this->info("📈 Disk usage: {$usedPercent}%");
            
            if ($freeBytes < 100 * 1024 * 1024) {
                $this->error('⚠️  WARNING: Still critically low on space! Consider freeing up more disk space.');
            } else {
                $this->info('✅ Storage space is now adequate.');
            }
            
        } catch (\Exception $e) {
            $this->error("❌ Emergency cleanup failed: " . $e->getMessage());
            return 1;
        }
        
        return 0;
    }
}