<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\LoginAttempt;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
use App\Models\AuditLog; // Added this import for AuditLog

class UserController extends Controller
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fullName' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => ['required', 'confirmed', Password::defaults()],
            'role' => 'required|in:encoder,nursing_attendant,midwife,doctor,cold_chain_manager',
        ], [
            'fullName.required' => 'Full name is required.',
            'username.required' => 'Username is required.',
            'username.unique' => 'Username is already taken.',
            'email.required' => 'Email is required.',
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'Email is already registered.',
            'password.required' => 'Password is required.',
            'password.confirmed' => 'Password confirmation does not match.',
            'role.required' => 'Role is required.',
            'role.in' => 'Please select a valid role.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            \Log::info('Creating user', [
                'fullName' => $request->fullName,
                'username' => $request->username,
                'email' => $request->email,
                'role' => $request->role
            ]);
            
            $user = User::create([
                'name' => $request->fullName,
                'full_name' => $request->fullName,
                'username' => $request->username,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'status' => 'active',
                'created_by' => Auth::id(), // If admin is creating the user
            ]);
            
            \Log::info('User created successfully', ['user_id' => $user->id]);

            return response()->json([
                'success' => true,
                'message' => 'User registered successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string',
            'password' => 'required|string',
        ], [
            'username.required' => 'Username is required.',
            'password.required' => 'Password is required.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $credentials = $request->only('username', 'password');
            $ipAddress = $request->ip();
            
            // Check if user is locked out
            if (LoginAttempt::isLockedOut($credentials['username'], $ipAddress)) {
                $remainingTime = LoginAttempt::getRemainingLockTime($credentials['username'], $ipAddress);
                $formattedTime = LoginAttempt::formatRemainingTime($remainingTime);
                return response()->json([
                    'success' => false,
                    'message' => "Account locked due to multiple failed attempts. Please try again in {$formattedTime}.",
                    'locked' => true,
                    'remaining_time' => $remainingTime
                ], 423);
            }
            
            // Try to authenticate with username
            $user = User::where('username', $credentials['username'])->first();
            
            if (!$user) {
                // Record failed attempt
                LoginAttempt::recordFailedAttempt($credentials['username'], $ipAddress);
                $remainingAttempts = LoginAttempt::getRemainingAttempts($credentials['username'], $ipAddress);
                
                // Log failed login attempt
                AuditLogService::logFailedLogin(
                    $credentials['username'],
                    "Failed login attempt - Invalid username: {$credentials['username']}"
                );
                
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid username or password',
                    'remaining_attempts' => $remainingAttempts
                ], 401);
            }
            
            if (!Hash::check($credentials['password'], $user->password)) {
                // Record failed attempt
                LoginAttempt::recordFailedAttempt($credentials['username'], $ipAddress);
                $remainingAttempts = LoginAttempt::getRemainingAttempts($credentials['username'], $ipAddress);
                
                // Log failed login attempt
                AuditLogService::logFailedLogin(
                    $credentials['username'],
                    "Failed login attempt - Invalid password for username: {$credentials['username']}"
                );
                
                // Check if user is now locked out
                if (LoginAttempt::isLockedOut($credentials['username'], $ipAddress)) {
                    $remainingTime = LoginAttempt::getRemainingLockTime($credentials['username'], $ipAddress);
                    $formattedTime = LoginAttempt::formatRemainingTime($remainingTime);
                    
                    // Log account lockout
                    AuditLogService::logFailedLogin(
                        $credentials['username'],
                        "Account locked due to multiple failed attempts. Locked until: " . now()->addMinutes($remainingTime)->format('Y-m-d H:i:s')
                    );
                    
                    return response()->json([
                        'success' => false,
                        'message' => "Account locked due to multiple failed attempts. Please try again in {$formattedTime}.",
                        'locked' => true,
                        'remaining_time' => $remainingTime
                    ], 423);
                }
                
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid username or password',
                    'remaining_attempts' => $remainingAttempts
                ], 401);
            }

            // Check if user is active
            if ($user->status !== 'active') {
                return response()->json([
                    'success' => false,
                    'message' => 'Account is not active. Please contact administrator.'
                ], 403);
            }

            // Clear failed attempts on successful login
            LoginAttempt::clearFailedAttempts($credentials['username'], $ipAddress);

            // Update last login
            $user->update(['last_login_at' => now()]);

            // Log the login activity AFTER the user is authenticated
            // We need to manually log with the user context since Auth::user() might not be set yet
            AuditLog::create([
                'user_id' => $user->id,
                'user_name' => $user->name,
                'action' => 'Login',
                'model' => 'User',
                'model_id' => $user->id,
                'description' => "User {$user->name} logged in successfully",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            // Create token for API authentication (if Sanctum is working)
            try {
                $token = $user->createToken('auth_token')->plainTextToken;
            } catch (\Exception $e) {
                $token = null;
            }

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'full_name' => $user->full_name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                ],
                'token' => $token
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Login failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        try {
            $user = $request->user();
            
            // Log the logout activity with the correct user context
            AuditLog::create([
                'user_id' => $user->id,
                'user_name' => $user->name,
                'action' => 'Logout',
                'model' => 'User',
                'model_id' => $user->id,
                'description' => "User {$user->name} logged out",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
            
            // Revoke the token
            $user->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Logout failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get current user profile
     */
    public function profile(Request $request)
    {
        try {
            $user = $request->user();

            return response()->json([
                'success' => true,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'full_name' => $user->full_name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                    'last_login_at' => $user->last_login_at,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all users (admin only)
     */
    public function index(Request $request)
    {
        try {
            $users = User::select([
                'id', 'name', 'full_name', 'username', 'email', 
                'role', 'status', 'last_login_at', 'created_at'
            ])->paginate(10);

            return response()->json([
                'success' => true,
                'users' => $users
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get users',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update user status
     */
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:active,inactive,suspended',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::findOrFail($id);
            $user->update(['status' => $request->status]);

            return response()->json([
                'success' => true,
                'message' => 'User status updated successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'status' => $user->status,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user status',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 