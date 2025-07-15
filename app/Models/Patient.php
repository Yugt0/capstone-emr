<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    use HasFactory;

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
} 