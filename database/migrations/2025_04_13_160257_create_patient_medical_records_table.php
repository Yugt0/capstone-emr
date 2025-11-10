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
        Schema::create('patient_medical_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patient-information')->onDelete('cascade');
            $table->string('temperature')->nullable();
            $table->text('patient_history')->nullable();
            $table->string('age')->nullable();
            $table->string('respiratory_rate')->nullable();
            $table->text('chief_complaint')->nullable();
            $table->string('cardiac_rate')->nullable();
            $table->string('weight')->nullable();
            $table->string('blood_pressure')->nullable();
            $table->text('history_of_present_illness')->nullable();
            $table->text('assessment')->nullable();
            $table->text('plan')->nullable();
            $table->text('medicine_takes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patient_medical_records');
    }
};
