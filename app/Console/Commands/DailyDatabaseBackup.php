<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\AuditLogService;
use Carbon\Carbon;

class DailyDatabaseBackup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'backup:daily-database';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a daily automatic database backup';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting daily database backup...');
        
        try {
            $backupResult = $this->createDirectDatabaseBackup();
            
            if ($backupResult['success']) {
                // Log the automatic backup
                AuditLogService::log(
                    'Backup',
                    'Database',
                    'daily-automatic-backup',
                    "Daily automatic database backup completed successfully",
                    null,
                    [
                        'backup_file' => $backupResult['filename'],
                        'backup_size' => $backupResult['size'],
                        'backup_type' => 'automatic_daily'
                    ],
                    null // No request for scheduled tasks
                );
                
                $this->info("Daily database backup completed successfully!");
                $this->info("Backup file: {$backupResult['filename']}");
                $this->info("Size: " . round($backupResult['size'] / 1024 / 1024, 2) . " MB");
                
                return 0;
            } else {
                $this->error("Backup failed: " . ($backupResult['error'] ?? 'Unknown error'));
                
                // Log the failure
                AuditLogService::log(
                    'Backup',
                    'Database',
                    'daily-automatic-backup',
                    "Daily automatic database backup failed: " . ($backupResult['error'] ?? 'Unknown error'),
                    null,
                    ['error' => $backupResult['error'] ?? 'Unknown error'],
                    null
                );
                
                return 1;
            }
        } catch (\Exception $e) {
            $this->error("Daily backup failed: {$e->getMessage()}");
            
            // Log the exception
            AuditLogService::log(
                'Backup',
                'Database',
                'daily-automatic-backup',
                "Daily automatic database backup exception: {$e->getMessage()}",
                null,
                ['exception' => $e->getMessage(), 'trace' => $e->getTraceAsString()],
                null
            );
            
            return 1;
        }
    }

    /**
     * Create direct database backup using mysqldump
     */
    private function createDirectDatabaseBackup(): array
    {
        try {
            // Get database configuration
            $dbConfig = config('database.connections.mysql');
            $database = $dbConfig['database'];
            $username = $dbConfig['username'];
            $password = $dbConfig['password'];
            $host = $dbConfig['host'];
            $port = $dbConfig['port'] ?? 3306;

            // Create backup directory if it doesn't exist
            $backupDir = storage_path('app/backups');
            if (!file_exists($backupDir)) {
                mkdir($backupDir, 0755, true);
            }

            // Generate backup filename with timestamp
            $timestamp = Carbon::now()->format('Y-m-d_H-i-s');
            $filename = "database_backup_{$timestamp}.sql";
            $filepath = $backupDir . '/' . $filename;

            // Build mysqldump command
            $command = sprintf(
                'mysqldump --host=%s --port=%s --user=%s --password=%s --single-transaction --routines --triggers %s > %s',
                escapeshellarg($host),
                escapeshellarg($port),
                escapeshellarg($username),
                escapeshellarg($password),
                escapeshellarg($database),
                escapeshellarg($filepath)
            );

            // Execute the command
            $output = [];
            $returnCode = 0;
            exec($command . ' 2>&1', $output, $returnCode);

            if ($returnCode !== 0) {
                return [
                    'success' => false,
                    'error' => 'mysqldump failed: ' . implode("\n", $output)
                ];
            }

            // Check if file was created and has content
            if (!file_exists($filepath) || filesize($filepath) === 0) {
                return [
                    'success' => false,
                    'error' => 'Backup file was not created or is empty'
                ];
            }

            // Get file size
            $fileSize = filesize($filepath);

            return [
                'success' => true,
                'filename' => $filename,
                'filepath' => $filepath,
                'size' => $fileSize
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Backup creation failed: ' . $e->getMessage()
            ];
        }
    }
}

