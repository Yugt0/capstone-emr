<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class LoginAttempt extends Model
{
    protected $fillable = [
        'username',
        'ip_address',
        'attempts',
        'last_attempt_at',
        'locked_until'
    ];

    protected $casts = [
        'last_attempt_at' => 'datetime',
        'locked_until' => 'datetime'
    ];

    /**
     * Record a failed login attempt
     */
    public static function recordFailedAttempt($username, $ipAddress = null)
    {
        $attempt = self::where('username', $username)
            ->where('ip_address', $ipAddress)
            ->first();

        if ($attempt) {
            // Check if attempts should reset (1 hour has passed since first attempt)
            if ($attempt->last_attempt_at && $attempt->last_attempt_at->diffInHours(now()) >= 1) {
                // Reset attempts after 1 hour
                $attempt->update([
                    'attempts' => 1,
                    'last_attempt_at' => now(),
                    'locked_until' => null
                ]);
            } else {
                $attempt->increment('attempts');
                $attempt->update(['last_attempt_at' => now()]);
                
                // Lock for 10 minutes after 3 attempts
                if ($attempt->attempts >= 3) {
                    $attempt->update(['locked_until' => now()->addMinutes(10)]);
                }
            }
        } else {
            self::create([
                'username' => $username,
                'ip_address' => $ipAddress,
                'attempts' => 1,
                'last_attempt_at' => now()
            ]);
        }
    }

    /**
     * Clear failed attempts for successful login
     */
    public static function clearFailedAttempts($username, $ipAddress = null)
    {
        self::where('username', $username)
            ->where('ip_address', $ipAddress)
            ->delete();
    }

    /**
     * Check if user is locked out
     */
    public static function isLockedOut($username, $ipAddress = null)
    {
        $attempt = self::where('username', $username)
            ->where('ip_address', $ipAddress)
            ->first();

        if (!$attempt) {
            return false;
        }

        // Check if attempts should reset (1 hour has passed since last attempt)
        if ($attempt->last_attempt_at && $attempt->last_attempt_at->diffInHours(now()) >= 1) {
            // Reset attempts after 1 hour
            $attempt->update([
                'attempts' => 0,
                'locked_until' => null
            ]);
            return false;
        }

        // Check if lock has expired
        if ($attempt->locked_until && $attempt->locked_until->isPast()) {
            $attempt->delete();
            return false;
        }

        return $attempt->attempts >= 3 && $attempt->locked_until && $attempt->locked_until->isFuture();
    }

    /**
     * Get remaining lock time in minutes
     */
    public static function getRemainingLockTime($username, $ipAddress = null)
    {
        $attempt = self::where('username', $username)
            ->where('ip_address', $ipAddress)
            ->first();

        if (!$attempt || !$attempt->locked_until) {
            return 0;
        }

        return max(0, now()->diffInMinutes($attempt->locked_until, false));
    }

    /**
     * Get remaining attempts before lockout
     */
    public static function getRemainingAttempts($username, $ipAddress = null)
    {
        $attempt = self::where('username', $username)
            ->where('ip_address', $ipAddress)
            ->first();

        if (!$attempt) {
            return 3;
        }

        // Check if attempts should reset (1 hour has passed since last attempt)
        if ($attempt->last_attempt_at && $attempt->last_attempt_at->diffInHours(now()) >= 1) {
            // Reset attempts after 1 hour
            $attempt->update([
                'attempts' => 0,
                'locked_until' => null
            ]);
            return 3;
        }

        return max(0, 3 - $attempt->attempts);
    }

    /**
     * Format remaining time in a user-friendly way
     */
    public static function formatRemainingTime($minutes)
    {
        if ($minutes <= 0) {
            return '0 minutes';
        }

        $hours = floor($minutes / 60);
        $remainingMinutes = $minutes % 60;
        $seconds = round(($minutes - floor($minutes)) * 60);

        if ($hours > 0) {
            if ($remainingMinutes > 0) {
                return "{$hours} hour" . ($hours > 1 ? 's' : '') . " and {$remainingMinutes} minute" . ($remainingMinutes > 1 ? 's' : '');
            } else {
                return "{$hours} hour" . ($hours > 1 ? 's' : '');
            }
        } elseif ($remainingMinutes > 0) {
            if ($seconds > 0) {
                return "{$remainingMinutes} minute" . ($remainingMinutes > 1 ? 's' : '') . " and {$seconds} second" . ($seconds > 1 ? 's' : '');
            } else {
                return "{$remainingMinutes} minute" . ($remainingMinutes > 1 ? 's' : '');
            }
        } else {
            return "{$seconds} second" . ($seconds > 1 ? 's' : '');
        }
    }
}
