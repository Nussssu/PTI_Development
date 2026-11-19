<?php

namespace App\Http\Middleware;

use App\Admin\Resources;
use App\Cms\Cms;
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
            'site' => fn () => [...Setting::all_values(), 'whatsapp_more' => Setting::whatsappMore()],
            // header + footer (edited under Header & Footer); the admin panel does not need them
            'blocks' => fn () => $request->is('admin*') ? null : Cms::blocks(),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'auth' => [
                'user' => $user ? ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => $user->role, 'role_label' => $user->role_label, 'can' => $user->abilities()] : null,
            ],
            // admin-only data, sent only when signed in
            'admin' => fn () => $user ? [
                'nav' => Resources::nav(),
                'unread' => Inquiry::whereNull('read_at')->count(),
                'mailLive' => \App\Support\MailSettings::isLive(),
            ] : null,
        ];
    }
}
