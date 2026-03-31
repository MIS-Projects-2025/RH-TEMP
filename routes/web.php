<?php

use App\Http\Controllers\DeviceController;
use App\Http\Controllers\StatusController;
use Illuminate\Support\Facades\Route;

use App\Http\Middleware\RoutePermissionMiddleware;
use App\Http\Controllers\General\ProfileController;
use App\Http\Controllers\ThresholdProfileController;
use Inertia\Inertia;
use App\Http\Middleware\AuthMiddleware;
use App\Http\Middleware\SessionMiddleware;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

// Auth routes (Laravel Breeze handles these)
require __DIR__ . '/auth.php';

Route::get('/home', fn() => Inertia::render('Home'))->name('home');

Route::get('/dashboard',       [StatusController::class, 'index'])->name('dashboard')
    ->withoutMiddleware([AuthMiddleware::class, SessionMiddleware::class]);
Route::post('/status',         [StatusController::class, 'fetchStatus'])->name('status.fetch');
Route::post('/status/save-logs', [StatusController::class, 'saveLogs'])->name('status.saveLogs');
Route::post('/dashboard/log',    [StatusController::class, 'log'])->name('dashboard.log');

Route::prefix('threshold-profiles')->group(
    function () {
        Route::middleware(RoutePermissionMiddleware::class)->group(function () {
            Route::get('/', [ThresholdProfileController::class, 'index'])->name('threshold-profiles.index');

            Route::middleware(RoutePermissionMiddleware::class)->group(
                function () {
                    Route::put('/{profile}', [ThresholdProfileController::class, 'update']);
                    Route::post('/', [ThresholdProfileController::class, 'store']);
                }
            );
        });
    }
);

Route::prefix('devices')->group(function () {
    Route::middleware(RoutePermissionMiddleware::class)->group(function () {
        Route::get('/',       [DeviceController::class, 'index'])->name('devices.index');
        Route::put('/{device}/threshold-profile', [ThresholdProfileController::class, 'assignToDevice']);
        Route::get('/setup',  [DeviceController::class, 'setup'])->name('devices.setup');
        Route::post('/',           [DeviceController::class, 'store'])->name('devices.store');
        Route::put('/{device}',    [DeviceController::class, 'update'])->name('devices.update');
        Route::delete('/{device}', [DeviceController::class, 'destroy'])->name('devices.destroy');
    });
});
// Route::prefix('devices')->group(function () {
//     Route::get('/',       [DeviceController::class, 'index'])->name('devices.index');
//     Route::get('/setup',  [DeviceController::class, 'setup'])->name('devices.setup');
//     Route::post('/',      [DeviceController::class, 'store'])->name('devices.store');
//     Route::put('/{device}',    [DeviceController::class, 'update'])->name('devices.update');
//     Route::delete('/{device}', [DeviceController::class, 'destroy'])->name('devices.destroy');
// });

Route::get("/profile", [ProfileController::class, 'index'])->name('profile.index');

Route::get('/export', [DeviceController::class, 'export'])->name('devices.export');
