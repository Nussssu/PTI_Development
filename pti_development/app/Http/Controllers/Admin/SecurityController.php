<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Support\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

/** My security: your profile, password, other signed-in devices and your recent sign-ins. */
class SecurityController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $sessions = config('session.driver') === 'database'
            ? DB::table('sessions')->where('user_id', $user->id)->orderByDesc('last_activity')->get(['id', 'ip_address', 'user_agent', 'last_activity'])
                ->map(fn ($s) => ['ip' => $s->ip_address, 'agent' => self::agent($s->user_agent), 'last' => date(DATE_ATOM, $s->last_activity), 'current' => $s->id === $request->session()->getId()])
            : collect();

        return Inertia::render('Admin/Security', [
            'profile' => ['name' => $user->name, 'email' => $user->email, 'role' => $user->role_label, 'last_login_at' => $user->last_login_at, 'last_login_ip' => $user->last_login_ip],
            'sessions' => $sessions,
            'logins' => AuditLog::where('user_id', $user->id)->whereIn('action', ['login', 'login_failed', 'logout', 'password_changed'])
                ->latest('created_at')->take(10)->get(['id', 'action', 'ip', 'user_agent', 'created_at'])
                ->map(fn ($l) => [...$l->toArray(), 'agent' => self::agent($l->user_agent)]),
        ]);
    }

    public function profile(Request $request): RedirectResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => 'required|string|max:120',
            'email' => ['required', 'email', 'max:190', Rule::unique('users', 'email')->ignore($user->id)],
            'current_password' => $request->input('email') !== $user->email ? 'required|current_password' : 'nullable',
        ], ['current_password.required' => 'Enter your current password to change your sign-in email.']);
        unset($data['current_password']);
        $user->update($data);

        return back()->with('success', 'Profile saved.');
    }

    public function password(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'current_password' => 'required|current_password',
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);
        $request->user()->update(['password' => Hash::make($data['password'])]);
        Audit::log('password_changed', 'Changed own password', $request->user());

        return back()->with('success', 'Password updated.');
    }

    /** Sign out everywhere else (other browsers / phones). */
    public function logoutOthers(Request $request): RedirectResponse
    {
        $request->validate(['current_password' => 'required|current_password']);
        Auth::logoutOtherDevices($request->input('current_password'));
        if (config('session.driver') === 'database') {
            DB::table('sessions')->where('user_id', $request->user()->id)->where('id', '!=', $request->session()->getId())->delete();
        }
        Audit::log('logout_others', 'Signed out all other devices', $request->user());

        return back()->with('success', 'All other devices have been signed out.');
    }

    /** "Chrome on Windows" from a user agent string. */
    public static function agent(?string $ua): string
    {
        if (! $ua) {
            return 'Unknown device';
        }
        $browser = match (true) {
            str_contains($ua, 'Edg/') => 'Edge',
            str_contains($ua, 'OPR/') => 'Opera',
            str_contains($ua, 'Chrome/') => 'Chrome',
            str_contains($ua, 'Firefox/') => 'Firefox',
            str_contains($ua, 'Safari/') => 'Safari',
            default => 'Browser',
        };
        $os = match (true) {
            str_contains($ua, 'Windows') => 'Windows',
            str_contains($ua, 'Android') => 'Android',
            str_contains($ua, 'iPhone') || str_contains($ua, 'iPad') => 'iOS',
            str_contains($ua, 'Mac OS') => 'macOS',
            str_contains($ua, 'Linux') => 'Linux',
            default => 'unknown OS',
        };

        return "$browser on $os";
    }
}
