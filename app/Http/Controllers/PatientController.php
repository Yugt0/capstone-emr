<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    public function index()
    {
        try {
            return response()->json(Patient::all())
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
        return response()->json($patient, 201);
    }

    public function show($id)
    {
        try {
            return Patient::findOrFail($id);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $patient = Patient::findOrFail($id);
        $patient->update($request->all());
        return response()->json($patient, 200);
    }

    public function destroy($id)
    {
        Patient::destroy($id);
        return response()->json(null, 204);
    }
} 