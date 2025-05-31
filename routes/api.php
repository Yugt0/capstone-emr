<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PatientInformationController;
use App\Http\Controllers\PatientMedicalRecordsController;

Route::apiResource('patients', PatientInformationController::class);
Route::apiResource('patient-medical-records', PatientMedicalRecordsController::class);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
