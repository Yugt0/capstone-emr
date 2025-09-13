<?php

namespace App\Models;

use App\Models\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Outcome extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'patient_id',
        'mam_admitted_sfp',
        'mam_cured',
        'mam_defaulted',
        'mam_died',
        'sam_admitted_otc',
        'sam_cured',
        'sam_defaulted',
        'sam_died',
        'remarks',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }
} 