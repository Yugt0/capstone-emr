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

Route::apiResource('patients', PatientInformationController::class);
Route::apiResource('patient-medical-records', PatientMedicalRecordsController::class);
Route::get('/patient-medical-records/patient/{patientId}', [PatientMedicalRecordsController::class, 'getByPatient']);
Route::apiResource('vaccine-lists', VaccineListController::class);
Route::apiResource('family-planning-clients', FamilyPlanningClientController::class);
Route::apiResource('tracker-patients', PatientController::class);

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
Route::apiResource('newborn-immunizations', NewbornImmunizationController::class);
Route::get('/newborn-immunizations/patient/{patientId}', [NewbornImmunizationController::class, 'getByPatient']);
Route::apiResource('nutrition-12months', Nutrition12MonthsController::class);
Route::get('/nutrition-12months/patient/{patientId}', [Nutrition12MonthsController::class, 'getByPatient']);
Route::apiResource('outcomes', OutcomeController::class);
Route::get('/outcomes/patient/{patientId}', [OutcomeController::class, 'getByPatient']);

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

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
