<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ApiPermissionMiddleware
{
  /**
   * Handle an incoming request.
   *
   * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
   */
  public function handle(Request $request, Closure $next, $permission = null): Response
  {
    $token = $request->query('key') ?? $request->bearerToken() ?? session('emp_data.token');
    if (!$token) {
      $redirectUrl = urlencode($request->fullUrl());
      return redirect("http://192.168.2.221:8200/login?redirect={$redirectUrl}");
    }

    $cacheKey = 'authify_user_' . $token;

    $currentUser = cache()->remember($cacheKey, now()->addMinutes(10), function () use ($token) {
      return DB::connection('authify')
        ->table('authify.authify_sessions')
        ->where('token', $token)
        ->first();
    });

    $dept = strtolower($currentUser?->emp_dept ?? '');
    $job_title = strtolower($currentUser?->emp_jobtitle ?? '');

    $allowedDepartments = [
      'equipment engineering',
      'mis',
      'process engineering',
      'quality assurance',
      'quality management system',
    ];

    $hasAccess = in_array($dept, $allowedDepartments);

    if ($dept !== 'mis' && !$hasAccess) {
      return response()->json([
        'status' => 'error',
        'error' => 'Unauthorized',
        'message' => 'You are not authorized to perform this action.',
      ], 403);
    }

    return $next($request);
  }
}
