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
            $patients = Patient::active()->get();
            
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
        
        // Audit logging is handled automatically by the Auditable trait
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
        $patient->update($request->all());
        
        // Audit logging is handled automatically by the Auditable trait
        return response()->json($patient, 200);
    }

    public function destroy($id)
    {
        $patient = Patient::findOrFail($id);
        $patient->delete();
        
        // Audit logging is handled automatically by the Auditable trait
        return response()->json(null, 204);
    }

    /**
     * Archive a patient
     */
    public function archive($id)
    {
        $patient = Patient::findOrFail($id);
        $patient->archive();
        
        // Log the archive activity
        if (auth()->check()) {
            AuditLogService::logUpdated(
                'Patient',
                $id,
                "Archived patient: {$patient->child_name}"
            );
        }
        
        return response()->json(['message' => 'Patient archived successfully'], 200);
    }

    /**
     * Unarchive a patient
     */
    public function unarchive($id)
    {
        $patient = Patient::findOrFail($id);
        $patient->unarchive();
        
        // Log the unarchive activity
        if (auth()->check()) {
            AuditLogService::logUpdated(
                'Patient',
                $id,
                "Unarchived patient: {$patient->child_name}"
            );
        }
        
        return response()->json(['message' => 'Patient unarchived successfully'], 200);
    }

    /**
     * Get archived patients
     */
    public function archived()
    {
        // Debug authentication
        \Log::info('Archived patients endpoint called', [
            'user' => auth()->user(),
            'authenticated' => auth()->check(),
            'token' => request()->bearerToken()
        ]);
        
        $patients = Patient::archived()->get();
        
        // Log the view activity for archived patients
        if (auth()->check()) {
            AuditLogService::logViewed(
                'Patient',
                'archived',
                "Viewed archived patients list (Total: " . count($patients) . " patients)"
            );
        }
        
        return response()->json($patients);
    }
} 