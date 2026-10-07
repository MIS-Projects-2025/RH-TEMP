<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('threshold_profiles', function (Blueprint $table) {
            $table->float('temp_crit_min')->nullable()->after('temp_max');
            $table->float('temp_crit_max')->nullable()->after('temp_crit_min');
            $table->float('rh_crit_min')->nullable()->after('rh_max');
            $table->float('rh_crit_max')->nullable()->after('rh_crit_min');
        });
    }

    public function down(): void
    {
        Schema::table('threshold_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'temp_crit_min',
                'temp_crit_max',
                'rh_crit_min',
                'rh_crit_max',
            ]);
        });
    }
};
