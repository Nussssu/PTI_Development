<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

/** User management (super admins only): who can sign in to the admin panel and with which role. */
class UserController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Users/Index', [
            'users' => User::orderByRaw("FIELD(role, 'super_admin', 'admin', 'editor')")->orderBy('name')
                ->get(['id', 'name', 'email', 'role', 'is_active', 'last_login_at', 'last_login_ip', 'created_at']),
            'roles' => User::ROLES,
            'roleHelp' => User::ROLE_HELP,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate($this->rules());
        $user = User::create($data);

        return back()->with('success', $user->name.' can now sign in as '.$user->role_label.'.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate($this->rules($user));
        if (blank($data['password'] ?? null)) {
            unset($data['password']);
        }

        if ($user->is($request->user())) {
            // you cannot lock yourself out
            $data['role'] = $user->role;
            $data['is_active'] = true;
        } elseif ($user->role === 'super_admin' && ($data['role'] !== 'super_admin' || ! $data['is_active']) && $this->superAdmins() <= 1) {
            return back()->with('error', 'There must always be at least one active super admin.');
        }

        $user->update($data);

        return back()->with('success', $user->name.' saved.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->is($request->user())) {
            return back()->with('error', 'You cannot delete your own account.');
        }
        if ($user->role === 'super_admin' && $this->superAdmins() <= 1) {
            return back()->with('error', 'There must always be at least one active super admin.');
        }

        DB::table('sessions')->where('user_id', $user->id)->delete();
        $user->delete();

        return back()->with('success', $user->name.' deleted.');
    }

    private function superAdmins(): int
    {
        return User::where('role', 'super_admin')->where('is_active', true)->count();
    }

    private function rules(?User $user = null): array
    {
        return [
            'name' => 'required|string|max:120',
            'email' => ['required', 'email', 'max:190', Rule::unique('users', 'email')->ignore($user?->id)],
            'role' => ['required', Rule::in(array_keys(User::ROLES))],
            'is_active' => 'boolean',
            'password' => [$user ? 'nullable' : 'required', Password::min(8)->letters()->numbers()],
        ];
    }
}
