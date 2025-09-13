<?php

namespace App\Http\Controllers;

use App\Services\AuditLogService;
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
        
        // Log the view activity for vaccine list
        if (auth()->check()) {
            AuditLogService::logViewed(
                'VaccineList',
                'list',
                "Viewed vaccine list (Total: " . count($vaccineLists) . " vaccines)"
            );
        } else {
            AuditLogService::logSystemActivity(
                'Viewed',
                'VaccineList',
                'list',
                "Viewed vaccine list (Total: " . count($vaccineLists) . " vaccines)"
            );
        }
        
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
        
        // Log the creation with detailed description
        if (auth()->check()) {
            AuditLogService::logCreated(
                'VaccineList',
                $vaccineList->id,
                "Added new vaccine: {$vaccineList->product} (Quantity: {$vaccineList->delivery})",
                $vaccineList->toArray()
            );
        } else {
            AuditLogService::logSystemActivity(
                'Created',
                'VaccineList',
                $vaccineList->id,
                "Added new vaccine: {$vaccineList->product} (Quantity: {$vaccineList->delivery})",
                null,
                $vaccineList->toArray()
            );
        }
        
        return response()->json($vaccineList, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $vaccineList = VaccineList::findOrFail($id);
        
        // Log the view activity
        if (auth()->check()) {
            AuditLogService::logViewed(
                'VaccineList',
                $id,
                "Viewed vaccine details: {$vaccineList->product}"
            );
        } else {
            AuditLogService::logSystemActivity(
                'Viewed',
                'VaccineList',
                $id,
                "Viewed vaccine details: {$vaccineList->product}"
            );
        }
        
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
        $oldData = $vaccineList->toArray();
        $vaccineList->update($request->all());
        
        // Log the update with detailed description
        if (auth()->check()) {
            AuditLogService::logUpdated(
                'VaccineList',
                $id,
                "Updated vaccine: {$vaccineList->product}",
                $oldData,
                $vaccineList->getChanges()
            );
        } else {
            AuditLogService::logSystemActivity(
                'Updated',
                'VaccineList',
                $id,
                "Updated vaccine: {$vaccineList->product}",
                $oldData,
                $vaccineList->getChanges()
            );
        }
        
        return response()->json($vaccineList);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $vaccineList = VaccineList::findOrFail($id);
        $productName = $vaccineList->product;
        $vaccineList->delete();
        
        // Log the deletion with detailed description
        if (auth()->check()) {
            AuditLogService::logDeleted(
                'VaccineList',
                $id,
                "Deleted vaccine: {$productName}",
                ['product' => $productName]
            );
        } else {
            AuditLogService::logSystemActivity(
                'Deleted',
                'VaccineList',
                $id,
                "Deleted vaccine: {$productName}",
                ['product' => $productName],
                null
            );
        }
        
        return response()->json(null, 204);
    }
}
