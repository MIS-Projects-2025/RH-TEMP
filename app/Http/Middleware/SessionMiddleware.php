<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Support\Facades\Cookie;

class SessionMiddleware
{
  public function handle(Request $request, Closure $next)
  {
    Log::info('SessionMiddleware triggered', [
      'path'   => $request->path(),
      'url'   => $request->url(),
      'method' => $request->method(),
      'route'  => optional($request->route())->getActionName(),
    ]);

    $tokenFromQuery   = $request->query('key');
    $tokenFromSession = session('emp_data.token');
    $tokenFromCookie  = $request->cookie('sso_token');

    $token = $tokenFromQuery ?? $tokenFromSession ?? $tokenFromCookie;

    if (!$token) {
      return $this->redirectToLogin($request);
    }

    $existing = session('emp_data');
    if ($existing && $existing['token'] === $token) {
      $request->attributes->set('auth_user', (object) $existing);

      if ($tokenFromQuery) {
        $url = $request->url();
        return redirect($url)->withCookie(cookie('sso_token', $token, 60 * 24 * 7));
      }
      return $next($request);
    }

    try {
      $user = DB::connection('authify')->table('authify_sessions')->where('token', $token)->first();
    } catch (\Throwable $e) {
      Log::error('Authify DB unreachable', ['error' => $e->getMessage()]);
      abort(503, 'Authentication service unavailable.');
    }

    if (!$user) {
      session()->forget('emp_data');
      Cookie::queue(Cookie::forget('sso_token'));
      return $this->redirectToLogin($request);
    }

    $request->attributes->set('auth_user', $user);

    session(['emp_data' => [
      'token'         => $user->token,
      'emp_id'        => $user->emp_id,
      'emp_name'      => $user->emp_name,
      'emp_firstname' => $user->emp_firstname,
      'emp_jobtitle'  => $user->emp_jobtitle,
      'emp_dept'      => $user->emp_dept,
      'emp_prodline'  => $user->emp_prodline,
      'emp_station'   => $user->emp_station,
      'generated_at'  => $user->generated_at,
    ]]);

    // session()->save();

    $cookie = cookie('sso_token', $user->token, 60 * 24 * 7, '/', null, false, true);
    $request->setUserResolver(fn() => (object) session('emp_data'));

    if ($tokenFromQuery) {
      $url = $request->url();
      $query = $request->query();
      unset($query['key']);
      if (!empty($query)) {
        $url .= '?' . http_build_query($query);
      }
      return redirect($url)->withCookie($cookie);
    }

    return $next($request)->withCookie($cookie);
  }

  private function redirectToLogin(Request $request)
  {
    $redirectUrl = urlencode($request->fullUrl());
    return Inertia::location("http://192.168.2.221:8200/login?redirect={$redirectUrl}");
  }
}
