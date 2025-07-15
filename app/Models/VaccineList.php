<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VaccineList extends Model
{
   use HasFactory;

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
