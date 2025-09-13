<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'display_name',
        'description',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    /**
     * Get users with this role
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get all active roles
     */
    public static function getActiveRoles()
    {
        return static::where('is_active', true)->get();
    }

    /**
     * Find role by name
     */
    public static function findByName($name)
    {
        return static::where('name', $name)->first();
    }
} 