<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\VaccineList;

class VaccineListController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $vaccineLists = VaccineList::all();
        return response()->json($vaccineLists);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $vaccineList = VaccineList::create($request->all());
        return response()->json($vaccineList, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $vaccineList = VaccineList::findOrFail($id);
        return response()->json($vaccineList);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $vaccineList = VaccineList::findOrFail($id);
        $vaccineList->update($request->all());
        return response()->json($vaccineList);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $vaccineList = VaccineList::findOrFail($id);
        $vaccineList->delete();
        return response()->json(null, 204);
    }
}
