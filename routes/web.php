<?php

use App\Http\Controllers\ChemicalsController;
use App\Http\Controllers\ChemicalSDSMonitoringInstanceController;
use App\Http\Controllers\RestroomMonitoringInstanceController;
use App\Http\Controllers\DemoController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\General\AdminController;
use App\Http\Middleware\AuthMiddleware;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UtilityTrashController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\General\ProfileController;
use App\Http\Controllers\ChecklistsController;
use App\Http\Controllers\CheckItemsController;
use App\Http\Controllers\SchedulesController;
use App\Http\Controllers\AssetsController;
use App\Http\Controllers\ChecklistAssetsController;
use App\Http\Controllers\PerformChecklistController;
use App\Http\Controllers\PerformSDSMonitoringController;
use App\Http\Controllers\PerformRestroomMonitoringController;
use App\Http\Controllers\ChecklistInstanceController;
use App\Http\Controllers\AssetPmSchedulesController;
use App\Http\Controllers\ChecklistItemsController;
use App\Http\Controllers\AssetHealthBoardController;
use App\Http\Controllers\HazardousWasteTurnOverLogSheetController;
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

Route::middleware(AuthMiddleware::class . ':asset-health')->group(function () {
    Route::get("/asset-health", [AssetHealthBoardController::class, 'index'])->name('asset-health');
});

Route::middleware(AuthMiddleware::class . ':utility-trash')->group(function () {
    Route::get("/utility-trash-list", [UtilityTrashController::class, 'index'])->name('utility-trash');
});

Route::prefix('hazardous')->name('hazardous-log-sheet.')->group(
    function () {
        Route::middleware([])->group(function () {
            Route::get("/", [HazardousWasteTurnOverLogSheetController::class, 'index'])->name('index');
        });
        Route::middleware([])->group(function () {
            Route::get("/create", [HazardousWasteTurnOverLogSheetController::class, 'upsert'])->name('create');
        });
        Route::middleware([])->group(function () {
            Route::get("/{reference_no}/edit", [HazardousWasteTurnOverLogSheetController::class, 'upsert'])->name('edit');
        });
    }
);

Route::prefix('locations')->name('locations.')->group(
    function () {
        Route::middleware([])->group(function () {
            Route::get("/", [LocationController::class, 'index'])->name('index');
        });
        Route::middleware([])->group(function () {
            Route::get("/create", [LocationController::class, 'upsert'])->name('create');
        });
        Route::middleware([])->group(function () {
            Route::get("/{id}/edit", [LocationController::class, 'upsert'])->name('edit');
        });
    }
);

Route::prefix('chemicals')->name('chemicals.')->group(
    function () {
        Route::middleware([])->group(function () {
            Route::get("/", [ChemicalsController::class, 'index'])->name('index');
        });
        Route::middleware([])->group(function () {
            Route::get("/create", [ChemicalsController::class, 'upsert'])->name('create');
        });
        Route::middleware([])->group(function () {
            Route::get("/{id}/edit", [ChemicalsController::class, 'upsert'])->name('edit');
        });
    }
);

Route::prefix('chemicals-sds-instances')->name('chemicals-sds-instances.')->group(
    function () {
        Route::get("/", [ChemicalSDSMonitoringInstanceController::class, 'index'])->name('index');
    }
);

Route::prefix('restroom-monitoring-instances')->name('restroom-monitoring-instances.')->group(
    function () {
        Route::get("/", [RestroomMonitoringInstanceController::class, 'index'])->name('index');
    }
);

Route::prefix('checklist')->name('checklist.')->group(
    function () {
        Route::middleware([])->group(function () {
            Route::get("/list", [ChecklistsController::class, 'index'])->name('index');
        });
    }
);

Route::prefix('checklist-items')->name('checklist-items.')->group(
    function () {
        Route::middleware([])->group(function () {
            Route::get("/", [ChecklistItemsController::class, 'index'])->name('index');
        });
        Route::middleware([])->group(function () {
            Route::get("/create", [ChecklistsController::class, 'upsert'])->name('create');
        });
        Route::middleware([])->group(function () {
            Route::get("/{id}/edit", [ChecklistsController::class, 'upsert'])->name('edit');
        });
    }
);

Route::prefix('check-items')->name('check-items.')->group(
    function () {
        Route::middleware([])->group(function () {
            Route::get("/", [CheckItemsController::class, 'index'])->name('index');
        });
        Route::middleware([])->group(function () {
            Route::get("/create", [CheckItemsController::class, 'upsert'])->name('create');
        });
        Route::middleware([])->group(function () {
            Route::get("/{id}/edit", [CheckItemsController::class, 'upsert'])->name('edit');
        });
    }
);

Route::prefix('schedules')->name('schedules.')->group(
    function () {
        Route::middleware([])->group(function () {
            Route::get("/", [SchedulesController::class, 'index'])->name('index');
        });
        Route::middleware([])->group(function () {
            Route::get("/create", [SchedulesController::class, 'upsert'])->name('create');
        });
        Route::middleware([])->group(function () {
            Route::get("/{id}/edit", [SchedulesController::class, 'upsert'])->name('edit');
        });
    }
);

Route::prefix('assets')->name('assets.')->group(
    function () {
        Route::middleware([])->group(function () {
            Route::get("/", [AssetsController::class, 'index'])->name('index');
        });
        Route::middleware([])->group(function () {
            Route::get("/create", [AssetsController::class, 'upsert'])->name('create');
        });
        Route::middleware([])->group(function () {
            Route::get("/{id}/edit", [AssetsController::class, 'upsert'])->name('edit');
        });
    }
);

Route::prefix('checklist-assets')->name('checklist-assets.')->group(
    function () {
        Route::middleware([])->group(function () {
            Route::get("/due", [AssetsController::class, 'getDueAssets'])->name('due-assets');
        });
        Route::middleware([])->group(function () {
            Route::get("/", [ChecklistAssetsController::class, 'index'])->name('index');
        });
        Route::middleware([])->group(function () {
            Route::get("/create", [ChecklistAssetsController::class, 'upsert'])->name('create');
        });
        Route::middleware([])->group(function () {
            Route::get("/{id}/edit", [ChecklistAssetsController::class, 'upsert'])->name('edit');
        });
    }
);

Route::prefix('perform')->name('perform.')->group(function () {
    Route::prefix('checklist')->name('checklist.')->group(function () {
        Route::get('/', [PerformChecklistController::class, 'index'])->name('index');
    });
    Route::prefix('sds-monitoring')->name('sds-monitoring.')->group(function () {
        Route::get('/', [PerformSDSMonitoringController::class, 'index'])->name('index');
    });
    Route::prefix('restroom-monitoring')->name('restroom-monitoring.')->group(function () {
        Route::get('/', [PerformRestroomMonitoringController::class, 'index'])->name('index');
    });
});

Route::prefix('checklist-instance')->name('checklist-instance.')->group(
    function () {
        Route::middleware([])->group(function () {
            Route::get("/", [ChecklistInstanceController::class, 'index'])->name('index');
        });
        // Route::middleware([])->group(function () {
        //     Route::get("/create", [PerformChecklistController::class, 'upsert'])->name('create');
        // });
        // Route::middleware([])->group(function () {
        //     Route::get("/{id}/edit", [PerformChecklistController::class, 'upsert'])->name('edit');
        // });
    }
);

Route::prefix('asset-pm-schedule')->name('asset-pm-schedule.')->group(
    function () {
        Route::middleware([])->group(function () {
            Route::get("/", [AssetPmSchedulesController::class, 'index'])->name('index');
        });
        Route::middleware([])->group(function () {
            Route::get("/create", [AssetPmSchedulesController::class, 'upsert'])->name('create');
        });
        Route::middleware([])->group(function () {
            Route::get("/{id}/edit", [AssetPmSchedulesController::class, 'upsert'])->name('edit');
        });
    }
);


Route::get("/profile", [ProfileController::class, 'index'])->name('profile.index');
Route::post("/change-password", [ProfileController::class, 'changePassword'])->name('changePassword');

Route::fallback(function () {
    return Inertia::render('404');
})->name('404');
