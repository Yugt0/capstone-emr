<?php

namespace App\Models;

use App\Models\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'registration_no',
        'registration_date',
        'birth_date',
        'family_serial_number',
        'child_name',
        'sex',
        'mother_name',
        'address',
        'cpab_8a',
        'cpab_8b',
        'archived',
        'archived_at',
    ];

    public function newbornImmunization()
    {
        return $this->hasOne(NewbornImmunization::class);
    }

    public function nutrition12Months()
    {
        return $this->hasOne(Nutrition12Months::class);
    }

    public function outcome()
    {
        return $this->hasOne(Outcome::class);
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