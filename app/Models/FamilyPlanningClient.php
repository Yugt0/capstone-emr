<?php

namespace App\Models;

use App\Models\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FamilyPlanningClient extends Model
{
    use HasFactory, Auditable;

    protected $table = 'family_planning_clients';

    protected $fillable = [
        'registration_date',
        'family_serial',
        'name',
        'address',
        'dob',
        'type',
        'source',
        'previous_method',
        'follow_up',
        'drop_out_date',
        'drop_out_reason',
        'deworming',
        'remarks',
    ];

    protected $casts = [
        'follow_up' => 'array',
        'deworming' => 'array',
        'registration_date' => 'date',
        'dob' => 'date',
        'drop_out_date' => 'date',
    ];
} 