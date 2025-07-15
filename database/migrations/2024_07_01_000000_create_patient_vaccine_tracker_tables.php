<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Patients Table
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('registration_no');
            $table->date('registration_date');
            $table->date('birth_date');
            $table->string('family_serial_number')->nullable();
            $table->string('child_name');
            $table->enum('sex', ['M', 'F']);
            $table->string('mother_name');
            $table->string('address');
            $table->string('cpab_8a')->nullable();
            $table->string('cpab_8b')->nullable();
            $table->timestamps();
        });

        // Newborn Immunizations Table
        Schema::create('newborn_immunizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->string('length_at_birth')->nullable();
            $table->decimal('weight_at_birth', 4, 2)->nullable();
            $table->string('birth_weight_status')->nullable();
            $table->date('breast_feeding_date')->nullable();
            $table->date('bcg_date')->nullable();
            $table->date('hepa_b_bd_date')->nullable();
            $table->integer('age_in_months')->nullable();
            $table->string('length_in_threes_months')->nullable();
            $table->string('weight_in_threes_months')->nullable();
            $table->string('status')->nullable();
            $table->date('iron_1mo_date')->nullable();
            $table->date('iron_2mo_date')->nullable();
            $table->date('iron_3mo_date')->nullable();
            $table->date('dpt_hib_hepb_1st')->nullable();
            $table->date('dpt_hib_hepb_2nd')->nullable();
            $table->date('dpt_hib_hepb_3rd')->nullable();
            $table->date('opv_1st')->nullable();
            $table->date('opv_2nd')->nullable();
            $table->date('opv_3rd')->nullable();
            $table->date('pcv_1st')->nullable();
            $table->date('pcv_2nd')->nullable();
            $table->date('pcv_3rd')->nullable();
            $table->date('ipv_1st')->nullable();
            $table->timestamps();
        });

        // Nutrition & 12 Months Table
        Schema::create('nutrition_12months', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->integer('age_in_months')->nullable();
            $table->string('length_cm_date')->nullable();
            $table->string('weight_kg_date')->nullable();
            $table->enum('status', ['S', 'W-MAM', 'W-SAM', 'O', 'N'])->nullable();
            $table->enum('exclusively_breastfed', ['Y', 'N'])->nullable();
            $table->enum('complementary_feeding', ['Y', 'N'])->nullable();
            $table->date('vitamin_a_date')->nullable();
            $table->date('mnp_date')->nullable();
            $table->date('mmr_1st_9mo')->nullable();
            $table->date('ipv_2nd_9mo')->nullable();
            $table->integer('age_in_months_12')->nullable();
            $table->string('length_cm_date_12')->nullable();
            $table->string('weight_kg_date_12')->nullable();
            $table->enum('status_12', ['S', 'W-MAM', 'W-SAM', 'O', 'N'])->nullable();
            $table->date('mmr_2nd_12mo')->nullable();
            $table->date('fic_date')->nullable();
            $table->date('cic_date')->nullable();
            $table->timestamps();
        });

        // Outcomes Table
        Schema::create('outcomes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->enum('mam_admitted_sfp', ['Yes', 'No'])->nullable();
            $table->enum('mam_cured', ['Yes', 'No'])->nullable();
            $table->enum('mam_defaulted', ['Yes', 'No'])->nullable();
            $table->enum('mam_died', ['Yes', 'No'])->nullable();
            $table->enum('sam_admitted_otc', ['Yes', 'No'])->nullable();
            $table->enum('sam_cured', ['Yes', 'No'])->nullable();
            $table->enum('sam_defaulted', ['Yes', 'No'])->nullable();
            $table->enum('sam_died', ['Yes', 'No'])->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('outcomes');
        Schema::dropIfExists('nutrition_12months');
        Schema::dropIfExists('newborn_immunizations');
        Schema::dropIfExists('patients');
    }
}; 