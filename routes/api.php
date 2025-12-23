
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\ApiAuthMiddleware;


Route::middleware([ApiAuthMiddleware::class])
  ->group(function () {});


?>