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
            'role' => 'required|in:admin,encoder,nursing_attendant,midwife,doctor,cold_chain_manager',
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
                $message = 'Account is not active. Please contact administrator.';
                
                // Provide more specific message for suspended accounts
                if ($user->status === 'suspended') {
                    if ($user->lockout_count >= 3) {
                        $message = 'Your account has been suspended due to multiple failed login attempts (3 lockouts). Please contact an administrator to reactivate your account.';
                    } else {
                        $message = 'Your account has been suspended. Please contact an administrator for assistance.';
                    }
                }
                
                return response()->json([
                    'success' => false,
                    'message' => $message,
                    'deactivated' => true,
                    'lockout_count' => $user->lockout_count ?? 0
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
            $query = User::select([
                'id', 'name', 'full_name', 'username', 'email', 
                'role', 'status', 'last_login_at', 'created_at', 'notes'
            ]);

            // Apply search filter
            if ($request->has('search') && !empty($request->search)) {
                $query->search($request->search);
            }

            // Apply role filter
            if ($request->has('role') && !empty($request->role)) {
                $query->byRole($request->role);
            }

            // Apply status filter
            if ($request->has('status') && !empty($request->status)) {
                $query->where('status', $request->status);
            }

            // Apply sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $perPage = $request->get('per_page', 10);
            $users = $query->paginate($perPage);

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
            $oldStatus = $user->status;
            $user->update(['status' => $request->status]);

            // Log the status change
            AuditLogService::logUpdated(
                'User',
                $user->id,
                "User status changed from {$oldStatus} to {$request->status}",
                ['status' => $oldStatus],
                ['status' => $request->status],
                $request
            );

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

    /**
     * Create a new user (admin only)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fullName' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => ['required', 'confirmed', Password::defaults()],
            'role' => 'required|in:admin,encoder,nursing_attendant,midwife,doctor,cold_chain_manager',
            'status' => 'sometimes|in:active,inactive,suspended',
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
            $user = User::create([
                'name' => $request->fullName,
                'full_name' => $request->fullName,
                'username' => $request->username,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'status' => $request->status ?? 'active',
                'created_by' => Auth::id(),
            ]);

            // Log the user creation
            AuditLogService::logCreated(
                'User',
                $user->id,
                "New user created: {$user->name} ({$user->role})",
                $user->toArray(),
                $request
            );

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'full_name' => $user->full_name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                    'created_at' => $user->created_at,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific user
     */
    public function show($id)
    {
        try {
            $user = User::findOrFail($id);

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
                    'created_at' => $user->created_at,
                    'created_by' => $user->created_by,
                    'notes' => $user->notes,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update a user
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'fullName' => 'sometimes|required|string|max:255',
            'username' => 'sometimes|required|string|max:255|unique:users,username,' . $id,
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $id,
            'role' => 'sometimes|required|in:admin,encoder,nursing_attendant,midwife,doctor,cold_chain_manager',
            'status' => 'sometimes|required|in:active,inactive,suspended',
            'notes' => 'sometimes|nullable|string|max:1000',
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
            $oldData = $user->toArray();

            $updateData = [];
            if ($request->has('fullName')) {
                $updateData['name'] = $request->fullName;
                $updateData['full_name'] = $request->fullName;
            }
            if ($request->has('username')) $updateData['username'] = $request->username;
            if ($request->has('email')) $updateData['email'] = $request->email;
            if ($request->has('role')) $updateData['role'] = $request->role;
            if ($request->has('status')) $updateData['status'] = $request->status;
            if ($request->has('notes')) $updateData['notes'] = $request->notes;

            $user->update($updateData);

            // Log the update
            AuditLogService::logUpdated(
                'User',
                $user->id,
                "User profile updated: {$user->name}",
                $oldData,
                $user->toArray(),
                $request
            );

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'full_name' => $user->full_name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                    'notes' => $user->notes,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a user
     */
    public function destroy($id)
    {
        try {
            $user = User::findOrFail($id);
            $userData = $user->toArray();
            
            // Prevent admin from deleting themselves
            if ($user->id === Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot delete your own account'
                ], 403);
            }

            $user->delete();

            // Log the deletion
            AuditLogService::logDeleted(
                'User',
                $id,
                "User deleted: {$userData['name']}",
                $userData,
                request()
            );

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset user password
     */
    public function resetPassword(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'password' => ['required', 'confirmed', Password::defaults()],
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
            $user->update(['password' => Hash::make($request->password)]);

            // Log the password reset
            AuditLogService::logUpdated(
                'User',
                $user->id,
                "Password reset for user: {$user->name}",
                ['password' => '[HIDDEN]'],
                ['password' => '[HIDDEN]'],
                $request
            );

            return response()->json([
                'success' => true,
                'message' => 'Password reset successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reset password',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user statistics
     */
    public function statistics()
    {
        try {
            $stats = [
                'total_users' => User::count(),
                'active_users' => User::where('status', 'active')->count(),
                'inactive_users' => User::where('status', 'inactive')->count(),
                'suspended_users' => User::where('status', 'suspended')->count(),
                'users_by_role' => User::selectRaw('role, COUNT(*) as count')
                    ->groupBy('role')
                    ->get()
                    ->pluck('count', 'role'),
                'recent_logins' => User::whereNotNull('last_login_at')
                    ->where('last_login_at', '>=', now()->subDays(7))
                    ->count(),
            ];

            return response()->json([
                'success' => true,
                'statistics' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reactivate a suspended user account (Admin only)
     */
    public function reactivateAccount(Request $request, $id)
    {
        try {
            // Verify the requesting user is an admin
            $currentUser = $request->user();
            if (!$currentUser || !$currentUser->isAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only administrators can reactivate accounts.'
                ], 403);
            }

            $user = User::findOrFail($id);
            
            // Check if user is actually suspended
            if ($user->status !== 'suspended') {
                return response()->json([
                    'success' => false,
                    'message' => 'This account is not suspended.'
                ], 400);
            }

            $oldStatus = $user->status;
            $oldLockoutCount = $user->lockout_count;

            // Reactivate the account
            $user->update([
                'status' => 'active',
                'lockout_count' => 0
            ]);

            // Clear any failed login attempts
            LoginAttempt::resetUserLockoutCount($user->username);

            // Log the reactivation
            AuditLogService::logUpdated(
                'User',
                $user->id,
                "User account reactivated by admin. Previous status: {$oldStatus}, Previous lockout count: {$oldLockoutCount}",
                ['status' => $oldStatus, 'lockout_count' => $oldLockoutCount],
                ['status' => 'active', 'lockout_count' => 0],
                $request
            );

            return response()->json([
                'success' => true,
                'message' => 'User account reactivated successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'status' => $user->status,
                    'lockout_count' => $user->lockout_count,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reactivate account',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 