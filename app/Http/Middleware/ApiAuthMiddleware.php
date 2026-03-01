<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ApiAuthMiddleware
{
  /**
   * Handle an incoming request.
   *
   * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
   */
  public function handle(Request $request, Closure $next, $permission = null): Response
  {
    return $next($request);

    // $empData = session('emp_data');
    // if (!$empData || !isset($empData['token'])) {
    //   return response()->json(['error' => 'Unauthenticated', 'message' => 'You are not logged in'], 401);
    // }

    // $token = $empData['token'];

    // $cacheKey = 'authify_user_' . $token;

    // $currentUser = cache()->remember($cacheKey, now()->addMinutes(10), function () use ($token) {
    //   return DB::connection('authify')
    //     ->table('authify.authify_sessions')
    //     ->where('token', $token)
    //     ->first();
    // });

    // if (!$currentUser) {
    //   return response()->json(['error' => 'Unauthenticated', 'message' => 'You are not logged in'], 401);
    // }

    // $role = strtolower(trim($currentUser->emp_jobtitle));
    // $rolesConfig = config('roles');

    // if (!array_key_exists($role, $rolesConfig) || (!in_array($permission, $rolesConfig[$role]) && $permission !== null)) {
    //   return response()->json([
    //     'status' => 'error',
    //     'error' => 'Unauthorized',
    //     'message' => 'You are not authorized to access this resource',
    //   ], 403);
    // }

    // $request->attributes->set('emp_id', $currentUser->emp_id);

    // return $next($request);
  }
}
