<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class RoutePermissionMiddleware
{
  const ALLOWED_DEPARTMENTS = [
    'equipment engineering',
    'mis',
    'process engineering',
    'quality assurance',
    'quality management system',
  ];

  public function handle(Request $request, Closure $next)
  {
    $user = $request->attributes->get('auth_user');
    $dept = $user->emp_dept ?? '';

    $hasAccess = in_array(strtolower($dept), self::ALLOWED_DEPARTMENTS);

    if (!$hasAccess) {
      return redirect()->route('unauthorized');
    }

    return $next($request);
  }
}
