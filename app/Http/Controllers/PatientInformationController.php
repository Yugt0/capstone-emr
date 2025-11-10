<?php

namespace App\Http\Controllers;

use App\Models\PatientInformation as Patient;
use App\Services\AuditLogService;
use Illuminate\Http\Request;

class PatientInformationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $patients = Patient::active()->get();
        
        // Log the view activity for patient list
        if (auth()->check()) {
            AuditLogService::logViewed(
                'PatientInformation',
                'list',
                "Viewed patient list (Total: " . count($patients) . " patients)"
            );
        } else {
            AuditLogService::logSystemActivity(
                'Viewed',
                'PatientInformation',
                'list',
                "Viewed patient list (Total: " . count($patients) . " patients)"
            );
        }
        
        return response()->json($patients);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
       
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $patient = Patient::create($request->all());
        
        // Audit logging is handled automatically by the Auditable trait
        return response()->json($patient, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $patient = Patient::with('medicalRecords')->findOrFail($id);
        
        // Log the view activity
        if (auth()->check()) {
            AuditLogService::logViewed(
                'PatientInformation',
                $id,
                "Viewed patient details: {$patient->full_name}"
            );
        } else {
            AuditLogService::logSystemActivity(
                'Viewed',
                'PatientInformation',
                $id,
                "Viewed patient details: {$patient->full_name}"
            );
        }
        
        return response()->json($patient);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PatientInformation $patientInformation)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $patient = Patient::findOrFail($id);
        $patient->update($request->all());
        
        // Audit logging is handled automatically by the Auditable trait
        return response()->json($patient);
    }

    /**
     * Remove the specified resource from storage.
     */
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
                'PatientInformation',
                $id,
                "Archived patient: {$patient->full_name}"
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
                'PatientInformation',
                $id,
                "Unarchived patient: {$patient->full_name}"
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
                'PatientInformation',
                'archived',
                "Viewed archived patients list (Total: " . count($patients) . " patients)"
            );
        }
        
        return response()->json($patients);
    }
}
