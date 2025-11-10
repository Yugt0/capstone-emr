<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add 'admin' to the role enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'encoder', 'nursing_attendant', 'midwife', 'doctor', 'cold_chain_manager') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'admin' from the role enum (revert to original)
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('encoder', 'nursing_attendant', 'midwife', 'doctor', 'cold_chain_manager') NOT NULL");
    }
};