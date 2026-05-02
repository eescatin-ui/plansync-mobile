<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedule_classes', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('user_id');
            $table->string('title');
            $table->string('location')->nullable();
            $table->string('instructor')->nullable();
            $table->string('day');
            $table->string('start_time');
            $table->string('end_time');
            $table->string('color')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedule_classes');
    }
};
