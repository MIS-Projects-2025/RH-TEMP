<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class RoutePermissionMiddleware
{
  const ALLOWED_DEPARTMENTS = [
    'equipment engineering',
    'facilities / mis',
    'facilities/mis',
    'mis',
    'process engineering',
    'quality assurance',
    'quality management system',
  ];

  public function handle(Request $request, Closure $next)
  {
    $user = $request->attributes->get('auth_user');
    $dept = $user->emp_dept ?? '';
    $normalizedDept = strtolower(trim($dept));

    $hasAccess = in_array(
      $normalizedDept,
      array_map(fn($d) => strtolower(trim($d)), self::ALLOWED_DEPARTMENTS),
      true
    );

    if (!$hasAccess) {
      Log::info("Unauthorized access attempt by user: {$user->emp_id}, Department: {$dept}");
      return redirect()->route('unauthorized');
    }

    return $next($request);
  }
}
