<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('devices', function (Blueprint $table) {
            // Center of the hand-placed bubble, as a percentage of the floor plan image.
            // NULL = let the map auto-place the bubble next to its dot.
            $table->decimal('label_x', 5, 2)->nullable()->after('map_y');
            $table->decimal('label_y', 5, 2)->nullable()->after('label_x');
        });
    }

    public function down(): void
    {
        Schema::table('devices', function (Blueprint $table) {
            $table->dropColumn(['label_x', 'label_y']);
        });
    }
};
