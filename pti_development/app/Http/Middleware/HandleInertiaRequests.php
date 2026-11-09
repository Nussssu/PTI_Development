<?php

namespace App\Http\Middleware;

use App\Admin\Resources;
use App\Models\Inquiry;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'site' => fn () => Setting::all_values(),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
            ],
            'auth' => [
                'user' => $user ? ['id' => $user->id, 'name' => $user->name, 'email' => $user->email] : null,
            ],
            // admin-only data, sent only when signed in
            'admin' => fn () => $user ? [
                'nav' => Resources::nav(),
                'unread' => Inquiry::whereNull('read_at')->count(),
            ] : null,
        ];
    }
}
