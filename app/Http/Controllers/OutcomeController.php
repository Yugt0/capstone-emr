<?php

namespace App\Http\Controllers;

use App\Models\Outcome;
use Illuminate\Http\Request;

class OutcomeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            return response()->json(Outcome::with('patient')->get())
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
            return response()->json(Outcome::with('patient')->findOrFail($id))
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
            $outcome->delete();
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