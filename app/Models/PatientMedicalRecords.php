<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\PatientInformation;
use App\Models\Traits\Auditable;


class PatientMedicalRecords extends Model
{
    use HasFactory, Auditable;

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
        'medicine_takes',
    ];

    public function patient()
    {
        return $this->belongsTo(PatientInformation::class, 'patient_id');
    }
}
