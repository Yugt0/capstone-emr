<?php

namespace App\Models;

use App\Models\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VaccineList extends Model
{
   use HasFactory, Auditable;

    protected $fillable = [
        'date_received',
        'product',
        'beginning_balance',
        'delivery',
        'consumption',
        'stock_trasfer_in',
        'stock_trasfer_out',
        'expiration_date',
        'remaining_balance',
    ];

}
