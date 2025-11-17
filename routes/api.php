<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PatientInformationController;
use App\Http\Controllers\PatientMedicalRecordsController;
use App\Http\Controllers\VaccineListController;
use App\Http\Controllers\FamilyPlanningClientController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\NewbornImmunizationController;
use App\Http\Controllers\Nutrition12MonthsController;
use App\Http\Controllers\OutcomeController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\Api\ContraceptiveInventoryController;

// Public API routes (for dashboard and general access)

// Protected Routes - All patient-related operations require authentication
Route::middleware('auth:sanctum')->group(function () {
    
    // Vaccine Management Routes
    Route::apiResource('vaccine-lists', VaccineListController::class);
    Route::post('vaccine-lists/{id}/use', [VaccineListController::class, 'useVaccine']);
    
    // Contraceptive Management Routes
    Route::apiResource('contraceptive-inventory', ContraceptiveInventoryController::class);
    Route::post('contraceptive-inventory/{id}/use', [ContraceptiveInventoryController::class, 'useContraceptive']);
    
    // Patient Management Routes
    Route::get('/patients/archived', [PatientController::class, 'archived']);
    Route::post('/patients/{id}/archive', [PatientController::class, 'archive']);
    Route::post('/patients/{id}/unarchive', [PatientController::class, 'unarchive']);
    Route::apiResource('patients', PatientController::class);
    Route::get('/patient-information/archived', [PatientInformationController::class, 'archived']);
    Route::post('/patient-information/{id}/archive', [PatientInformationController::class, 'archive']);
    Route::post('/patient-information/{id}/unarchive', [PatientInformationController::class, 'unarchive']);
    Route::apiResource('patient-information', PatientInformationController::class);
    Route::apiResource('patient-medical-records', PatientMedicalRecordsController::class);
    Route::get('/patient-medical-records/patient/{patientId}', [PatientMedicalRecordsController::class, 'getByPatient']);
    Route::apiResource('tracker-patients', PatientController::class);
    Route::apiResource('family-planning-clients', FamilyPlanningClientController::class);

    // Patient-related data routes (for PatientVaccineTracker)
    Route::apiResource('newborn-immunizations', NewbornImmunizationController::class);
    Route::get('/newborn-immunizations/patient/{patientId}', [NewbornImmunizationController::class, 'getByPatient']);
    Route::apiResource('nutrition-12months', Nutrition12MonthsController::class);
    Route::get('/nutrition-12months/patient/{patientId}', [Nutrition12MonthsController::class, 'getByPatient']);
    Route::apiResource('outcomes', OutcomeController::class);
    Route::get('/outcomes/patient/{patientId}', [OutcomeController::class, 'getByPatient']);
    
    // User management routes
    Route::post('/logout', [UserController::class, 'logout']);
    Route::get('/profile', [UserController::class, 'profile']);
    
    // Admin-only user management routes
    Route::middleware('admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
        Route::patch('/users/{id}/status', [UserController::class, 'updateStatus']);
        Route::post('/users/{id}/reset-password', [UserController::class, 'resetPassword']);
        Route::post('/users/{id}/reactivate', [UserController::class, 'reactivateAccount']);
        Route::get('/users-statistics', [UserController::class, 'statistics']);
    });
    
    // Audit Log Routes
    Route::get('/audit-logs', [AuditLogController::class, 'index']);
    Route::get('/audit-logs/recent', [AuditLogController::class, 'recent']);
    Route::get('/audit-logs/user/{userId}', [AuditLogController::class, 'byUser']);
    Route::get('/audit-logs/model/{model}', [AuditLogController::class, 'byModel']);
    Route::get('/audit-logs/statistics', [AuditLogController::class, 'statistics']);
    
    // Backup System Routes
    Route::get('/backup', [BackupController::class, 'index']);
    Route::post('/backup/full', [BackupController::class, 'createFullBackup']);
    Route::post('/backup/database', [BackupController::class, 'createDatabaseBackup']);
    Route::post('/backup/files', [BackupController::class, 'createFilesBackup']);
    Route::post('/backup/trigger-automatic', [BackupController::class, 'triggerAutomaticBackup']);
    Route::get('/backup/list', [BackupController::class, 'getAvailableBackups']);
    Route::get('/backup/download/{backupName}', [BackupController::class, 'downloadBackup']);
    Route::delete('/backup/delete/{backupName}', [BackupController::class, 'deleteBackup']);
    Route::post('/backup/clean', [BackupController::class, 'cleanOldBackups']);
    
    // User profile route
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

// Test route to check database connection
Route::get('/test-db', function() {
    try {
        $count = \App\Models\Patient::count();
        return response()->json(['message' => 'Database connected', 'patient_count' => $count])
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
    }
});

// Test route for archived patients (no auth required for testing)
Route::get('/test-archived', function() {
    try {
        $archivedCount = \App\Models\PatientInformation::where('archived', true)->count();
        $totalCount = \App\Models\PatientInformation::count();
        return response()->json([
            'message' => 'Archived patients test', 
            'archived_count' => $archivedCount,
            'total_count' => $totalCount
        ])
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
    }
});

// Test medical records API
Route::get('/test-medical-records', function() {
    try {
        $count = \App\Models\PatientMedicalRecords::count();
        $sample = \App\Models\PatientMedicalRecords::with('patient')->first();
        return response()->json([
            'message' => 'Medical records API working',
            'count' => $count,
            'sample_record' => $sample
        ])
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
    }
});



// Handle CORS preflight requests
Route::options('{any}', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
})->where('any', '.*');

// Test CORS route
Route::get('/test-cors', function () {
    return response()->json(['message' => 'CORS is working'])
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
});

// Test nutrition table
Route::get('/test-nutrition-table', function () {
    try {
        $exists = \Schema::hasTable('nutrition_12months');
        $count = $exists ? \App\Models\Nutrition12Months::count() : 0;
        return response()->json([
            'table_exists' => $exists,
            'record_count' => $count,
            'message' => $exists ? 'Nutrition table exists' : 'Nutrition table does not exist'
        ])
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
    }
});

// User Authentication Routes
Route::post('/register', [UserController::class, 'register']);
Route::post('/login', [UserController::class, 'login']);

// Test route to check users
Route::get('/test-users', function() {
    $users = \App\Models\User::all(['id', 'name', 'username', 'email', 'role', 'status']);
    return response()->json(['users' => $users]);
});

// Test route to verify audit logging with authentication
Route::middleware('auth:sanctum')->post('/test-audit-log', function(Request $request) {
    $user = $request->user();
    
    // Test creating an audit log entry
    $auditLog = \App\Services\AuditLogService::log(
        'Test',
        'TestModel',
        'test-123',
        "Test audit log entry created by {$user->name}",
        null,
        ['test_data' => 'test_value'],
        $request
    );
    
    return response()->json([
        'message' => 'Audit log test successful',
        'user' => $user->name,
        'audit_log_id' => $auditLog ? $auditLog->id : null,
        'audit_log_user' => $auditLog ? $auditLog->user_name : null
    ]);
});

// Test route to test all CRUD operations for audit logging
Route::middleware('auth:sanctum')->post('/test-crud-audit', function(Request $request) {
    $user = $request->user();
    $results = [];
    
    // Test Create
    $createLog = \App\Services\AuditLogService::logCreated(
        'TestModel',
        'test-create-123',
        "Test creation by {$user->name}",
        ['test' => 'data'],
        $request
    );
    $results['create'] = $createLog ? $createLog->id : 'failed';
    
    // Test View
    $viewLog = \App\Services\AuditLogService::logViewed(
        'TestModel',
        'test-view-123',
        "Test view by {$user->name}",
        $request
    );
    $results['view'] = $viewLog ? $viewLog->id : 'failed';
    
    // Test Update
    $updateLog = \App\Services\AuditLogService::logUpdated(
        'TestModel',
        'test-update-123',
        "Test update by {$user->name}",
        ['old' => 'data'],
        ['new' => 'data'],
        $request
    );
    $results['update'] = $updateLog ? $updateLog->id : 'failed';
    
    // Test Delete
    $deleteLog = \App\Services\AuditLogService::logDeleted(
        'TestModel',
        'test-delete-123',
        "Test deletion by {$user->name}",
        ['deleted' => 'data'],
        $request
    );
    $results['delete'] = $deleteLog ? $deleteLog->id : 'failed';
    
    return response()->json([
        'message' => 'CRUD audit log test completed',
        'user' => $user->name,
        'results' => $results
    ]);
});

// Test password hash
Route::get('/test-password/{username}', function($username) {
    $user = \App\Models\User::where('username', $username)->first();
    if ($user) {
        return response()->json([
            'username' => $user->username,
            'password_hash' => $user->password,
            'password_length' => strlen($user->password)
        ]);
    }
    return response()->json(['error' => 'User not found']);
});

// Reset password for testing (REMOVE IN PRODUCTION)
Route::post('/reset-password/{username}', function($username) {
    $user = \App\Models\User::where('username', $username)->first();
    if ($user) {
        $user->update(['password' => \Illuminate\Support\Facades\Hash::make('password123')]);
        return response()->json(['message' => 'Password reset to: password123']);
    }
    return response()->json(['error' => 'User not found']);
});

// Create test doctor user (REMOVE IN PRODUCTION)
Route::post('/create-test-doctor', function() {
    $user = \App\Models\User::create([
        'name' => 'Test Doctor',
        'full_name' => 'Test Doctor',
        'username' => 'doctor123',
        'email' => 'doctor@test.com',
        'password' => \Illuminate\Support\Facades\Hash::make('password123'),
        'role' => 'doctor',
        'status' => 'active'
    ]);
    return response()->json(['message' => 'Test doctor created', 'username' => 'doctor123', 'password' => 'password123']);
});






// Test password hash
Route::get('/test-password/{username}', function($username) {
    $user = \App\Models\User::where('username', $username)->first();
    if ($user) {
        return response()->json([
            'username' => $user->username,
            'password_hash' => $user->password,
            'password_length' => strlen($user->password)
        ]);
    }
    return response()->json(['error' => 'User not found']);
});

// Reset password for testing (REMOVE IN PRODUCTION)
Route::post('/reset-password/{username}', function($username) {
    $user = \App\Models\User::where('username', $username)->first();
    if ($user) {
        $user->update(['password' => \Illuminate\Support\Facades\Hash::make('password123')]);
        return response()->json(['message' => 'Password reset to: password123']);
    }
    return response()->json(['error' => 'User not found']);
});

// Create test doctor user (REMOVE IN PRODUCTION)
Route::post('/create-test-doctor', function() {
    $user = \App\Models\User::create([
        'name' => 'Test Doctor',
        'full_name' => 'Test Doctor',
        'username' => 'doctor123',
        'email' => 'doctor@test.com',
        'password' => \Illuminate\Support\Facades\Hash::make('password123'),
        'role' => 'doctor',
        'status' => 'active'
    ]);
    return response()->json(['message' => 'Test doctor created', 'username' => 'doctor123', 'password' => 'password123']);
});



