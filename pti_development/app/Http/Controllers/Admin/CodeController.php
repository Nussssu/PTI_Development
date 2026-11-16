<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Support\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Custom code (super admins only): tracking / chat / verification snippets printed on every public page
 * (Google Analytics, Meta Pixel, Search Console, live chat ...). Never printed in the admin panel.
 */
class CodeController extends Controller
{
    private const SLOTS = ['head', 'body_start', 'body_end'];

    public function edit(): Response
    {
        return Inertia::render('Admin/Code', [
            'code' => collect(self::SLOTS)->mapWithKeys(fn ($k) => [$k => (string) Setting::extra('code_'.$k, '')])->all(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate(collect(self::SLOTS)->mapWithKeys(fn ($k) => [$k => 'nullable|string|max:20000'])->all());

        $changes = [];
        $values = [];
        foreach (self::SLOTS as $k) {
            $old = (string) Setting::extra('code_'.$k, '');
            $new = trim((string) ($data[$k] ?? ''));
            $values['code_'.$k] = $new;
            if ($old !== $new) {
                $changes[$k] = [$old, $new];
            }
        }
        Setting::putExtra($values);
        if ($changes) {
            Audit::log('custom_code', 'Updated custom code ('.implode(', ', array_keys($changes)).')', null, $changes);
        }

        return back()->with('success', 'Custom code saved. It is live on the website now.');
    }
}
