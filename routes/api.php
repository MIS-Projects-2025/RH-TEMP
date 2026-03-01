<?php

use App\Http\Controllers\ChemicalsController;
use App\Http\Controllers\ChemicalSDSController;
use Illuminate\Support\Facades\Route;
use App\Http\Middleware\ApiAuthMiddleware;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\UtilityTrashController;
use App\Http\Controllers\ChecklistItemsController;
use App\Http\Controllers\CheckItemsController;
use App\Http\Controllers\AssetsController;
use App\Http\Controllers\PerformSDSMonitoringController;
use App\Http\Controllers\PerformRestroomMonitoringController;
use App\Http\Controllers\ChecklistAssetsController;
use App\Http\Controllers\AssetPmSchedulesController;
use App\Http\Controllers\ChecklistItemSchedulesController;
use App\Http\Controllers\SchedulesController;
use App\Http\Controllers\CheckItemsResultController;
use App\Http\Controllers\ChecklistInstanceController;
use App\Http\Controllers\GlobalPmSchedulesController;
use App\Http\Controllers\GlobalPmController;
use App\Http\Controllers\ChecklistsController;
use App\Http\Controllers\RestroomMonitoringInstanceController;
use App\Http\Controllers\HazardousWasteTurnOverLogSheetController;

Route::middleware([ApiAuthMiddleware::class])
  ->name('api.')
  ->group(function () {

    Route::prefix('locations')->name('locations.')->group(function () {
      Route::get('/', [LocationController::class, 'index'])
        ->name('index');
      Route::patch('/bulk-update', [LocationController::class, 'bulkUpdate'])
        ->name('bulkUpdate');
      Route::post('/add', [LocationController::class, 'store'])
        ->name('store');
      Route::delete('/bulk-delete', [LocationController::class, 'massGenocide'])
        ->name('massGenocide');
    });

    Route::prefix('utility-trash')->name('utility-trash.')->group(function () {
      Route::post('/perform', [UtilityTrashController::class, 'perform'])
        ->name('perform');
      Route::patch('/verify', [UtilityTrashController::class, 'bulkVerify'])
        ->name('verify');
    });

    Route::prefix('hazardous-log-sheet')->name('hazardous-log-sheet.')->group(function () {
      Route::post('/add', [HazardousWasteTurnOverLogSheetController::class, 'store'])
        ->name('add');
      Route::patch('/bulk-update', [HazardousWasteTurnOverLogSheetController::class, 'bulkUpdate'])
        ->name('bulkUpdate');
      Route::delete('/{reference_no}/delete', [HazardousWasteTurnOverLogSheetController::class, 'destroy'])
        ->name('delete');
      Route::patch('/{reference_no}/update', [HazardousWasteTurnOverLogSheetController::class, 'update'])
        ->name('update');
    });

    Route::prefix('chemicals')->name('chemicals.')->group(function () {
      Route::post('/add', [ChemicalsController::class, 'store'])
        ->name('add');
      Route::delete('/{id}/delete', [ChemicalsController::class, 'destroy'])
        ->name('delete');
      Route::patch('/{id}/update', [ChemicalsController::class, 'update'])
        ->name('update');
    });

    Route::prefix('chemicals-sds')->name('chemicals-sds.')->group(function () {
      Route::post('/add', [ChemicalSDSController::class, 'store'])
        ->name('add');
      Route::delete('/{id}/delete', [ChemicalSDSController::class, 'destroy'])
        ->name('delete');
      Route::patch('/{id}/update', [ChemicalSDSController::class, 'update'])
        ->name('update');
    });

    Route::prefix('checklist-items')->name('checklist-items.')->group(function () {
      Route::get('/', [ChecklistItemsController::class, 'index'])
        ->name('index');
      Route::post('/add', [ChecklistItemsController::class, 'store'])
        ->name('add');
      Route::delete('/{id}/delete', [ChecklistItemsController::class, 'destroy'])
        ->name('delete');
      Route::patch('/{id}/update', [ChecklistItemsController::class, 'update'])
        ->name('update');
      Route::get('/all-check-items', [ChecklistItemsController::class, 'getAllCheckItems'])
        ->name('all-check-items');
      Route::patch('/bulk-update', [ChecklistItemsController::class, 'bulkUpdate'])
        ->name('bulkUpdate');
      Route::delete('/bulk-delete', [ChecklistItemsController::class, 'massGenocide'])
        ->name('massGenocide');
      Route::get('/scheduled-check-items', [ChecklistItemsController::class, 'getScheduledCheckItems'])
        ->name('scheduled-check-items');
    });

    Route::prefix('check-items')->name('check-items.')->group(function () {
      Route::get('/', [CheckItemsController::class, 'index'])
        ->name('index');
      Route::post('/add', [CheckItemsController::class, 'store'])
        ->name('add');
      Route::delete('/{id}/delete', [CheckItemsController::class, 'destroy'])
        ->name('delete');
      Route::patch('/{id}/update', [CheckItemsController::class, 'update'])
        ->name('update');
      Route::patch('/bulk-update', [CheckItemsController::class, 'bulkUpdate'])
        ->name('bulkUpdate');
    });

    Route::prefix('assets')->name('assets.')->group(function () {
      Route::get('/', [AssetsController::class, 'index'])
        ->name('index');
      Route::post('/add', [AssetsController::class, 'store'])
        ->name('add');
      Route::delete('/{id}/delete', [AssetsController::class, 'destroy'])
        ->name('delete');
      Route::patch('/{id}/update', [AssetsController::class, 'update'])
        ->name('update');
      Route::get('/all-assets', [AssetsController::class, 'getAllAssets'])
        ->name('all-assets');
      Route::patch('/bulk-update', [AssetsController::class, 'bulkUpdate'])
        ->name('bulkUpdate');
      Route::delete('/bulk-delete', [AssetsController::class, 'massGenocide'])
        ->name('massGenocide');
    });

    Route::prefix('checklist-item-result')->name('checklist-item-result.')->group(function () {
      Route::post('/record', [CheckItemsResultController::class, 'recordResult'])
        ->name('recordResult');
    });

    Route::prefix('chemical-sds-result')->name('chemical-sds-result.')->group(function () {
      Route::post('/record', [PerformSDSMonitoringController::class, 'recordResult'])
        ->name('recordResult');
    });

    Route::prefix('restroom-monitoring-result')->name('restroom-monitoring-result.')->group(function () {
      Route::post('/record', [PerformRestroomMonitoringController::class, 'recordResult'])
        ->name('recordResult');
    });

    Route::prefix('checklist-assets')->name('checklist-assets.')->group(function () {
      Route::get('/', [ChecklistAssetsController::class, 'index'])
        ->name('index');
      Route::get('/due', [AssetsController::class, 'getDueAssets'])
        ->name('due-assets');
      Route::get('/due-with-items', [AssetsController::class, 'getDueAssetsWithItems'])
        ->name('due-assets-with-items');
      Route::post('/add', [ChecklistAssetsController::class, 'store'])
        ->name('add');
      Route::delete('/{id}/delete', [ChecklistAssetsController::class, 'destroy'])
        ->name('delete');
      Route::patch('/{id}/update', [ChecklistAssetsController::class, 'update'])
        ->name('update');
      Route::patch('/bulk-update', [ChecklistAssetsController::class, 'bulkUpdate'])
        ->name('bulkUpdate');
      Route::delete('/bulk-delete', [ChecklistAssetsController::class, 'massGenocide'])
        ->name('massGenocide');
    });

    Route::prefix('checklist-instance')->name('checklist-instance.')->group(function () {
      Route::patch('/verify', [ChecklistInstanceController::class, 'verify'])
        ->name('verify');
    });

    Route::prefix('restroom-monitoring-instance')->name('restroom-monitoring-instance.')->group(function () {
      Route::patch('/verify', [RestroomMonitoringInstanceController::class, 'verify'])
        ->name('verify');
    });

    Route::prefix('schedules')->name('schedules.')->group(function () {
      Route::get('/', [SchedulesController::class, 'index'])
        ->name('index');
      Route::post('/add', [SchedulesController::class, 'store'])
        ->name('add');
      Route::delete('/{id}/delete', [SchedulesController::class, 'destroy'])
        ->name('delete');
      Route::patch('/{id}/update', [SchedulesController::class, 'update'])
        ->name('update');
    });

    Route::prefix('asset-pm-schedules')->name('asset-pm-schedules.')->group(function () {
      Route::get('/', [AssetPmSchedulesController::class, 'index'])
        ->name('index');
      Route::post('/add', [AssetPmSchedulesController::class, 'store'])
        ->name('add');
      Route::delete('/{id}/delete', [AssetPmSchedulesController::class, 'destroy'])
        ->name('delete');
      Route::patch('/{id}/update', [AssetPmSchedulesController::class, 'update'])
        ->name('update');
      Route::patch('/bulk-update', [AssetPmSchedulesController::class, 'bulkUpdate'])
        ->name('bulkUpdate');
      Route::delete('/bulk-delete', [AssetPmSchedulesController::class, 'massGenocide'])
        ->name('massGenocide');
    });

    Route::prefix('checklist_item_schedules')->name('checklist_item_schedules.')->group(function () {
      Route::get('/', [ChecklistItemSchedulesController::class, 'index'])
        ->name('index');
      Route::post('/add', [ChecklistItemSchedulesController::class, 'store'])
        ->name('add');
      Route::delete('/{id}/delete', [ChecklistItemSchedulesController::class, 'destroy'])
        ->name('delete');
      Route::patch('/{id}/update', [ChecklistItemSchedulesController::class, 'update'])
        ->name('update');
    });

    Route::prefix('global_pm_schedules')->name('global_pm_schedules.')->group(function () {
      Route::get('/', [GlobalPmSchedulesController::class, 'index'])
        ->name('index');
      Route::post('/add', [GlobalPmSchedulesController::class, 'store'])
        ->name('add');
      Route::delete('/{id}/delete', [GlobalPmSchedulesController::class, 'destroy'])
        ->name('delete');
      Route::patch('/{id}/update', [GlobalPmSchedulesController::class, 'update'])
        ->name('update');
    });

    Route::prefix('global_pm')->name('global_pm.')->group(function () {
      Route::get('/', [GlobalPmController::class, 'index'])
        ->name('index');
      Route::post('/add', [GlobalPmController::class, 'store'])
        ->name('add');
      Route::delete('/{id}/delete', [GlobalPmController::class, 'destroy'])
        ->name('delete');
      Route::patch('/{id}/update', [GlobalPmController::class, 'update'])
        ->name('update');
    });

    Route::prefix('checklists')->name('checklists.')->group(function () {
      Route::get('/', [ChecklistsController::class, 'getAllChecklistsWithDueAssets'])
        ->name('index');
      Route::post('/add', [ChecklistsController::class, 'store'])
        ->name('add');
      Route::delete('/{id}/delete', [ChecklistsController::class, 'destroy'])
        ->name('delete');
      Route::patch('/{id}/update', [ChecklistsController::class, 'update'])
        ->name('update');
      Route::patch('/bulk-update', [ChecklistsController::class, 'bulkUpdate'])
        ->name('bulkUpdate');
    });
  });
