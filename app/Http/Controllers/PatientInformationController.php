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
        $patients = Patient::all();
        
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
        
        // Log the creation with detailed description
        if (auth()->check()) {
            AuditLogService::logCreated(
                'PatientInformation',
                $patient->id,
                "Added new patient: {$patient->full_name} (ID: {$patient->id})",
                $patient->toArray()
            );
        } else {
            AuditLogService::logSystemActivity(
                'Created',
                'PatientInformation',
                $patient->id,
                "Added new patient: {$patient->full_name} (ID: {$patient->id})",
                null,
                $patient->toArray()
            );
        }
        
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
        $oldData = $patient->toArray();
        $patient->update($request->all());
        
        // Log the update with detailed description
        if (auth()->check()) {
            AuditLogService::logUpdated(
                'PatientInformation',
                $id,
                "Updated patient: {$patient->full_name}",
                $oldData,
                $patient->getChanges()
            );
        } else {
            AuditLogService::logSystemActivity(
                'Updated',
                'PatientInformation',
                $id,
                "Updated patient: {$patient->full_name}",
                $oldData,
                $patient->getChanges()
            );
        }
        
        return response()->json($patient);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $patient = Patient::findOrFail($id);
        $patientName = $patient->full_name;
        $patient->delete();
        
        // Log the deletion with detailed description
        if (auth()->check()) {
            AuditLogService::logDeleted(
                'PatientInformation',
                $id,
                "Deleted patient: {$patientName}",
                ['full_name' => $patientName, 'id' => $id]
            );
        } else {
            AuditLogService::logSystemActivity(
                'Deleted',
                'PatientInformation',
                $id,
                "Deleted patient: {$patientName}",
                ['full_name' => $patientName, 'id' => $id],
                null
            );
        }
        
        return response()->json(null, 204);
    }
}
