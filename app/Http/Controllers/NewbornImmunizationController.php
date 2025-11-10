<?php

namespace App\Http\Controllers;

use App\Models\NewbornImmunization;
use Illuminate\Http\Request;
use App\Services\AuditLogService;

class NewbornImmunizationController extends Controller
{
    public function index()
    {
        $newbornImmunizations = NewbornImmunization::with('patient')->get();
        
        // Log the view activity for newborn immunizations list
        if (auth()->check()) {
            AuditLogService::logViewed(
                'NewbornImmunization',
                'list',
                "Viewed newborn immunizations list (Total: " . count($newbornImmunizations) . " records)"
            );
        } else {
            AuditLogService::logSystemActivity(
                'Viewed',
                'NewbornImmunization',
                'list',
                "Viewed newborn immunizations list (Total: " . count($newbornImmunizations) . " records)"
            );
        }
        
        return response()->json($newbornImmunizations)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
    }

    public function store(Request $request)
    {
        try {
            // Log the incoming data for debugging
            \Log::info('Newborn store request data:', $request->all());
            
            // Clean and validate the data
            $data = $this->cleanNewbornData($request->all());
            
            $record = NewbornImmunization::create($data);
        
        // Audit logging is handled automatically by the Auditable trait
        
            return response()->json($record, 201)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
        } catch (\Exception $e) {
            \Log::error('Newborn store error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json(['error' => $e->getMessage()], 500)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
        }
    }

    public function show($id)
    {
        $record = NewbornImmunization::with('patient')->findOrFail($id);
        
        // Log the view activity
        if (auth()->check()) {
            AuditLogService::logViewed(
                'NewbornImmunization',
                $id,
                "Viewed newborn immunization record for patient ID: {$record->patient_id}"
            );
        } else {
            AuditLogService::logSystemActivity(
                'Viewed',
                'NewbornImmunization',
                $id,
                "Viewed newborn immunization record for patient ID: {$record->patient_id}"
            );
        }
        
        return response()->json($record);
    }

    public function update(Request $request, $id)
    {
        try {
            // Log the incoming data for debugging
            \Log::info('Newborn update request data:', $request->all());
            
            // Clean and validate the data
            $data = $this->cleanNewbornData($request->all());
            
            $record = NewbornImmunization::findOrFail($id);
            $record->update($data);
        
        // Audit logging is handled automatically by the Auditable trait
        
            return response()->json($record, 200);
        } catch (\Exception $e) {
            \Log::error('Newborn update error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $record = NewbornImmunization::findOrFail($id);
        $record->delete();
        
        // Audit logging is handled automatically by the Auditable trait
        
        return response()->json(null, 204);
    }

    /**
     * Get newborn immunization data by patient ID
     */
    public function getByPatient($patientId)
    {
        try {
            $data = NewbornImmunization::where('patient_id', $patientId)->with('patient')->first();
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
     * Clean and validate newborn data
     */
    private function cleanNewbornData($data)
    {
        // Clean weight_at_birth - remove any non-numeric characters and ensure it's a valid decimal
        if (isset($data['weight_at_birth']) && $data['weight_at_birth'] !== null) {
            $weight = $data['weight_at_birth'];
            // Remove any non-numeric characters except decimal point
            $weight = preg_replace('/[^0-9.]/', '', $weight);
            // Convert to float and ensure it's within valid range (0-99.99)
            $weight = floatval($weight);
            if ($weight > 99.99) {
                $weight = 99.99; // Cap at maximum allowed value
            }
            $data['weight_at_birth'] = $weight > 0 ? $weight : null;
        }
        
        // Clean length_at_birth - remove any non-numeric characters
        if (isset($data['length_at_birth']) && $data['length_at_birth'] !== null) {
            $length = $data['length_at_birth'];
            // Remove any non-numeric characters except decimal point
            $length = preg_replace('/[^0-9.]/', '', $length);
            $data['length_at_birth'] = $length ?: null;
        }
        
        // Clean age_in_months - ensure it's an integer
        if (isset($data['age_in_months']) && $data['age_in_months'] !== null) {
            $age = intval($data['age_in_months']);
            $data['age_in_months'] = $age > 0 ? $age : null;
        }
        
        // Clean date fields - ensure they're valid dates or null
        $dateFields = [
            'breast_feeding_date', 'bcg_date', 'hepa_b_bd_date',
            'iron_1mo_date', 'iron_2mo_date', 'iron_3mo_date',
            'dpt_hib_hepb_1st', 'dpt_hib_hepb_2nd', 'dpt_hib_hepb_3rd',
            'opv_1st', 'opv_2nd', 'opv_3rd',
            'pcv_1st', 'pcv_2nd', 'pcv_3rd', 'ipv_1st'
        ];
        
        foreach ($dateFields as $field) {
            if (isset($data[$field]) && $data[$field] !== null) {
                // If it's an empty string, set to null
                if ($data[$field] === '') {
                    $data[$field] = null;
                } else {
                    // Try to parse the date
                    try {
                        $date = new \DateTime($data[$field]);
                        $data[$field] = $date->format('Y-m-d');
                    } catch (\Exception $e) {
                        $data[$field] = null;
                    }
                }
            }
        }
        
        // Remove any null or empty values to avoid validation issues
        $data = array_filter($data, function($value) {
            return $value !== null && $value !== '';
        });
        
        \Log::info('Cleaned newborn data:', $data);
        
        return $data;
    }
} 