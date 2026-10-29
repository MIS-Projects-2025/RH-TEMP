<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('devices', function (Blueprint $table) {
            // Percentage (0-100) of the floor plan image width / height.
            // Nullable: a device with no coords simply isn't pinned on the map.
            $table->decimal('map_x', 5, 2)->nullable()->after('location');
            $table->decimal('map_y', 5, 2)->nullable()->after('map_x');
        });
    }

    public function down(): void
    {
        Schema::table('devices', function (Blueprint $table) {
            $table->dropColumn(['map_x', 'map_y']);
        });
    }
};
