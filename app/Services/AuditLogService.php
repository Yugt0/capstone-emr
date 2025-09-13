<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuditLogService
{
    /**
     * Log an activity
     */
    public static function log(
        string $action,
        string $model,
        ?string $modelId = null,
        ?string $description = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?Request $request = null
    ): ?AuditLog {
        $user = Auth::user();
        $request = $request ?? request();

        // Only log activities if there's an authenticated user
        // This prevents automatic system activities from being logged
        if (!$user) {
            return null;
        }

        return AuditLog::create([
            'user_id' => $user->id,
            'user_name' => $user->name ?? $user->full_name ?? 'Unknown User',
            'action' => $action,
            'model' => $model,
            'model_id' => $modelId,
            'description' => $description,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
        ]);
    }

    /**
     * Log a creation activity
     */
    public static function logCreated(
        string $model,
        string $modelId,
        ?string $description = null,
        ?array $newValues = null
    ): ?AuditLog {
        return self::log(
            'Created',
            $model,
            $modelId,
            $description ?? "Created new {$model} record",
            null,
            $newValues
        );
    }

    /**
     * Log an update activity
     */
    public static function logUpdated(
        string $model,
        string $modelId,
        ?string $description = null,
        ?array $oldValues = null,
        ?array $newValues = null
    ): ?AuditLog {
        return self::log(
            'Updated',
            $model,
            $modelId,
            $description ?? "Updated {$model} record",
            $oldValues,
            $newValues
        );
    }

    /**
     * Log a deletion activity
     */
    public static function logDeleted(
        string $model,
        string $modelId,
        ?string $description = null,
        ?array $oldValues = null
    ): ?AuditLog {
        return self::log(
            'Deleted',
            $model,
            $modelId,
            $description ?? "Deleted {$model} record",
            $oldValues,
            null
        );
    }

    /**
     * Log a view activity
     */
    public static function logViewed(
        string $model,
        string $modelId,
        ?string $description = null
    ): ?AuditLog {
        return self::log(
            'Viewed',
            $model,
            $modelId,
            $description ?? "Viewed {$model} record"
        );
    }

    /**
     * Log a login activity
     */
    public static function logLogin(?string $description = null): ?AuditLog {
        return self::log(
            'Login',
            'User',
            null,
            $description ?? "User logged in successfully"
        );
    }

    /**
     * Log a logout activity
     */
    public static function logLogout(?string $description = null): ?AuditLog {
        return self::log(
            'Logout',
            'User',
            null,
            $description ?? "User logged out"
        );
    }

    /**
     * Log a failed login attempt
     */
    public static function logFailedLogin(
        string $username,
        ?string $description = null,
        ?Request $request = null
    ): AuditLog {
        $request = $request ?? request();

        return AuditLog::create([
            'user_id' => null,
            'user_name' => $username,
            'action' => 'Failed Login',
            'model' => 'User',
            'model_id' => null,
            'description' => $description ?? "Failed login attempt for username: {$username}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'old_values' => null,
            'new_values' => ['username' => $username],
        ]);
    }

    /**
     * Log a search activity
     */
    public static function logSearch(
        string $model,
        ?string $searchTerm = null,
        ?string $description = null
    ): ?AuditLog {
        return self::log(
            'Searched',
            $model,
            null,
            $description ?? "Searched {$model} records" . ($searchTerm ? " for: {$searchTerm}" : ''),
            null,
            $searchTerm ? ['search_term' => $searchTerm] : null
        );
    }

    /**
     * Log an export activity
     */
    public static function logExport(
        string $model,
        ?string $format = null,
        ?string $description = null
    ): ?AuditLog {
        return self::log(
            'Exported',
            $model,
            null,
            $description ?? "Exported {$model} data" . ($format ? " in {$format} format" : ''),
            null,
            $format ? ['format' => $format] : null
        );
    }

    /**
     * Log a system activity (only for specific cases where needed)
     */
    public static function logSystemActivity(
        string $action,
        string $model,
        ?string $modelId = null,
        ?string $description = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?Request $request = null
    ): AuditLog {
        $request = $request ?? request();

        return AuditLog::create([
            'user_id' => null,
            'user_name' => 'System',
            'action' => $action,
            'model' => $model,
            'model_id' => $modelId,
            'description' => $description,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
        ]);
    }

    /**
     * Get audit logs with filtering
     */
    public static function getLogs(array $filters = []): \Illuminate\Database\Eloquent\Builder
    {
        $query = AuditLog::with('user')->orderBy('created_at', 'desc');

        if (isset($filters['user_id'])) {
            $query->byUser($filters['user_id']);
        }

        if (isset($filters['user']) && $filters['user'] !== 'All') {
            $query->where('user_name', 'like', "%{$filters['user']}%");
        }

        if (isset($filters['action']) && $filters['action'] !== 'All') {
            $query->byAction($filters['action']);
        }

        if (isset($filters['model'])) {
            $query->byModel($filters['model']);
        }

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('user_name', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (isset($filters['start_date']) && isset($filters['end_date'])) {
            $query->byDateRange($filters['start_date'], $filters['end_date']);
        }

        return $query;
    }
} 