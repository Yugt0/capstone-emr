<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\PatientMedicalRecords;
use App\Models\Traits\Auditable;

class PatientInformation extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'first_name',
        'middle_name',
        'last_name',
        'birth_date',
        'gender',
        'contact_number',
        'address',      
        'barangay',
        'archived',
        'archived_at',
    ];

    public function medicalRecords()
    {
        return $this->hasMany(PatientMedicalRecords::class, 'patient_id');
    }

    /**
     * Get the full name by combining first, middle, and last name
     */
    public function getFullNameAttribute()
    {
        $parts = array_filter([
            $this->first_name,
            $this->middle_name,
            $this->last_name
        ]);
        
        return implode(' ', $parts);
    }

    /**
     * Scope to get only non-archived patients
     */
    public function scopeActive($query)
    {
        return $query->where('archived', false);
    }

    /**
     * Scope to get only archived patients
     */
    public function scopeArchived($query)
    {
        return $query->where('archived', true);
    }

    /**
     * Archive a patient
     */
    public function archive()
    {
        $this->update([
            'archived' => true,
            'archived_at' => now()
        ]);
    }

    /**
     * Unarchive a patient
     */
    public function unarchive()
    {
        $this->update([
            'archived' => false,
            'archived_at' => null
        ]);
    }

}
