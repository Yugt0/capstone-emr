<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContraceptiveInventory;
use App\Services\AuditLogService;
use Illuminate\Http\Request;

class ContraceptiveInventoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $contraceptives = ContraceptiveInventory::all();
        
        // Log the view activity for contraceptive list
        if (auth()->check()) {
            AuditLogService::logViewed(
                'ContraceptiveInventory',
                'list',
                "Viewed contraceptive inventory (Total: " . count($contraceptives) . " contraceptives)"
            );
        } else {
            AuditLogService::logSystemActivity(
                'Viewed',
                'ContraceptiveInventory',
                'list',
                "Viewed contraceptive inventory (Total: " . count($contraceptives) . " contraceptives)"
            );
        }
        
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
        
        // Audit logging is handled automatically by the Auditable trait
        
        return response()->json($contraceptive, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $contraceptive = ContraceptiveInventory::findOrFail($id);
        
        // Log the view activity
        if (auth()->check()) {
            AuditLogService::logViewed(
                'ContraceptiveInventory',
                $id,
                "Viewed contraceptive details: {$contraceptive->contraceptive_name}"
            );
        } else {
            AuditLogService::logSystemActivity(
                'Viewed',
                'ContraceptiveInventory',
                $id,
                "Viewed contraceptive details: {$contraceptive->contraceptive_name}"
            );
        }
        
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
        
        // Audit logging is handled automatically by the Auditable trait
        
        return response()->json($contraceptive);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $contraceptive = ContraceptiveInventory::findOrFail($id);
        $contraceptive->delete();
        
        // Audit logging is handled automatically by the Auditable trait
        
        return response()->json(null, 204);
    }

    /**
     * Use/Consume contraceptive (custom operation)
     */
    public function useContraceptive(Request $request, string $id)
    {
        $contraceptive = ContraceptiveInventory::findOrFail($id);
        
        // Update the contraceptive first
        $contraceptive->update($request->all());
        
        // Log the use activity manually since it's not a standard CRUD operation
        if (auth()->check()) {
            $user = auth()->user();
            \Log::info('ContraceptiveInventoryController: Logging use activity', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'contraceptive_id' => $id,
                'contraceptive_name' => $contraceptive->contraceptive_name,
                'quantity' => $request->quantity
            ]);
            
            AuditLogService::log(
                'Used',
                'ContraceptiveInventory',
                $id,
                "Used contraceptive: {$contraceptive->contraceptive_name} - Used quantity: {$request->quantity}, Remaining: " . $contraceptive->quantity,
                null,
                null,
                $request
            );
        } else {
            \Log::warning('ContraceptiveInventoryController: No authenticated user for use activity');
            AuditLogService::logSystemActivity(
                'Used',
                'ContraceptiveInventory',
                $id,
                "Used contraceptive: {$contraceptive->contraceptive_name} - Used quantity: {$request->quantity}, Remaining: " . $contraceptive->quantity
            );
        }
        
        return response()->json($contraceptive);
    }
}
