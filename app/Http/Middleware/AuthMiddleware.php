<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AuthMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, $permission = null)
    {
        $token = $request->query('key') ?? $request->bearerToken() ?? session('emp_data.token');
        if (!$token) {
            $redirectUrl = urlencode($request->fullUrl());
            return redirect("http://192.168.2.221/authify/public/login?redirect={$redirectUrl}");
        }

        $cacheKey = 'authify_user_' . $token;

        $currentUser = cache()->remember($cacheKey, now()->addMinutes(10), function () use ($token) {
            return DB::connection('authify')
                ->table('authify.authify_sessions')
                ->where('token', $token)
                ->first();
        });

        $role = strtolower(trim($currentUser->emp_jobtitle));

        $rolesConfig = config('roles');

        if (!array_key_exists($role, $rolesConfig)) {
            return Inertia::render('Forbidden');
        }

        if ($permission && !in_array($permission, $rolesConfig[$role])) {
            return Inertia::render('Forbidden');
        }

        $request->attributes->set('emp_id', $currentUser->emp_id);
        return $next($request);
    }
}
