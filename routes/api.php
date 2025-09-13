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
use App\Http\Controllers\Api\ContraceptiveInventoryController;

// Public API routes (for dashboard and general access)
Route::apiResource('patients', PatientInformationController::class);
Route::apiResource('patient-medical-records', PatientMedicalRecordsController::class);
Route::get('/patient-medical-records/patient/{patientId}', [PatientMedicalRecordsController::class, 'getByPatient']);
Route::apiResource('vaccine-lists', VaccineListController::class);
Route::apiResource('contraceptive-inventory', ContraceptiveInventoryController::class);
Route::apiResource('tracker-patients', PatientController::class);
Route::apiResource('family-planning-clients', FamilyPlanningClientController::class);

// Patient-related data routes (for PatientVaccineTracker)
Route::apiResource('newborn-immunizations', NewbornImmunizationController::class);
Route::get('/newborn-immunizations/patient/{patientId}', [NewbornImmunizationController::class, 'getByPatient']);
Route::apiResource('nutrition-12months', Nutrition12MonthsController::class);
Route::get('/nutrition-12months/patient/{patientId}', [Nutrition12MonthsController::class, 'getByPatient']);
Route::apiResource('outcomes', OutcomeController::class);
Route::get('/outcomes/patient/{patientId}', [OutcomeController::class, 'getByPatient']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    
    // User management routes
    Route::post('/logout', [UserController::class, 'logout']);
    Route::get('/profile', [UserController::class, 'profile']);
    Route::get('/users', [UserController::class, 'index']);
    Route::patch('/users/{id}/status', [UserController::class, 'updateStatus']);
    
    // Audit Log Routes
    Route::get('/audit-logs', [AuditLogController::class, 'index']);
    Route::get('/audit-logs/recent', [AuditLogController::class, 'recent']);
    Route::get('/audit-logs/user/{userId}', [AuditLogController::class, 'byUser']);
    Route::get('/audit-logs/model/{model}', [AuditLogController::class, 'byModel']);
    Route::get('/audit-logs/statistics', [AuditLogController::class, 'statistics']);
    
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




