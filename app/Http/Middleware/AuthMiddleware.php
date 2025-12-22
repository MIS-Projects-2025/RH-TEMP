<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {

        // COMMENT OUT IF NO SPECIFIC DEPT OR JOB TITLE
        if (session('emp_data') && !in_array(session('emp_data')['emp_dept'], ['MIS', 'Human Resource'])) {
            return redirect()->route('unauthorized');
        }

        return $next($request);
    }
}
