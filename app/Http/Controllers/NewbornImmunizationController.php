<?php

namespace App\Http\Controllers;

use App\Models\NewbornImmunization;
use Illuminate\Http\Request;

class NewbornImmunizationController extends Controller
{
    public function index()
    {
        return response()->json(NewbornImmunization::with('patient')->get())
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
    }

    public function store(Request $request)
    {
        $record = NewbornImmunization::create($request->all());
        return response()->json($record, 201)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, X-Token-Auth, Authorization, Accept, Origin');
    }

    public function show($id)
    {
        return NewbornImmunization::with('patient')->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $record = NewbornImmunization::findOrFail($id);
        $record->update($request->all());
        return response()->json($record, 200);
    }

    public function destroy($id)
    {
        NewbornImmunization::destroy($id);
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
} 