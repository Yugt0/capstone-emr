<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class PatientMedicalRecords extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'temperature',
        'patient_history',
        'age',
        'respiratory_rate',
        'chief_complaint',
        'cardiac_rate',
        'date_recorded',
        'weight',
        'blood_pressure',
        'history_of_present_illness',
        'assessment',
        'plan',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }
}
