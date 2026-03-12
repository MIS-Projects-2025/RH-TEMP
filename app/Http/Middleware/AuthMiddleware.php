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
    public function handle(Request $request, Closure $next)
    {
        Log::info('AuthMiddleware triggered', [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'route_name' => optional($request->route())->getName(),
            'route_action' => optional($request->route())->getActionName(),
            'all_params' => $request->all(),
        ]);

        $user = $request->attributes->get('auth_user');
        Log::info('auth_user', (array) $user);

        if (!$user) {
            abort(403);
        }

        $request->attributes->set('emp_id', $user->emp_id);
        return $next($request);
    }
}
