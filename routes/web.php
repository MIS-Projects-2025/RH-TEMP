<?php

use App\Http\Controllers\DemoController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\General\AdminController;
use App\Http\Middleware\AuthMiddleware;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\General\ProfileController;

use Inertia\Inertia;

$app_name = env('APP_NAME', '');

// Authentication routes
require __DIR__ . '/auth.php';

Route::get("/demo", [DemoController::class, 'index'])->name('demo');

Route::get("/admin", [AdminController::class, 'index'])->name('admin');
Route::get("/new-admin", [AdminController::class, 'index_addAdmin'])->name('index_addAdmin');
Route::post("/add-admin", [AdminController::class, 'addAdmin'])->name('addAdmin');
Route::post("/remove-admin", [AdminController::class, 'removeAdmin'])->name('removeAdmin');
Route::patch("/change-admin-role", [AdminController::class, 'changeAdminRole'])->name('changeAdminRole');


Route::middleware(AuthMiddleware::class . ':dashboard')->group(function () {
    Route::get("/", [DashboardController::class, 'index'])->name('dashboard');
});

Route::get("/profile", [ProfileController::class, 'index'])->name('profile.index');
Route::post("/change-password", [ProfileController::class, 'changePassword'])->name('changePassword');

Route::fallback(function () {
    return Inertia::render('404');
})->name('404');
