<?php

namespace App\Http\Controllers;

use App\Models\Nutrition12Months;
use Illuminate\Http\Request;
use App\Services\AuditLogService;

class Nutrition12MonthsController extends Controller
{
    public function index()
    {
        $nutritionRecords = Nutrition12Months::with('patient')->get();
        
        // Log the view activity for nutrition 12 months list
        if (auth()->check()) {
            AuditLogService::logViewed(
                'Nutrition12Months',
                'list',
                "Viewed nutrition 12 months list (Total: " . count($nutritionRecords) . " records)"
            );
        } else {
            AuditLogService::logSystemActivity(
                'Viewed',
                'Nutrition12Months',
                'list',
                "Viewed nutrition 12 months list (Total: " . count($nutritionRecords) . " records)"
            );
        }
        
        return response()->json($nutritionRecords)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
    }

    public function store(Request $request)
    {
        try {
            // Log the incoming data for debugging
            \Log::info('Nutrition store request data:', $request->all());
            
            // Get all data and clean it up
            $data = $request->all();
            
            // Handle enum fields - convert to proper values
            if (isset($data['status'])) {
                $data['status'] = $this->normalizeStatus($data['status']);
            }
            if (isset($data['status_12'])) {
                $data['status_12'] = $this->normalizeStatus($data['status_12']);
            }
            if (isset($data['exclusively_breastfed'])) {
                $data['exclusively_breastfed'] = $this->normalizeYesNo($data['exclusively_breastfed']);
            }
            if (isset($data['complementary_feeding'])) {
                $data['complementary_feeding'] = $this->normalizeYesNo($data['complementary_feeding']);
            }
            
            // Remove any null or empty values to avoid validation issues
            $data = array_filter($data, function($value) {
                return $value !== null && $value !== '';
            });
            
            \Log::info('Cleaned nutrition data for creation:', $data);
            
            $record = Nutrition12Months::create($data);
            
            // Audit logging is handled automatically by the Auditable trait
            
            \Log::info('Nutrition record created successfully:', $record->toArray());
            
            return response()->json($record, 201)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
        } catch (\Exception $e) {
            \Log::error('Nutrition store error:', [
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
        $record = Nutrition12Months::with('patient')->findOrFail($id);
        
        // Log the view activity
        if (auth()->check()) {
            AuditLogService::logViewed(
                'Nutrition12Months',
                $id,
                "Viewed nutrition 12 months record for patient ID: {$record->patient_id}"
            );
        } else {
            AuditLogService::logSystemActivity(
                'Viewed',
                'Nutrition12Months',
                $id,
                "Viewed nutrition 12 months record for patient ID: {$record->patient_id}"
            );
        }
        
        return response()->json($record)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
    }

    public function update(Request $request, $id)
    {
        try {
            // Log the incoming data for debugging
            \Log::info('Nutrition update request data:', $request->all());
            
            $record = Nutrition12Months::findOrFail($id);
            $oldData = $record->toArray();
            
            // Get all data and clean it up
            $data = $request->all();
            
            // Handle enum fields - convert to proper values
            if (isset($data['status'])) {
                $data['status'] = $this->normalizeStatus($data['status']);
            }
            if (isset($data['status_12'])) {
                $data['status_12'] = $this->normalizeStatus($data['status_12']);
            }
            if (isset($data['exclusively_breastfed'])) {
                $data['exclusively_breastfed'] = $this->normalizeYesNo($data['exclusively_breastfed']);
            }
            if (isset($data['complementary_feeding'])) {
                $data['complementary_feeding'] = $this->normalizeYesNo($data['complementary_feeding']);
            }
            
            // Remove any null or empty values to avoid validation issues
            $data = array_filter($data, function($value) {
                return $value !== null && $value !== '';
            });
            
            \Log::info('Cleaned nutrition data for update:', $data);
            
            $record->update($data);
            
            // Audit logging is handled automatically by the Auditable trait
            
            \Log::info('Nutrition record updated successfully:', $record->toArray());
            
            return response()->json($record, 200)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
        } catch (\Exception $e) {
            \Log::error('Nutrition update error:', [
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
     * Normalize status values to match enum constraints
     */
    private function normalizeStatus($status)
    {
        if (!$status) return null;
        
        $status = strtoupper(trim($status));
        
        // Map various status inputs to enum values
        $statusMap = [
            'S' => 'S',
            'STUNTED' => 'S',
            'W-MAM' => 'W-MAM',
            'W-MAM' => 'W-MAM',
            'W-SAM' => 'W-SAM',
            'W-SAM' => 'W-SAM',
            'O' => 'O',
            'OBESE' => 'O',
            'OVERWEIGHT' => 'O',
            'N' => 'N',
            'NORMAL' => 'N',
        ];
        
        return $statusMap[$status] ?? null;
    }
    
    /**
     * Normalize Yes/No values to match enum constraints
     */
    private function normalizeYesNo($value)
    {
        if (!$value) return null;
        
        $value = strtoupper(trim($value));
        
        if (in_array($value, ['Y', 'YES', '1'])) {
            return 'Y';
        }
        if (in_array($value, ['N', 'NO', '0'])) {
            return 'N';
        }
        
        return null;
    }

    public function destroy($id)
    {
        $record = Nutrition12Months::findOrFail($id);
        $record->delete();
        
        // Audit logging is handled automatically by the Auditable trait
        
        return response()->json(null, 204)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
    }

    /**
     * Get nutrition 12 months data by patient ID
     */
    public function getByPatient($patientId)
    {
        try {
            $data = Nutrition12Months::where('patient_id', $patientId)->with('patient')->first();
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
} 