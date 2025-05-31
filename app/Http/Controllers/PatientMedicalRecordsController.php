<?php

namespace App\Http\Controllers;

use App\Models\PatientMedicalRecords as MedicalRecord;
use Illuminate\Http\Request;

class PatientMedicalRecordsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $records = MedicalRecord::with('patient')->get();
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
        $record->update($request->all());
        return response()->json($record);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $record = MedicalRecord::findOrFail($id);
        $record->delete();
        return response()->json(null, 204);
    }
}
