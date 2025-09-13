<?php

namespace App\Http\Controllers;

use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuditLogController extends Controller
{
    /**
     * Display a listing of audit logs
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = [
                'search' => $request->get('search'),
                'action' => $request->get('action', 'All'),
                'model' => $request->get('model'),
                'user_id' => $request->get('user_id'),
                'user' => $request->get('user'),
                'start_date' => $request->get('start_date'),
                'end_date' => $request->get('end_date'),
            ];

            $query = AuditLogService::getLogs($filters);
            
            // Paginate results
            $perPage = $request->get('per_page', 50);
            $logs = $query->paginate($perPage);

            return response()->json($logs)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
        }
    }

    /**
     * Get recent audit logs (last 100)
     */
    public function recent(): JsonResponse
    {
        try {
            $logs = AuditLogService::getLogs()->limit(100)->get();

            return response()->json($logs)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
        }
    }

    /**
     * Get audit logs for a specific user
     */
    public function byUser($userId): JsonResponse
    {
        try {
            $logs = AuditLogService::getLogs(['user_id' => $userId])->get();

            return response()->json($logs)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
        }
    }

    /**
     * Get audit logs for a specific model
     */
    public function byModel($model): JsonResponse
    {
        try {
            $logs = AuditLogService::getLogs(['model' => $model])->get();

            return response()->json($logs)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
        }
    }

    /**
     * Get audit statistics
     */
    public function statistics(): JsonResponse
    {
        try {
            $stats = [
                'total_logs' => \App\Models\AuditLog::count(),
                'today_logs' => \App\Models\AuditLog::whereDate('created_at', today())->count(),
                'this_week_logs' => \App\Models\AuditLog::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
                'this_month_logs' => \App\Models\AuditLog::whereMonth('created_at', now()->month)->count(),
                'actions_count' => \App\Models\AuditLog::selectRaw('action, COUNT(*) as count')
                    ->groupBy('action')
                    ->orderBy('count', 'desc')
                    ->get(),
                'models_count' => \App\Models\AuditLog::selectRaw('model, COUNT(*) as count')
                    ->groupBy('model')
                    ->orderBy('count', 'desc')
                    ->get(),
                'users_count' => \App\Models\AuditLog::selectRaw('user_name, COUNT(*) as count')
                    ->groupBy('user_name')
                    ->orderBy('count', 'desc')
                    ->limit(10)
                    ->get(),
            ];

            return response()->json($stats)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
        }
    }
}
