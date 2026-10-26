<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


// Schedule::command('app:fetch-device-recordings')->everyTwoMinutes(); // deprecated

Schedule::command('app:poll-device-alerts')
    ->everyFiveSeconds()
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/device-alerts-scheduler.log'));
