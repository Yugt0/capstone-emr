<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Spatie\Backup\BackupDestination\BackupDestination;
use Spatie\Backup\Tasks\Backup\BackupJob;
use Spatie\Backup\Tasks\Backup\BackupJobFactory;
use Spatie\Backup\BackupDestination\Backup;
use Spatie\Backup\BackupDestination\BackupCollection;
use Carbon\Carbon;
use App\Services\AuditLogService;

class BackupController extends Controller
{
    /**
     * Display the backup dashboard
     */
    public function index(): JsonResponse
    {
        try {
            // Check and trigger automatic backup if needed (works even when cron is offline)
            $this->checkAndTriggerAutomaticBackup();
            
            $backupStats = $this->getBackupStatistics();
            $systemInfo = $this->getSystemInformation();
            $automaticBackupInfo = $this->getAutomaticBackupInfo();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'backup_stats' => $backupStats,
                    'system_info' => $systemInfo,
                    'available_backups' => $this->getAvailableBackupsFromStorage(),
                    'automatic_backup_info' => $automaticBackupInfo
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load backup dashboard: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a full system backup
     */
    public function createFullBackup(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Check storage before backup
            $this->checkAndCleanStorageIfCritical();

            // Log the backup initiation
            AuditLogService::log(
                'Backup',
                'System',
                'full-backup',
                "Full system backup initiated by {$user->name}",
                null,
                ['backup_type' => 'full_system'],
                $request
            );

            // Run the backup command
            Artisan::call('backup:run');
            
            $output = Artisan::output();
            
            // Log successful backup
            AuditLogService::log(
                'Backup',
                'System',
                'full-backup',
                "Full system backup completed successfully by {$user->name}",
                null,
                ['backup_output' => $output],
                $request
            );

            return response()->json([
                'success' => true,
                'message' => 'Full system backup completed successfully',
                'output' => $output
            ]);
        } catch (\Exception $e) {
            // Log backup failure
            AuditLogService::log(
                'Backup',
                'System',
                'full-backup',
                "Full system backup failed: {$e->getMessage()}",
                null,
                ['error' => $e->getMessage()],
                $request
            );

            return response()->json([
                'success' => false,
                'message' => 'Backup failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a database-only backup
     */
    public function createDatabaseBackup(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            AuditLogService::log(
                'Backup',
                'Database',
                'database-backup',
                "Database backup initiated by {$user->name}",
                null,
                ['backup_type' => 'database_only'],
                $request
            );

            // Create backup using direct mysqldump command
            $backupResult = $this->createDirectDatabaseBackup();
            
            if ($backupResult['success']) {
                AuditLogService::log(
                    'Backup',
                    'Database',
                    'database-backup',
                    "Database backup completed successfully by {$user->name}",
                    null,
                    ['backup_file' => $backupResult['filename']],
                    $request
                );

                return response()->json([
                    'success' => true,
                    'message' => 'Database backup completed successfully',
                    'filename' => $backupResult['filename'],
                    'size' => $backupResult['size']
                ]);
            } else {
                throw new \Exception($backupResult['error']);
            }
        } catch (\Exception $e) {
            AuditLogService::log(
                'Backup',
                'Database',
                'database-backup',
                "Database backup failed: {$e->getMessage()}",
                null,
                ['error' => $e->getMessage()],
                $request
            );

            return response()->json([
                'success' => false,
                'message' => 'Database backup failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a files-only backup
     */
    public function createFilesBackup(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            AuditLogService::log(
                'Backup',
                'Files',
                'files-backup',
                "Files backup initiated by {$user->name}",
                null,
                ['backup_type' => 'files_only'],
                $request
            );

            Artisan::call('backup:run', ['--only-files' => true]);
            $output = Artisan::output();
            
            AuditLogService::log(
                'Backup',
                'Files',
                'files-backup',
                "Files backup completed successfully by {$user->name}",
                null,
                ['backup_output' => $output],
                $request
            );

            return response()->json([
                'success' => true,
                'message' => 'Files backup completed successfully',
                'output' => $output
            ]);
        } catch (\Exception $e) {
            AuditLogService::log(
                'Backup',
                'Files',
                'files-backup',
                "Files backup failed: {$e->getMessage()}",
                null,
                ['error' => $e->getMessage()],
                $request
            );

            return response()->json([
                'success' => false,
                'message' => 'Files backup failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get list of available backups
     */
    public function getAvailableBackups(): JsonResponse
    {
        try {
            $backups = $this->getAvailableBackupsFromStorage();
            
            return response()->json([
                'success' => true,
                'data' => $backups
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve backups: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download a specific backup
     */
    public function downloadBackup(Request $request, string $backupName)
    {
        try {
            $user = $request->user();
            
            // Check multiple possible backup locations
            $backupPath = null;
            $fullPath = null;
            
            if (Storage::disk('local')->exists("Laravel/{$backupName}")) {
                $backupPath = "Laravel/{$backupName}";
            } elseif (Storage::disk('local')->exists("backups/{$backupName}")) {
                $backupPath = "backups/{$backupName}";
            } else {
                // Check direct file system
                $directPath = storage_path("app/backups/{$backupName}");
                if (file_exists($directPath)) {
                    $fullPath = $directPath;
                }
            }
            
            if (!$backupPath && !$fullPath) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup file not found'
                ], 404);
            }

            AuditLogService::log(
                'Backup',
                'Download',
                $backupName,
                "Backup downloaded by {$user->name}",
                null,
                ['backup_file' => $backupName],
                $request
            );

            // Return the file directly for download
            if ($backupPath) {
                return Storage::disk('local')->download($backupPath, $backupName);
            } else {
                return response()->download($fullPath, $backupName);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to download backup: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a backup
     */
    public function deleteBackup(Request $request, string $backupName): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Check multiple possible backup locations
            $backupPath = null;
            $fullPath = null;
            
            if (Storage::disk('local')->exists("Laravel/{$backupName}")) {
                $backupPath = "Laravel/{$backupName}";
            } elseif (Storage::disk('local')->exists("backups/{$backupName}")) {
                $backupPath = "backups/{$backupName}";
            } else {
                // Check direct file system
                $directPath = storage_path("app/backups/{$backupName}");
                if (file_exists($directPath)) {
                    $fullPath = $directPath;
                }
            }
            
            if (!$backupPath && !$fullPath) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup file not found'
                ], 404);
            }

            // Delete the file
            if ($backupPath) {
                Storage::disk('local')->delete($backupPath);
            } else {
                unlink($fullPath);
            }
            
            AuditLogService::log(
                'Backup',
                'Delete',
                $backupName,
                "Backup deleted by {$user->name}",
                null,
                ['backup_file' => $backupName],
                $request
            );

            return response()->json([
                'success' => true,
                'message' => 'Backup deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete backup: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clean old backups
     */
    public function cleanOldBackups(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            AuditLogService::log(
                'Backup',
                'Cleanup',
                'cleanup-backups',
                "Backup cleanup initiated by {$user->name}",
                null,
                ['cleanup_type' => 'old_backups'],
                $request
            );

            Artisan::call('backup:clean');
            $output = Artisan::output();
            
            AuditLogService::log(
                'Backup',
                'Cleanup',
                'cleanup-backups',
                "Backup cleanup completed by {$user->name}",
                null,
                ['cleanup_output' => $output],
                $request
            );

            return response()->json([
                'success' => true,
                'message' => 'Old backups cleaned successfully',
                'output' => $output
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cleanup failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get backup statistics
     */
    private function getBackupStatistics(): array
    {
        try {
            $backups = $this->getAvailableBackupsFromStorage();
            $totalSize = 0;
            $backupCount = count($backups);
            
            foreach ($backups as $backup) {
                $totalSize += $backup['size'];
            }

            return [
                'total_backups' => $backupCount,
                'total_size_mb' => round($totalSize / 1024 / 1024, 2),
                'latest_backup' => $backupCount > 0 ? $backups[0]['date'] : null,
                'oldest_backup' => $backupCount > 0 ? end($backups)['date'] : null
            ];
        } catch (\Exception $e) {
            return [
                'total_backups' => 0,
                'total_size_mb' => 0,
                'latest_backup' => null,
                'oldest_backup' => null
            ];
        }
    }

    /**
     * Get system information
     */
    private function getSystemInformation(): array
    {
        try {
            return [
                'database_size' => $this->getDatabaseSize(),
                'storage_available' => $this->getAvailableStorage(),
                'last_backup' => $this->getLastBackupDate(),
                'system_health' => $this->getSystemHealth()
            ];
        } catch (\Exception $e) {
            return [
                'database_size' => 'Unknown',
                'storage_available' => 'Unknown',
                'last_backup' => null,
                'system_health' => 'Unknown'
            ];
        }
    }

    /**
     * Get available backups from storage
     */
    private function getAvailableBackupsFromStorage(): array
    {
        try {
            // Check both possible backup locations
            $backupFiles = [];
            
            // Check Laravel directory (where backups are actually stored)
            $laravelFiles = Storage::disk('local')->files('Laravel');
            foreach ($laravelFiles as $file) {
                if (pathinfo($file, PATHINFO_EXTENSION) === 'zip') {
                    $backupFiles[] = $file;
                }
            }
            
            // Also check backups directory if it exists
            if (Storage::disk('local')->exists('backups')) {
                $backupDirFiles = Storage::disk('local')->files('backups');
                foreach ($backupDirFiles as $file) {
                    if (in_array(pathinfo($file, PATHINFO_EXTENSION), ['zip', 'sql'])) {
                        $backupFiles[] = $file;
                    }
                }
            }
            
            // Check direct backup directory
            $directBackupDir = storage_path('app/backups');
            if (file_exists($directBackupDir)) {
                $directFiles = glob($directBackupDir . '/*.{sql,zip}', GLOB_BRACE);
                foreach ($directFiles as $file) {
                    $relativePath = 'backups/' . basename($file);
                    $backupFiles[] = $relativePath;
                }
            }
            
            $backups = [];
            
            foreach ($backupFiles as $file) {
                // Handle both Storage and direct file system
                if (Storage::disk('local')->exists($file)) {
                    $backups[] = [
                        'name' => basename($file),
                        'size' => Storage::disk('local')->size($file),
                        'date' => Carbon::createFromTimestamp(Storage::disk('local')->lastModified($file)),
                        'path' => $file
                    ];
                } else {
                    // Handle direct file system files
                    $fullPath = storage_path('app/' . $file);
                    if (file_exists($fullPath)) {
                        $backups[] = [
                            'name' => basename($file),
                            'size' => filesize($fullPath),
                            'date' => Carbon::createFromTimestamp(filemtime($fullPath)),
                            'path' => $file
                        ];
                    }
                }
            }
            
            // Sort by date, newest first
            usort($backups, function($a, $b) {
                return $b['date']->timestamp - $a['date']->timestamp;
            });
            
            return $backups;
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Get database size
     */
    private function getDatabaseSize(): string
    {
        try {
            $result = DB::select("SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'size_mb' FROM information_schema.tables WHERE table_schema = ?", [config('database.connections.mysql.database')]);
            return $result[0]->size_mb . ' MB';
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    /**
     * Get available storage space
     */
    private function getAvailableStorage(): string
    {
        try {
            $storagePath = function_exists('storage_path') ? storage_path() : base_path('storage');
            $bytes = disk_free_space($storagePath);
            return round($bytes / 1024 / 1024 / 1024, 2) . ' GB';
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    /**
     * Get last backup date
     */
    private function getLastBackupDate(): ?string
    {
        try {
            $backups = $this->getAvailableBackupsFromStorage();
            return $backups[0]['date'] ?? null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Check and clean storage if critical
     */
    private function checkAndCleanStorageIfCritical(): void
    {
        try {
            $storagePath = function_exists('storage_path') ? storage_path() : base_path('storage');
            $freeBytes = disk_free_space($storagePath);
            $totalBytes = disk_total_space($storagePath);
            $usedBytes = $totalBytes - $freeBytes;
            $usedPercent = round(($usedBytes / $totalBytes) * 100, 1);
            
            // If storage is critical (less than 200MB free or >95% used), run emergency cleanup
            if ($freeBytes < 200 * 1024 * 1024 || $usedPercent > 95) {
                \Log::warning("Critical storage detected: {$freeBytes} bytes free, {$usedPercent}% used. Running emergency cleanup.");
                
                // Run aggressive cleanup
                Artisan::call('backup:aggressive-cleanup');
                
                // Also clean Laravel logs and cache
                Artisan::call('cache:clear');
                Artisan::call('config:clear');
                Artisan::call('route:clear');
                Artisan::call('view:clear');
                
                \Log::info("Emergency cleanup completed due to critical storage.");
            }
        } catch (\Exception $e) {
            \Log::error("Failed to check/clean storage: " . $e->getMessage());
        }
    }

    /**
     * Get system health status
     */
    private function getSystemHealth(): string
    {
        try {
            // Check storage space first
            $storagePath = function_exists('storage_path') ? storage_path() : base_path('storage');
            $freeBytes = disk_free_space($storagePath);
            $totalBytes = disk_total_space($storagePath);
            $usedBytes = $totalBytes - $freeBytes;
            $usedPercent = round(($usedBytes / $totalBytes) * 100, 1);
            
            // Critical storage check
            if ($freeBytes < 100 * 1024 * 1024) { // Less than 100MB free
                return 'Critical - Storage Critical';
            } elseif ($usedPercent > 95) {
                return 'Critical - Storage Warning';
            } elseif ($usedPercent > 90) {
                return 'Warning - Storage High';
            }
            
            // Check backup status
            $backups = $this->getAvailableBackupsFromStorage();
            $lastBackup = $backups[0]['date'] ?? null;
            
            if (!$lastBackup) {
                return 'Warning - No backups found';
            }
            
            $daysSinceBackup = Carbon::now()->diffInDays($lastBackup);
            
            if ($daysSinceBackup <= 1) {
                return 'Healthy';
            } elseif ($daysSinceBackup <= 7) {
                return 'Warning';
            } else {
                return 'Critical';
            }
        } catch (\Exception $e) {
            return 'Unknown';
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

            // Check if mysqldump is available
            $mysqldumpPath = $this->findMysqldumpPath();
            if (!$mysqldumpPath) {
                return [
                    'success' => false,
                    'error' => 'mysqldump command not found. Please install MySQL/MariaDB and ensure mysqldump is in your system PATH. ' .
                               'On Windows, you may need to add MySQL bin directory to PATH (e.g., C:\\xampp\\mysql\\bin or C:\\Program Files\\MySQL\\MySQL Server X.X\\bin)'
                ];
            }

            // Validate database configuration
            if (empty($database)) {
                return [
                    'success' => false,
                    'error' => 'Database name is not configured. Please check your .env file (DB_DATABASE)'
                ];
            }

            // Create backup directory if it doesn't exist
            $backupDir = storage_path('app/backups');
            if (!file_exists($backupDir)) {
                if (!mkdir($backupDir, 0755, true)) {
                    return [
                        'success' => false,
                        'error' => 'Failed to create backup directory: ' . $backupDir
                    ];
                }
            }

            // Check if backup directory is writable
            if (!is_writable($backupDir)) {
                return [
                    'success' => false,
                    'error' => 'Backup directory is not writable: ' . $backupDir
                ];
            }

            // Generate backup filename with timestamp
            $timestamp = Carbon::now()->format('Y-m-d_H-i-s');
            $filename = "database_backup_{$timestamp}.sql";
            $filepath = $backupDir . '/' . $filename;

            // Build mysqldump command
            $command = sprintf(
                '%s --host=%s --port=%s --user=%s --password=%s --single-transaction --routines --triggers %s > %s',
                escapeshellarg($mysqldumpPath),
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
                $errorOutput = implode("\n", $output);
                
                // Provide more helpful error messages
                $errorMessage = 'mysqldump failed';
                if (stripos($errorOutput, 'Access denied') !== false) {
                    $errorMessage .= ': Database access denied. Please check your database credentials in .env file (DB_USERNAME, DB_PASSWORD)';
                } elseif (stripos($errorOutput, 'Unknown database') !== false) {
                    $errorMessage .= ': Database "' . $database . '" does not exist. Please check your DB_DATABASE setting in .env file';
                } elseif (stripos($errorOutput, 'Can\'t connect to MySQL server') !== false || stripos($errorOutput, 'Connection refused') !== false) {
                    $errorMessage .= ': Cannot connect to MySQL server. Please ensure MySQL service is running and check DB_HOST and DB_PORT in .env file';
                } else {
                    $errorMessage .= ': ' . $errorOutput;
                }
                
                return [
                    'success' => false,
                    'error' => $errorMessage
                ];
            }

            // Check if file was created and has content
            if (!file_exists($filepath)) {
                return [
                    'success' => false,
                    'error' => 'Backup file was not created. Check file permissions and disk space.'
                ];
            }

            if (filesize($filepath) === 0) {
                unlink($filepath); // Clean up empty file
                return [
                    'success' => false,
                    'error' => 'Backup file was created but is empty. This may indicate a database connection or permission issue.'
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

    /**
     * Find mysqldump executable path
     */
    private function findMysqldumpPath(): ?string
    {
        // First, try to find mysqldump in PATH
        $output = [];
        $returnCode = 0;
        
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            // Windows: use where command
            exec('where mysqldump 2>nul', $output, $returnCode);
        } else {
            // Linux/Mac: use which command
            exec('which mysqldump 2>&1', $output, $returnCode);
        }
        
        if ($returnCode === 0 && !empty($output[0])) {
            return trim($output[0]);
        }
        
        // If not in PATH, try common installation paths
        $commonPaths = [];
        
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            // Windows common paths
            $commonPaths = [
                'C:\\xampp\\mysql\\bin\\mysqldump.exe',
                'C:\\wamp64\\bin\\mysql\\mysql8.0.xx\\bin\\mysqldump.exe',
                'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
                'C:\\Program Files\\MySQL\\MySQL Server 8.1\\bin\\mysqldump.exe',
                'C:\\Program Files\\MySQL\\MySQL Server 8.2\\bin\\mysqldump.exe',
                'C:\\Program Files\\MySQL\\MySQL Server 8.3\\bin\\mysqldump.exe',
                'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysqldump.exe',
                'C:\\Program Files\\MariaDB\\bin\\mysqldump.exe',
                'C:\\Program Files (x86)\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
            ];
        } else {
            // Linux/Mac common paths
            $commonPaths = [
                '/usr/bin/mysqldump',
                '/usr/local/bin/mysqldump',
                '/usr/local/mysql/bin/mysqldump',
                '/opt/homebrew/bin/mysqldump',
            ];
        }
        
        foreach ($commonPaths as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }
        
        return null;
    }

    /**
     * Check and trigger automatic backup if needed
     * This ensures backups work even when cron job is not running
     */
    private function checkAndTriggerAutomaticBackup(): void
    {
        try {
            // Set timezone to Philippine Time
            $now = Carbon::now('Asia/Manila');
            
            // Check if it's after 7:00 AM today
            $backupTime = Carbon::today('Asia/Manila')->setTime(7, 0, 0);
            
            // Only check if current time is after 7:00 AM
            if ($now->lt($backupTime)) {
                return; // Too early, backup hasn't been scheduled yet today
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
            
            // Check if we're within a reasonable time window (7:00 AM to 11:59 PM)
            // This prevents triggering backups from previous days
            $endOfDay = Carbon::today('Asia/Manila')->setTime(23, 59, 59);
            
            if ($now->gt($endOfDay)) {
                return; // Past today, don't trigger
            }
            
            // Trigger the backup in the background
            // Use dispatch to run it asynchronously so it doesn't block the dashboard load
            \Log::info('Automatic backup triggered via dashboard check (cron fallback)');
            
            // Run the backup command asynchronously to avoid blocking dashboard load
            // For Windows/offline systems, we use dispatch_now which runs immediately but doesn't block
            try {
                // Try to dispatch as a job first (if queues are available)
                if (config('queue.default') !== 'sync') {
                    \Illuminate\Support\Facades\Queue::push(function() {
                        Artisan::call('backup:daily-database');
                    });
                } else {
                    // If queues aren't available, run in background using exec (Windows compatible)
                    $phpPath = PHP_BINARY;
                    $artisanPath = base_path('artisan');
                    $command = escapeshellarg($phpPath) . ' ' . escapeshellarg($artisanPath) . ' backup:daily-database';
                    
                    // Run in background (Windows compatible)
                    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                        // Windows: use start command to run in background
                        pclose(popen("start /B " . $command, "r"));
                    } else {
                        // Linux/Mac: use nohup or & to run in background
                        exec($command . " > /dev/null 2>&1 &");
                    }
                }
            } catch (\Exception $e) {
                // Fallback: run synchronously if background execution fails
                \Log::warning('Could not run backup in background, running synchronously: ' . $e->getMessage());
                Artisan::call('backup:daily-database');
            }
            
        } catch (\Exception $e) {
            // Log error but don't fail the dashboard load
            \Log::error('Failed to check/trigger automatic backup: ' . $e->getMessage());
        }
    }

    /**
     * Get automatic backup information from audit logs
     */
    private function getAutomaticBackupInfo(): array
    {
        try {
            // Get the last successful automatic backup
            $lastAutomaticBackup = DB::table('audit_logs')
                ->where('action', 'daily-automatic-backup')
                ->where('description', 'like', '%completed successfully%')
                ->orderBy('created_at', 'desc')
                ->first();

            // Get the last failed automatic backup
            $lastFailedBackup = DB::table('audit_logs')
                ->where('action', 'daily-automatic-backup')
                ->where(function($query) {
                    $query->where('description', 'like', '%failed%')
                          ->orWhere('description', 'like', '%exception%');
                })
                ->orderBy('created_at', 'desc')
                ->first();

            // Count total automatic backups (successful)
            $totalAutomaticBackups = DB::table('audit_logs')
                ->where('action', 'daily-automatic-backup')
                ->where('description', 'like', '%completed successfully%')
                ->count();

            // Count failed automatic backups
            $failedBackups = DB::table('audit_logs')
                ->where('action', 'daily-automatic-backup')
                ->where(function($query) {
                    $query->where('description', 'like', '%failed%')
                          ->orWhere('description', 'like', '%exception%');
                })
                ->count();

            return [
                'last_automatic_backup' => $lastAutomaticBackup ? [
                    'date' => $lastAutomaticBackup->created_at,
                    'description' => $lastAutomaticBackup->description,
                    'new_values' => json_decode($lastAutomaticBackup->new_values ?? '{}', true)
                ] : null,
                'last_failed_backup' => $lastFailedBackup ? [
                    'date' => $lastFailedBackup->created_at,
                    'description' => $lastFailedBackup->description
                ] : null,
                'total_automatic_backups' => $totalAutomaticBackups,
                'failed_backups' => $failedBackups,
                'success_rate' => ($totalAutomaticBackups + $failedBackups) > 0 
                    ? round(($totalAutomaticBackups / ($totalAutomaticBackups + $failedBackups)) * 100, 2)
                    : 100
            ];
        } catch (\Exception $e) {
            return [
                'last_automatic_backup' => null,
                'last_failed_backup' => null,
                'total_automatic_backups' => 0,
                'failed_backups' => 0,
                'success_rate' => 0
            ];
        }
    }
}
