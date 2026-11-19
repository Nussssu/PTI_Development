<?php

namespace App\Http\Controllers\Admin;

use App\Cms\Cms;
use App\Http\Controllers\Controller;
use App\Models\CompanyValue;
use App\Models\Page;
use App\Models\Project;
use App\Models\Stat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Pages: the site's own pages and copies of them. Each page = its template's sections (toggle + content) + SEO.
 */
class PageController extends Controller
{
    public function index(): Response
    {
        Cms::ensurePages();
        $pages = Page::with('editor:id,name')->withCount(['sections', 'sections as enabled_count' => fn ($q) => $q->where('is_enabled', true)])
            ->orderBy('is_system', 'desc')->orderBy('sort_order')->orderBy('id')->get()
            ->map(fn (Page $p) => [
                'id' => $p->id, 'title' => $p->title, 'slug' => $p->slug, 'template' => $p->template,
                'template_label' => Cms::template($p->template)['label'],
                'path' => $this->viewPath($p), 'is_system' => $p->is_system, 'is_published' => $p->is_published,
                'duplicable' => Cms::template($p->template)['duplicable'] ?? false,
                'sections' => $p->sections_count, 'enabled' => $p->enabled_count,
                'updated_at' => $p->updated_at, 'editor' => $p->editor?->name,
            ]);

        $templates = collect(Cms::templates())->filter(fn ($t) => $t['duplicable'] ?? false)
            ->map(fn ($t, $k) => ['key' => $k, 'label' => $t['label']])->values();

        return Inertia::render('Admin/Pages/Index', ['pages' => $pages, 'templates' => $templates]);
    }

    /** Visibility switch in the pages list: publish / hide a page (the home page always stays published). */
    public function toggle(Request $request, Page $page): RedirectResponse
    {
        if ($page->slug === 'home') {
            return back()->with('error', 'The home page is always published.');
        }
        if ($page->slug === 'not-found') {
            return back()->with('error', 'The 404 page is always published: it is shown for every address that does not exist.');
        }
        $page->is_published = ! $page->is_published;
        $page->updated_by = $request->user()->id;
        $page->save();

        return back()->with('success', '"'.$page->title.'" is now '.($page->is_published ? 'published' : 'hidden').'.');
    }

    /** A new page from one of the site's designs, starting with that design's default content. */
    public function store(Request $request): RedirectResponse
    {
        $templates = collect(Cms::templates())->filter(fn ($t) => $t['duplicable'] ?? false)->keys()->all();
        $data = $request->validate([
            'title' => 'required|string|max:120',
            'template' => ['required', Rule::in($templates)],
            'slug' => $this->slugRules(),
        ]);
        $page = Page::create([
            'title' => $data['title'], 'template' => $data['template'], 'is_system' => false, 'is_published' => false,
            'slug' => $data['slug'] ?: $this->uniqueSlug(Str::slug($data['title'])), 'sort_order' => 100,
            'updated_by' => $request->user()->id,
        ]);
        Cms::ensureSections($page);

        return redirect()->route('admin.pages.edit', $page)->with('success', 'Page created. It stays hidden until you publish it.');
    }

    public function edit(Page $page): Response
    {
        Cms::ensureSections($page);
        $t = Cms::template($page->template);
        $rows = $page->sections()->get()->keyBy('key');
        $sectionOrder = $page->sections()->orderBy('sort_order')->orderBy('id')->pluck('key')->all();
        $schemaSections = collect($t['sections'])->keyBy('key');
        $t['sections'] = collect($sectionOrder)->map(fn ($key) => $schemaSections->get($key))->filter()->concat(
            collect($t['sections'])->reject(fn ($s) => in_array($s['key'], $sectionOrder, true))
        )->values()->all();
        $numberPage = in_array($page->slug, ['home', 'about'], true) ? $page->slug : null;

        $sections = collect($t['sections'])->map(function ($s) use ($rows, $page) {
            $row = $rows->get($s['key']);
            $numbersWidget = ($page->slug === 'home' && $s['key'] === 'numbers') || ($page->slug === 'about' && $s['key'] === 'stats');
            $content = Cms::merge($s['fields'], $row?->content);
            if ($page->slug === 'about' && $s['key'] === 'values' && ! array_key_exists('items', $row?->content ?? [])) {
                $content['items'] = CompanyValue::ordered()->get(['id', 'title', 'text', 'image'])
                    ->map(fn (CompanyValue $value) => ['title' => $value->title, 'text' => $value->text])
                    ->all();
            }

            return [
                'key' => $s['key'], 'label' => $s['label'],
                'description' => $numbersWidget ? 'Edit the figures and labels shown on this page.' : ($s['description'] ?? null),
                'source' => $numbersWidget ? null : ($s['source'] ?? null), 'toggle' => $s['toggle'] ?? true, 'fields' => $s['fields'],
                'is_enabled' => $row ? $row->is_enabled : true,
                'customised' => ! empty($row?->content),
                'content' => $content,
                'defaults' => Cms::defaults($s['fields']),
                'updated_at' => $row?->updated_at,
            ];
        })->values();

        return Inertia::render('Admin/Pages/Edit', [
            'page' => [
                'id' => $page->id, 'title' => $page->title, 'slug' => $page->slug, 'template' => $page->template,
                'template_label' => $t['label'], 'is_system' => $page->is_system, 'is_published' => $page->is_published,
                'path' => $this->viewPath($page), 'pattern' => $page->is_system ? $t['path'] : '/'.$page->slug,
                'updated_at' => $page->updated_at, 'editor' => $page->editor?->name,
                'duplicable' => $t['duplicable'] ?? false,
            ],
            'sections' => $sections,
            'numbers' => $numberPage ? Stat::where('page', $numberPage)->ordered()->get(['id', 'value', 'suffix', 'label', 'sort_order']) : [],
            'seo' => ['fields' => Cms::seoFields(), 'values' => Cms::merge(Cms::seoFields(), $page->seo), 'defaults' => $t['seo'] ?? []],
        ]);
    }

    public function update(Request $request, Page $page): RedirectResponse
    {
        $t = Cms::template($page->template);
        $data = $request->validate([
            'title' => 'required|string|max:120',
            'slug' => $page->is_system ? 'nullable' : $this->slugRules($page),
            'is_published' => 'boolean',
            'seo' => 'nullable|array',
            'sections' => 'nullable|array',
            'section_order' => 'nullable|array',
            'section_order.*' => ['required', 'string', Rule::in(collect($t['sections'])->pluck('key')->all())],
            'sections.*.is_enabled' => 'boolean',
            'sections.*.reset' => 'boolean',
            'sections.*.content' => 'nullable|array',
            'sections.arch.content.slide_interval' => 'nullable|integer|min:2|max:60',
            'numbers' => 'sometimes|array',
            'numbers.*.id' => 'nullable|integer',
            'numbers.*.value' => 'required|integer|min:0',
            'numbers.*.suffix' => 'nullable|string|max:8',
            'numbers.*.label' => 'required|string|max:120',
        ]);

        DB::transaction(function () use ($data, $page, $t, $request) {
            $schema = collect($t['sections'])->keyBy('key');
            foreach ($data['sections'] ?? [] as $key => $in) {
                $s = $schema->get($key);
                if (! $s) {
                    continue;
                }
                $existing = $page->sections()->where('key', $key)->first();
                if (! empty($in['reset'])) {
                    $content = null;
                } else {
                    // Clean and apply only submitted fields. Keeping untouched stored values here avoids a partial
                    // widget edit replacing sibling fields with their defaults or empty values.
                    $content = $existing?->content ?? [];
                    $incoming = is_array($in['content'] ?? null) ? $in['content'] : [];
                    foreach ($s['fields'] as $field) {
                        $name = $field['name'];
                        if (array_key_exists($name, $incoming)) {
                            $content[$name] = Cms::clean([$field], [$name => $incoming[$name]])[$name];
                        }
                    }
                }
                $page->sections()->updateOrCreate(['key' => $key], [
                    'is_enabled' => ($s['toggle'] ?? true) ? (bool) ($in['is_enabled'] ?? true) : true,
                    'content' => $content,
                ]);
            }
            if (array_key_exists('section_order', $data)) {
                $validKeys = collect($t['sections'])->pluck('key')->all();
                $orderedKeys = array_values(array_unique(array_filter($data['section_order'], fn ($key) => in_array($key, $validKeys, true))));
                $orderedKeys = array_merge($orderedKeys, array_values(array_diff($validKeys, $orderedKeys)));
                foreach ($orderedKeys as $position => $key) {
                    $page->sections()->where('key', $key)->update(['sort_order' => $position]);
                }
            }
            $page->fill([
                'title' => $data['title'],
                'is_published' => in_array($page->slug, ['home', 'not-found'], true) ? true : (bool) ($data['is_published'] ?? $page->is_published),
                'seo' => Cms::clean(Cms::seoFields(), $data['seo'] ?? []),
                'updated_by' => $request->user()->id,
            ]);
            if (! $page->is_system && ! empty($data['slug'])) {
                $page->slug = $data['slug'];
            }
            $page->updated_at = now();
            $page->save();

            if (array_key_exists('numbers', $data) && in_array($page->slug, ['home', 'about'], true)) {
                $kept = [];
                foreach ($data['numbers'] as $position => $number) {
                    $stat = isset($number['id'])
                        ? Stat::where('page', $page->slug)->find($number['id'])
                        : null;
                    if (! $stat) {
                        $stat = new Stat(['page' => $page->slug]);
                    }
                    $stat->fill([
                        'value' => $number['value'],
                        'suffix' => $number['suffix'] ?? null,
                        'label' => $number['label'],
                        'sort_order' => $position + 1,
                    ]);
                    $stat->save();
                    $kept[] = $stat->id;
                }
                Stat::where('page', $page->slug)->when($kept, fn ($q) => $q->whereNotIn('id', $kept))->when(! $kept, fn ($q) => $q)->delete();
            }
        });

        Cache::forget('cms-page-'.$page->id);

        return back()->with('success', 'Page saved. The website is updated.');
    }

    public function duplicate(Request $request, Page $page): RedirectResponse
    {
        $t = Cms::template($page->template);
        abort_unless($t['duplicable'] ?? false, 403, 'This page design cannot be copied.');

        $copy = DB::transaction(function () use ($page, $request) {
            $copy = $page->replicate(['slug', 'is_system', 'is_published']);
            $copy->title = $page->title.' (copy)';
            $copy->slug = $this->uniqueSlug(($page->slug === 'home' ? 'home' : $page->slug).'-copy');
            $copy->is_system = false;
            $copy->is_published = false;
            $copy->sort_order = 100;
            $copy->updated_by = $request->user()->id;
            $copy->save();
            foreach ($page->sections()->get() as $s) {
                $copy->sections()->create($s->only(['key', 'is_enabled', 'sort_order', 'content']));
            }

            return $copy;
        });

        return redirect()->route('admin.pages.edit', $copy)->with('success', 'Copy created as a hidden draft. Publish it when it is ready.');
    }

    public function destroy(Page $page): RedirectResponse
    {
        abort_if($page->is_system, 403, 'The site\'s own pages cannot be deleted. Switch their sections off instead.');
        $page->delete();

        return redirect()->route('admin.pages.index')->with('success', 'Page deleted.');
    }

    private function slugRules(?Page $ignore = null): array
    {
        return ['nullable', 'string', 'max:80', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::notIn(Cms::RESERVED),
            Rule::unique('pages', 'slug')->ignore($ignore?->id)];
    }

    private function uniqueSlug(string $base): string
    {
        $base = $base ?: 'page';
        if (in_array($base, Cms::RESERVED, true)) {
            $base .= '-page';
        }
        $slug = $base;
        for ($i = 2; Page::where('slug', $slug)->exists(); $i++) {
            $slug = $base.'-'.$i;
        }

        return $slug;
    }

    /** Where "View" opens the page (the project detail design is shown with the first project). */
    private function viewPath(Page $page): string
    {
        if ($page->template === 'project') {
            $first = Project::published()->ordered()->value('slug');

            return $first ? '/projects/'.$first : '/projects';
        }

        return Cms::pathFor($page);
    }
}
