<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cookie;

class AuthenticationController extends Controller
{
    public function setSession(Request $request)
    {
        $token = $request->input('queryToken');

        // dd($request->all());

        $cacheKey = 'authify_user_' . $token;
        $currentUser = cache()->remember($cacheKey, now()->addMinutes(10), function () use ($token) {
            return DB::connection('authify')
                ->table('authify.authify_sessions')
                ->where('token', $token)
                ->first();
        });


        // $isAdmin = DB::table('admin')
        //     ->where('emp_id', $currentUser->emp_id)
        //     ->first();

        // Set session
        $empData = [
            'token' => $currentUser->token,
            'emp_id' => $currentUser->emp_id,
            'emp_name' => $currentUser->emp_name,
            'emp_firstname' => $currentUser->emp_firstname,
            'emp_jobtitle' => $currentUser->emp_jobtitle,
            'emp_dept' => $currentUser->emp_dept,
            'emp_prodline' => $currentUser->emp_prodline,
            'emp_station' => $currentUser->emp_station,
            'generated_at' => $currentUser->generated_at,
        ];

        session(['emp_data' => $empData]);

        return response()->json([
            'emp_data' => $empData
        ]);
    }


    public function logout(Request $request)
    {
        $token = session('emp_data.token');
        if ($token) {
            cache()->forget('authify_user_' . $token);
        }

        session()->forget('emp_data');
        session()->flush();


        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $redirectUrl = urlencode(route('dashboard'));
        return redirect("http://192.168.1.27:8080/authify/public/logout?redirect={$redirectUrl}")
            ->withCookie(cookie()->forget('sso_token'));
    }
}
