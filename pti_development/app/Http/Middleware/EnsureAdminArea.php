<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** route middleware `area:system` etc. — see User::AREAS. Also signs out users who were deactivated. */
class EnsureAdminArea
{
    public function handle(Request $request, Closure $next, string $area = 'content'): Response
    {
        $user = $request->user();

        if ($user && ! $user->is_active) {
            auth()->logout();
            $request->session()->invalidate();

            return redirect()->route('admin.login')->withErrors(['email' => 'This account has been deactivated.']);
        }

        abort_unless($user && $user->canAccess($area), 403, 'Your role does not have access to this part of the admin panel.');

        return $next($request);
    }
}
