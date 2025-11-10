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
        
        // Audit logging is handled automatically by the Auditable trait
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
        try {
            // Log the incoming data for debugging
            \Log::info('Medical record update request data:', $request->all());
            
            $record = MedicalRecord::findOrFail($id);
            $oldData = $record->toArray();
            
            // Get all data and clean it up
            $data = $request->all();
            
            // Remove any null or empty values to avoid validation issues
            $data = array_filter($data, function($value) {
                return $value !== null && $value !== '';
            });
            
            \Log::info('Cleaned medical record data for update:', $data);
            
            $record->update($data);
            
            // Audit logging is handled automatically by the Auditable trait
            
            \Log::info('Medical record updated successfully:', $record->toArray());
            
            return response()->json($record, 200)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
        } catch (\Exception $e) {
            \Log::error('Medical record update error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json(['error' => $e->getMessage()], 500)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $record = MedicalRecord::findOrFail($id);
        $record->delete();
        
        // Audit logging is handled automatically by the Auditable trait
        return response()->json(null, 204);
    }
}
