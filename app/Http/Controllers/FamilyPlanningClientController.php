<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\FamilyPlanningClient;

class FamilyPlanningClientController extends Controller
{
    // List all clients
    public function index()
    {
        return FamilyPlanningClient::all();
    }

    // Store a new client
    public function store(Request $request)
    {
        $validated = $request->validate([
            'registration_date' => 'required|date',
            'family_serial' => 'required|string',
            'name' => 'required|string',
            'address' => 'required|string',
            'dob' => 'required|date',
            'type' => 'required|string',
            'source' => 'required|string',
            'previous_method' => 'nullable|string',
            'follow_up' => 'nullable|array',
            'drop_out_date' => 'nullable|date',
            'drop_out_reason' => 'nullable|string',
            'deworming' => 'nullable|array',
            'remarks' => 'nullable|string',
        ]);
        $validated['follow_up'] = json_encode($validated['follow_up'] ?? []);
        $validated['deworming'] = json_encode($validated['deworming'] ?? []);
        $client = FamilyPlanningClient::create($validated);
        return response()->json($client, 201);
    }

    // Show a single client
    public function show($id)
    {
        return FamilyPlanningClient::findOrFail($id);
    }

    // Update a client
    public function update(Request $request, $id)
    {
        $client = FamilyPlanningClient::findOrFail($id);
        $validated = $request->validate([
            'registration_date' => 'required|date',
            'family_serial' => 'required|string',
            'name' => 'required|string',
            'address' => 'required|string',
            'dob' => 'required|date',
            'type' => 'required|string',
            'source' => 'required|string',
            'previous_method' => 'nullable|string',
            'follow_up' => 'nullable|array',
            'drop_out_date' => 'nullable|date',
            'drop_out_reason' => 'nullable|string',
            'deworming' => 'nullable|array',
            'remarks' => 'nullable|string',
        ]);
        $validated['follow_up'] = json_encode($validated['follow_up'] ?? []);
        $validated['deworming'] = json_encode($validated['deworming'] ?? []);
        $client->update($validated);
        return response()->json($client);
    }

    // Delete a client
    public function destroy($id)
    {
        $client = FamilyPlanningClient::findOrFail($id);
        $client->delete();
        return response()->json(null, 204);
    }
} 