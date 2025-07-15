<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('family_planning_clients', function (Blueprint $table) {
            $table->id();
            $table->date('registration_date');
            $table->string('family_serial');
            $table->string('name');
            $table->string('address');
            $table->date('dob');
            $table->string('type');
            $table->string('source');
            $table->string('previous_method')->nullable();
            $table->json('follow_up')->nullable();
            $table->date('drop_out_date')->nullable();
            $table->string('drop_out_reason')->nullable();
            $table->json('deworming')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('family_planning_clients');
    }
}; 