<?php

use App\Http\Controllers\DeviceController;
use App\Http\Controllers\StatusController;
use Illuminate\Support\Facades\Route;

use App\Http\Middleware\RoutePermissionMiddleware;
use App\Http\Controllers\General\ProfileController;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('devices.index');
});

// Auth routes (Laravel Breeze handles these)
require __DIR__ . '/auth.php';

Route::get('/home', fn() => Inertia::render('Home'))->name('home');

Route::get('/dashboard',       [StatusController::class, 'index'])->name('dashboard');
Route::post('/status',         [StatusController::class, 'fetchStatus'])->name('status.fetch');
Route::post('/status/save-logs', [StatusController::class, 'saveLogs'])->name('status.saveLogs');
Route::post('/dashboard/log',    [StatusController::class, 'log'])->name('dashboard.log');

Route::prefix('devices')->group(function () {
    Route::get('/',       [DeviceController::class, 'index'])->name('devices.index');

    Route::middleware(RoutePermissionMiddleware::class)->group(function () {
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
