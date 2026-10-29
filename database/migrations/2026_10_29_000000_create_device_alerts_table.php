<?php

use App\Models\Device;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Lookup table. id order = severity (green < orange < red).
        Schema::create('alert_levels', function (Blueprint $table) {
            $table->tinyIncrements('id');
            $table->string('name', 10)->unique();
        });

        DB::table('alert_levels')->insert([
            ['name' => 'green'],
            ['name' => 'orange'],
            ['name' => 'red'],
        ]);

        // One row per status change into orange/red. Location, IP and thresholds are
        // snapshots, so history stays correct after a device or profile is edited.
        Schema::create('device_alerts', function (Blueprint $table) {
            $table->unsignedInteger('device_id')->nullable();

            $table->foreign('device_id')
                ->references('id')
                ->on('devices')
                ->nullOnDelete();
            $table->string('device_ip', 45);
            $table->string('location')->nullable();
            $table->string('threshold_profile_name')->nullable();

            $table->decimal('temp', 6, 2);
            $table->decimal('rh', 6, 2);

            $table->unsignedTinyInteger('level_id');
            $table->unsignedTinyInteger('previous_level_id')->nullable();
            $table->unsignedTinyInteger('temp_level_id');
            $table->unsignedTinyInteger('rh_level_id');

            $table->decimal('temp_min', 6, 2)->nullable();
            $table->decimal('temp_max', 6, 2)->nullable();
            $table->decimal('temp_crit_min', 6, 2)->nullable();
            $table->decimal('temp_crit_max', 6, 2)->nullable();
            $table->decimal('rh_min', 6, 2)->nullable();
            $table->decimal('rh_max', 6, 2)->nullable();
            $table->decimal('rh_crit_min', 6, 2)->nullable();
            $table->decimal('rh_crit_max', 6, 2)->nullable();

            $table->dateTime('alerted_at')->index();

            $table->foreign('level_id')->references('id')->on('alert_levels');
            $table->foreign('previous_level_id')->references('id')->on('alert_levels');
            $table->foreign('temp_level_id')->references('id')->on('alert_levels');
            $table->foreign('rh_level_id')->references('id')->on('alert_levels');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_alerts');
        Schema::dropIfExists('alert_levels');
    }
};
