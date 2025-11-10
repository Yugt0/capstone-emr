<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContraceptiveList extends Model
{
    use HasFactory;

    protected $fillable = [
        'contraceptive_name',
        'contraceptive_type',
        'batch_number',
        'quantity',
        'expiration_date',
    ];

    protected $casts = [
        'expiration_date' => 'date',
    ];
}




