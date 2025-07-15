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
        Schema::create('vaccine_lists', function (Blueprint $table) {
            $table->id();
            $table->date('date_received');
            $table->string('product');
            $table->integer('beginning_balance');
            $table->date('delivery');
            $table->string('consumption');
            $table->integer('stock_trasfer_in');
            $table->integer('stock_trasfer_out');
            $table->date('expiration_date');
            $table->integer('remaining_balance');
            $table->timestamps();
        });
    }   

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vaccine_lists');
    }
};
