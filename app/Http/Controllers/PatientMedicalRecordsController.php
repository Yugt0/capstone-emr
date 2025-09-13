<?php

namespace App\Http\Controllers;

use App\Models\PatientMedicalRecords as MedicalRecord;
use App\Services\AuditLogService;
use Illuminate\Http\Request;

class PatientMedicalRecordsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = MedicalRecord::with('patient');
        
        // Filter by patient_id if provided
        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }
        
        $records = $query->orderBy('created_at', 'desc')->get();
        return response()->json($records);
    }

    /**
     * Get medical records by patient ID
     */
    public function getByPatient($patientId)
    {
        $records = MedicalRecord::where('patient_id', $patientId)
            ->with('patient')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($records);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $record = MedicalRecord::create($request->all());
        
        // Log the creation with detailed description
        if (auth()->check()) {
            AuditLogService::logCreated(
                'PatientMedicalRecords',
                $record->id,
                "Added new medical record for patient ID: {$record->patient_id}",
                $record->toArray()
            );
        } else {
            AuditLogService::logSystemActivity(
                'Created',
                'PatientMedicalRecords',
                $record->id,
                "Added new medical record for patient ID: {$record->patient_id}",
                null,
                $record->toArray()
            );
        }
        
        return response()->json($record, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $record = MedicalRecord::with('patient')->findOrFail($id);
        return response()->json($record);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PatientMedicalRecords $patientMedicalRecords)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $record = MedicalRecord::findOrFail($id);
        $oldData = $record->toArray();
        $record->update($request->all());
        
        // Log the update with detailed description
        if (auth()->check()) {
            AuditLogService::logUpdated(
                'PatientMedicalRecords',
                $id,
                "Updated medical record for patient ID: {$record->patient_id}",
                $oldData,
                $record->getChanges()
            );
        } else {
            AuditLogService::logSystemActivity(
                'Updated',
                'PatientMedicalRecords',
                $id,
                "Updated medical record for patient ID: {$record->patient_id}",
                $oldData,
                $record->getChanges()
            );
        }
        
        return response()->json($record);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $record = MedicalRecord::findOrFail($id);
        $patientId = $record->patient_id;
        $record->delete();
        
        // Log the deletion with detailed description
        if (auth()->check()) {
            AuditLogService::logDeleted(
                'PatientMedicalRecords',
                $id,
                "Deleted medical record for patient ID: {$patientId}",
                ['patient_id' => $patientId, 'record_id' => $id]
            );
        } else {
            AuditLogService::logSystemActivity(
                'Deleted',
                'PatientMedicalRecords',
                $id,
                "Deleted medical record for patient ID: {$patientId}",
                ['patient_id' => $patientId, 'record_id' => $id],
                null
            );
        }
        
        return response()->json(null, 204);
    }
}
