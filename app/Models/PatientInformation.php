<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PatientInformation extends Model
{
    use HasFactory;

    protected $fillable = [
        'full_name',
        'birth_date',
        'gender',
        'contact_number',
        'address',
        'barangay',
    ];

    public function medicalRecords()
    {
        return $this->hasMany(MedicalRecord::class);
    }   

}
