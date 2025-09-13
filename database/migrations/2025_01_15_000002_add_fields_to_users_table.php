<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add username field for login
            $table->string('username')->unique()->after('name');
            
            // Add full_name field to match registration form
            $table->string('full_name')->after('username');
            
            // Add status field to track if user is active
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active')->after('role');
            
            // Add last_login field
            $table->timestamp('last_login_at')->nullable()->after('status');
            
            // Add created_by field to track who created the user
            $table->foreignId('created_by')->nullable()->constrained('users')->after('last_login_at');
            
            // Add notes field for additional information
            $table->text('notes')->nullable()->after('created_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropColumn([
                'username',
                'full_name', 
                'status',
                'last_login_at',
                'created_by',
                'notes'
            ]);
        });
    }
}; 