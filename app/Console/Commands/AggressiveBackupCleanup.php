<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Artisan;

class AggressiveBackupCleanup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'backup:aggressive-cleanup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Aggressively clean up backup files to maintain low storage usage';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting aggressive backup cleanup...');
        
        try {
            // Get all backup files
            $backupFiles = [];
            
            // Check Laravel directory
            $laravelFiles = Storage::disk('local')->files('Laravel');
            foreach ($laravelFiles as $file) {
                if (pathinfo($file, PATHINFO_EXTENSION) === 'zip') {
                    $backupFiles[] = [
                        'path' => $file,
                        'name' => basename($file),
                        'size' => Storage::disk('local')->size($file),
                        'date' => Storage::disk('local')->lastModified($file)
                    ];
                }
            }
            
            // Sort by date (newest first)
            usort($backupFiles, function($a, $b) {
                return $b['date'] <=> $a['date'];
            });
            
            // Keep only the 2 most recent backups
            $backupsToKeep = 2;
            $backupsToDelete = array_slice($backupFiles, $backupsToKeep);
            
            $deletedCount = 0;
            $freedSpace = 0;
            
            foreach ($backupsToDelete as $backup) {
                try {
                    Storage::disk('local')->delete($backup['path']);
                    $deletedCount++;
                    $freedSpace += $backup['size'];
                    $this->line("Deleted: {$backup['name']}");
                } catch (\Exception $e) {
                    $this->error("Failed to delete {$backup['name']}: {$e->getMessage()}");
                }
            }
            
            // Also run the standard cleanup
            Artisan::call('backup:clean');
            $standardOutput = Artisan::output();
            
            $this->info("Aggressive cleanup completed!");
            $this->info("Deleted {$deletedCount} backup files");
            $this->info("Freed " . round($freedSpace / 1024 / 1024, 2) . " MB of space");
            $this->line($standardOutput);
            
        } catch (\Exception $e) {
            $this->error("Aggressive cleanup failed: {$e->getMessage()}");
            return 1;
        }
        
        return 0;
    }
}