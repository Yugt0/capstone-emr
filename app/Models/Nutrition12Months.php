<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Nutrition12Months extends Model
{
    use HasFactory;

    protected $table = 'nutrition_12months';

    protected $fillable = [
        'patient_id',
        'age_in_months',
        'length_cm_date',
        'weight_kg_date',
        'status',
        'exclusively_breastfed',
        'complementary_feeding',
        'vitamin_a_date',
        'mnp_date',
        'mmr_1st_9mo',
        'ipv_2nd_9mo',
        'age_in_months_12',
        'length_cm_date_12',
        'weight_kg_date_12',
        'status_12',
        'mmr_2nd_12mo',
        'fic_date',
        'cic_date',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }
} 