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
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // encoder, nursing_attendant, midwife, doctor, cold_chain_manager
            $table->string('display_name'); // Human readable name
            $table->text('description')->nullable(); // Role description
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insert default roles
        DB::table('roles')->insert([
            [
                'name' => 'encoder',
                'display_name' => 'Encoder',
                'description' => 'Responsible for data entry and basic patient information management',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'nursing_attendant',
                'display_name' => 'Nursing Attendant',
                'description' => 'Assists with patient care and basic medical procedures',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'midwife',
                'display_name' => 'Midwife',
                'description' => 'Specialized in maternal and child health care',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'doctor',
                'display_name' => 'Doctor',
                'description' => 'Medical professional with full access to patient care and records',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'cold_chain_manager',
                'display_name' => 'Cold Chain Manager',
                'description' => 'Manages vaccine storage, temperature monitoring, and inventory',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'admin',
                'display_name' => 'Administrator',
                'description' => 'System administrator with full access to all features and user management',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
}; 