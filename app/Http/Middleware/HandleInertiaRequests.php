<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Illuminate\Support\Facades\Log;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        Log::info("request", $request->all());
        Log::info('flash check', [
            'success' => $request->session()->get('success'),
            'all'     => $request->session()->all(),
        ]);

        return [
            ...parent::share($request),
            'emp_data' => fn() => session('emp_data'),
            'flash' => [
                'success' => fn() => session()->get('success'),
                'error'   => fn() => session()->get('error'),
            ],
            // 'flash' => [
            //     'success' => fn() => $request->session()->get('success'),
            //     'error'   => fn() => $request->session()->get('error'),
            // ],
            'auth' => [
                'user' => $request->user(),
            ],
            'appName' => config('app.name'), // This pulls from .env
            'display_name' => env('APP_DISPLAY_NAME', ''),
        ];
    }
}
