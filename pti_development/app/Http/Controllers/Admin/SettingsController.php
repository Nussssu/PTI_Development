<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function edit(): Response
    {
        $fields = collect(Setting::FIELDS)
            ->map(fn ($f, $key) => ['name' => $key, 'label' => $f[0]])
            ->values();

        return Inertia::render('Admin/Settings', [
            'fields' => $fields,
            'values' => Setting::all_values(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $rules = collect(Setting::FIELDS)->mapWithKeys(fn ($f, $k) => [$k => 'nullable|string|max:500'])->all();
        $rules['email'] = 'required|email';
        $rules['whatsapp'] = 'nullable|regex:/^[0-9]{8,15}$/';
        $rules['facebook'] = $rules['instagram'] = $rules['linkedin'] = 'nullable|url|max:255';

        Setting::put($request->validate($rules, ['whatsapp.regex' => 'Digits only, with country code (e.g. 8801608770711).']));

        return back()->with('success', 'Settings saved.');
    }

    public function password(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'current_password' => 'required|current_password',
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);
        $request->user()->update(['password' => Hash::make($data['password'])]);

        return back()->with('success', 'Password updated.');
    }
}
