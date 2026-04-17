<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recordings', function (Blueprint $table) {
            $table->id();

            $table->unsignedInteger('device_id');

            $table->foreign('device_id')
                ->references('id')
                ->on('devices')
                ->onDelete('cascade');

            $table->dateTime('recorded_at')->index();

            $table->decimal('temperature', 5, 2);
            $table->decimal('humidity', 5, 2);

            $table->unique(['device_id', 'recorded_at']);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recordings');
    }
};
