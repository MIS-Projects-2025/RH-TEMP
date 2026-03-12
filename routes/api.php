<?php

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\ApiAuthMiddleware;

Route::middleware([ApiAuthMiddleware::class])
  ->name('api.')
  ->group(function () {
    // Route::prefix('checklists')->name('checklists.')->group(function () {
    //   Route::get('/', [ChecklistsController::class, 'getAllChecklistsWithDueAssets'])
    //     ->name('index');
    //   Route::post('/add', [ChecklistsController::class, 'store'])
    //     ->middleware(ApiPermissionMiddleware::class)
    //     ->name('add');
    //   Route::delete('/{id}/delete', [ChecklistsController::class, 'destroy'])
    //     ->middleware(ApiPermissionMiddleware::class)
    //     ->name('delete');
    //   Route::patch('/{id}/update', [ChecklistsController::class, 'update'])
    //     ->middleware(ApiPermissionMiddleware::class)
    //     ->name('update');
    //   Route::patch('/bulk-update', [ChecklistsController::class, 'bulkUpdate'])
    //     ->middleware(ApiPermissionMiddleware::class)
    //     ->name('bulkUpdate');
    // });
  });
