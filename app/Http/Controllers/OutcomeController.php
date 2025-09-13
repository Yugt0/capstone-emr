<?php

namespace App\Http\Controllers;

use App\Models\Outcome;
use Illuminate\Http\Request;
use App\Services\AuditLogService;

class OutcomeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $outcomes = Outcome::with('patient')->get();
            
            // Log the view activity for outcomes list
            if (auth()->check()) {
                AuditLogService::logViewed(
                    'Outcome',
                    'list',
                    "Viewed outcomes list (Total: " . count($outcomes) . " records)"
                );
            } else {
                AuditLogService::logSystemActivity(
                    'Viewed',
                    'Outcome',
                    'list',
                    "Viewed outcomes list (Total: " . count($outcomes) . " records)"
                );
            }
            
            return response()->json($outcomes)
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

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            // Log the incoming data for debugging
            \Log::info('Outcome store request data:', $request->all());
            
            // Get all data and clean it up
            $data = $request->all();
            
            // Handle enum fields - convert to proper values
            $data = $this->normalizeOutcomeData($data);
            
            // Remove any null or empty values to avoid validation issues
            $data = array_filter($data, function($value) {
                return $value !== null && $value !== '';
            });
            
            \Log::info('Cleaned outcome data for creation:', $data);
            
            $outcome = Outcome::create($data);
            
            // Log the creation with detailed description
            if (auth()->check()) {
                AuditLogService::logCreated(
                    'Outcome',
                    $outcome->id,
                    "Added new outcome record for patient ID: {$outcome->patient_id}",
                    $outcome->toArray()
                );
            } else {
                AuditLogService::logSystemActivity(
                    'Created',
                    'Outcome',
                    $outcome->id,
                    "Added new outcome record for patient ID: {$outcome->patient_id}",
                    null,
                    $outcome->toArray()
                );
            }
            
            \Log::info('Outcome record created successfully:', $outcome->toArray());
            
            return response()->json($outcome, 201)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
        } catch (\Exception $e) {
            \Log::error('Outcome store error:', [
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
     * Display the specified resource.
     */
    public function show($id)
    {
        try {
            $outcome = Outcome::with('patient')->findOrFail($id);
            
            // Log the view activity
            if (auth()->check()) {
                AuditLogService::logViewed(
                    'Outcome',
                    $id,
                    "Viewed outcome record for patient ID: {$outcome->patient_id}"
                );
            } else {
                AuditLogService::logSystemActivity(
                    'Viewed',
                    'Outcome',
                    $id,
                    "Viewed outcome record for patient ID: {$outcome->patient_id}"
                );
            }
            
            return response()->json($outcome)
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

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        try {
            // Log the incoming data for debugging
            \Log::info('Outcome update request data:', $request->all());
            
            $outcome = Outcome::findOrFail($id);
            $oldData = $outcome->toArray();
            
            // Get all data and clean it up
            $data = $request->all();
            
            // Handle enum fields - convert to proper values
            $data = $this->normalizeOutcomeData($data);
            
            // Remove any null or empty values to avoid validation issues
            $data = array_filter($data, function($value) {
                return $value !== null && $value !== '';
            });
            
            \Log::info('Cleaned outcome data for update:', $data);
            
            $outcome->update($data);
            
            // Log the update with detailed description
            if (auth()->check()) {
                AuditLogService::logUpdated(
                    'Outcome',
                    $id,
                    "Updated outcome record for patient ID: {$outcome->patient_id}",
                    $oldData,
                    $outcome->getChanges()
                );
            } else {
                AuditLogService::logSystemActivity(
                    'Updated',
                    'Outcome',
                    $id,
                    "Updated outcome record for patient ID: {$outcome->patient_id}",
                    $oldData,
                    $outcome->getChanges()
                );
            }
            
            \Log::info('Outcome record updated successfully:', $outcome->toArray());
            
            return response()->json($outcome, 200)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
        } catch (\Exception $e) {
            \Log::error('Outcome update error:', [
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
        try {
            $outcome = Outcome::findOrFail($id);
            $patientId = $outcome->patient_id;
            $outcome->delete();
            
            // Log the deletion with detailed description
            if (auth()->check()) {
                AuditLogService::logDeleted(
                    'Outcome',
                    $id,
                    "Deleted outcome record for patient ID: {$patientId}",
                    ['patient_id' => $patientId, 'record_id' => $id]
                );
            } else {
                AuditLogService::logSystemActivity(
                    'Deleted',
                    'Outcome',
                    $id,
                    "Deleted outcome record for patient ID: {$patientId}",
                    ['patient_id' => $patientId, 'record_id' => $id],
                    null
                );
            }
            
            return response()->json(null, 204)
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

    /**
     * Get outcomes by patient ID
     */
    public function getByPatient($patientId)
    {
        try {
            $data = Outcome::where('patient_id', $patientId)->with('patient')->first();
            return response()->json($data)
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
    
    /**
     * Normalize outcome data to match enum constraints
     */
    private function normalizeOutcomeData($data)
    {
        $enumFields = [
            'mam_admitted_sfp',
            'mam_cured', 
            'mam_defaulted',
            'mam_died',
            'sam_admitted_otc',
            'sam_cured',
            'sam_defaulted',
            'sam_died'
        ];
        
        foreach ($enumFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = $this->normalizeYesNo($data[$field]);
            }
        }
        
        return $data;
    }
    
    /**
     * Normalize Yes/No values to match enum constraints
     */
    private function normalizeYesNo($value)
    {
        if (!$value) return null;
        
        $value = strtoupper(trim($value));
        
        if (in_array($value, ['YES', 'Y', '1', 'TRUE'])) {
            return 'Yes';
        }
        if (in_array($value, ['NO', 'N', '0', 'FALSE'])) {
            return 'No';
        }
        
        return null;
    }
} 