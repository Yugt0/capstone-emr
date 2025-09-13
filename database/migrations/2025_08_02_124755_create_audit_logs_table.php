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
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('user_name');
            $table->string('action'); // Created, Updated, Deleted, Viewed, etc.
            $table->string('model'); // Model name (Patient, User, etc.)
            $table->string('model_id')->nullable(); // ID of the affected record
            $table->text('description')->nullable(); // Human readable description
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->json('old_values')->nullable(); // Previous values for updates
            $table->json('new_values')->nullable(); // New values for updates
            $table->timestamps();

            $table->index(['user_id']);
            $table->index(['action']);
            $table->index(['model']);
            $table->index(['created_at']);
            $table->index(['user_id', 'created_at']);

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
