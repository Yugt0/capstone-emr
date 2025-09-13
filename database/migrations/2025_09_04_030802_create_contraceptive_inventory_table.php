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
        Schema::create('contraceptive_inventory', function (Blueprint $table) {
            $table->id();
            $table->string('contraceptive_name');
            $table->string('contraceptive_type');
            $table->text('batch_number');
            $table->integer('quantity');
            $table->date('expiration_date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contraceptive_lists');
    }
};
