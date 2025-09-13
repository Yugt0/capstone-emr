<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Services\AuditLogService;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    public function index()
    {
        try {
            $patients = Patient::all();
            
            // Log the view activity for patient tracker list
            if (auth()->check()) {
                AuditLogService::logViewed(
                    'Patient',
                    'tracker-list',
                    "Viewed patient tracker list (Total: " . count($patients) . " patients)"
                );
            } else {
                AuditLogService::logSystemActivity(
                    'Viewed',
                    'Patient',
                    'tracker-list',
                    "Viewed patient tracker list (Total: " . count($patients) . " patients)"
                );
            }
            
            return response()->json($patients)
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

    public function store(Request $request)
    {
        $patient = Patient::create($request->all());
        
        // Log the creation with detailed description
        if (auth()->check()) {
            AuditLogService::logCreated(
                'Patient',
                $patient->id,
                "Added new patient: {$patient->child_name} (Registration: {$patient->registration_no})",
                $patient->toArray()
            );
        } else {
            AuditLogService::logSystemActivity(
                'Created',
                'Patient',
                $patient->id,
                "Added new patient: {$patient->child_name} (Registration: {$patient->registration_no})",
                null,
                $patient->toArray()
            );
        }
        
        return response()->json($patient, 201);
    }

    public function show($id)
    {
        try {
            $patient = Patient::findOrFail($id);
            
            // Log the view activity
            if (auth()->check()) {
                AuditLogService::logViewed(
                    'Patient',
                    $id,
                    "Viewed patient details: {$patient->child_name}"
                );
            } else {
                AuditLogService::logSystemActivity(
                    'Viewed',
                    'Patient',
                    $id,
                    "Viewed patient details: {$patient->child_name}"
                );
            }
            
            return $patient;
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $patient = Patient::findOrFail($id);
        $oldData = $patient->toArray();
        $patient->update($request->all());
        
        // Log the update with detailed description
        if (auth()->check()) {
            AuditLogService::logUpdated(
                'Patient',
                $id,
                "Updated patient: {$patient->child_name}",
                $oldData,
                $patient->getChanges()
            );
        } else {
            AuditLogService::logSystemActivity(
                'Updated',
                'Patient',
                $id,
                "Updated patient: {$patient->child_name}",
                $oldData,
                $patient->getChanges()
            );
        }
        
        return response()->json($patient, 200);
    }

    public function destroy($id)
    {
        $patient = Patient::findOrFail($id);
        $patientName = $patient->child_name;
        $patient->delete();
        
        // Log the deletion with detailed description
        if (auth()->check()) {
            AuditLogService::logDeleted(
                'Patient',
                $id,
                "Deleted patient: {$patientName}",
                ['child_name' => $patientName, 'registration_no' => $patient->registration_no]
            );
        } else {
            AuditLogService::logSystemActivity(
                'Deleted',
                'Patient',
                $id,
                "Deleted patient: {$patientName}",
                ['child_name' => $patientName, 'registration_no' => $patient->registration_no],
                null
            );
        }
        
        return response()->json(null, 204);
    }
} 