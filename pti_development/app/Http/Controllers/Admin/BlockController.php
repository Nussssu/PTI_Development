<?php

namespace App\Http\Controllers\Admin;

use App\Cms\Cms;
use App\Http\Controllers\Controller;
use App\Models\SiteBlock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Header & Footer: one of each for the whole site, edited in two tabs. */
class BlockController extends Controller
{
    public function edit(): Response
    {
        $stored = SiteBlock::with('editor:id,name')->get()->keyBy('key');
        $blocks = collect(Cms::blockSchemas())->map(fn ($b, $key) => [
            'key' => $key, 'label' => $b['label'], 'description' => $b['description'] ?? null, 'fields' => $b['fields'],
            'values' => Cms::merge($b['fields'], $stored->get($key)?->content),
            'defaults' => Cms::defaults($b['fields']),
            'updated_at' => $stored->get($key)?->updated_at, 'editor' => $stored->get($key)?->editor?->name,
        ])->values();

        return Inertia::render('Admin/Layout/Edit', ['blocks' => $blocks]);
    }

    public function update(Request $request, string $key): RedirectResponse
    {
        $schema = Cms::blockSchemas()[$key];
        $data = $request->validate(['values' => 'nullable|array', 'reset' => 'boolean']);

        SiteBlock::updateOrCreate(['key' => $key], [
            'content' => $request->boolean('reset') ? null : Cms::clean($schema['fields'], $data['values'] ?? []),
            'updated_by' => $request->user()->id,
        ])->touch();

        return back()->with('success', $schema['label'].' saved. Every page now shows the change.');
    }
}
