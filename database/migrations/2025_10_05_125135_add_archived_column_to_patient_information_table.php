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
        Schema::table('patient_information', function (Blueprint $table) {
            $table->boolean('archived')->default(false)->after('barangay');
            $table->timestamp('archived_at')->nullable()->after('archived');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patient_information', function (Blueprint $table) {
            $table->dropColumn(['archived', 'archived_at']);
        });
    }
};
