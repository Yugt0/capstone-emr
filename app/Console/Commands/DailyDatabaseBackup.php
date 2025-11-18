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
                'mysqldump --host=%s --port=%s --user=%s --password=%s --single-transaction --routines --triggers %s > %s',
                escapeshellarg($host),
                escapeshellarg($port),
                escapeshellarg($username),
                escapeshellarg($password),
                escapeshellarg($database),
                escapeshellarg($filepath)
            );

            // Log the actual command (for debugging) then execute and capture output
            \Log::info('DailyDatabaseBackup: executing mysqldump command: ' . $cmd);
            $output = [];
            $returnCode = 0;
            exec($cmd . ' 2>&1', $output, $returnCode);

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
}

