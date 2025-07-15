<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NewbornImmunization extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'length_at_birth',
        'weight_at_birth',
        'birth_weight_status',
        'breast_feeding_date',
        'bcg_date',
        'hepa_b_bd_date',
        'age_in_months',
        'length_in_threes_months',
        'weight_in_threes_months',
        'status',
        'iron_1mo_date',
        'iron_2mo_date',
        'iron_3mo_date',
        'dpt_hib_hepb_1st',
        'dpt_hib_hepb_2nd',
        'dpt_hib_hepb_3rd',
        'opv_1st',
        'opv_2nd',
        'opv_3rd',
        'pcv_1st',
        'pcv_2nd',
        'pcv_3rd',
        'ipv_1st',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }
} 