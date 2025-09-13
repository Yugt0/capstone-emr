<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContraceptiveInventory;
use Illuminate\Http\Request;

class ContraceptiveInventoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $contraceptives = ContraceptiveInventory::all();
        return response()->json($contraceptives);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'contraceptive_name' => 'required|string|max:255',
            'contraceptive_type' => 'required|string|max:255',
            'batch_number' => 'required|string|max:255',
            'quantity' => 'required|integer|min:0',
            'expiration_date' => 'required|date'
        ]);

        $contraceptive = ContraceptiveInventory::create($request->all());
        return response()->json($contraceptive, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $contraceptive = ContraceptiveInventory::findOrFail($id);
        return response()->json($contraceptive);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'contraceptive_name' => 'required|string|max:255',
            'contraceptive_type' => 'required|string|max:255',
            'batch_number' => 'required|string|max:255',
            'quantity' => 'required|integer|min:0',
            'expiration_date' => 'required|date'
        ]);

        $contraceptive = ContraceptiveInventory::findOrFail($id);
        $contraceptive->update($request->all());
        return response()->json($contraceptive);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $contraceptive = ContraceptiveInventory::findOrFail($id);
        $contraceptive->delete();
        return response()->json(null, 204);
    }
}
