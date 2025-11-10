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
        
        // Audit logging is handled automatically by the Auditable trait
        
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
        $vaccineList->update($request->all());
        
        // Audit logging is handled automatically by the Auditable trait
        
        return response()->json($vaccineList);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $vaccineList = VaccineList::findOrFail($id);
        $vaccineList->delete();
        
        // Audit logging is handled automatically by the Auditable trait
        
        return response()->json(null, 204);
    }

    /**
     * Use/Consume vaccine (custom operation)
     */
    public function useVaccine(Request $request, string $id)
    {
        $vaccineList = VaccineList::findOrFail($id);
        
        // Update the vaccine first
        $vaccineList->update($request->all());
        
        // Log the use activity manually since it's not a standard CRUD operation
        if (auth()->check()) {
            $user = auth()->user();
            \Log::info('VaccineListController: Logging use activity', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'vaccine_id' => $id,
                'product' => $vaccineList->product,
                'quantity' => $request->quantity
            ]);
            
            AuditLogService::log(
                'Used',
                'VaccineList',
                $id,
                "Used vaccine: {$vaccineList->product} - Used quantity: {$request->quantity}, Remaining: " . $vaccineList->remaining_balance,
                null,
                null,
                $request
            );
        } else {
            \Log::warning('VaccineListController: No authenticated user for use activity');
            AuditLogService::logSystemActivity(
                'Used',
                'VaccineList',
                $id,
                "Used vaccine: {$vaccineList->product} - Used quantity: {$request->quantity}, Remaining: " . $vaccineList->remaining_balance
            );
        }
        
        return response()->json($vaccineList);
    }
}
