<?php

namespace App\Models;

use App\Models\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ContraceptiveInventory extends Model
{
    use HasFactory, Auditable;
    
    protected $table = 'contraceptive_inventory';
    
    protected $fillable = [
        'contraceptive_name',
        'contraceptive_type',
        'batch_number',
        'quantity',
        'expiration_date'
    ];

    protected $casts = [
        'expiration_date' => 'date',
        'quantity' => 'integer'
    ];
}
