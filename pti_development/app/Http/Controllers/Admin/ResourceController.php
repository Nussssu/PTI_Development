<?php

namespace App\Http\Controllers\Admin;

use App\Admin\Resources;
use App\Http\Controllers\Controller;
use App\Support\Media;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Generic CRUD for every content type registered in App\Admin\Resources.
 */
class ResourceController extends Controller
{
    public function index(string $resource): Response
    {
        $r = Resources::get($resource);
        $items = $r['model']::query()->orderBy('sort_order')->orderBy('id')->get();
        $has = fn ($n) => collect($r['fields'])->contains('name', $n);

        $stats = [['label' => 'Total '.strtolower($r['label']), 'value' => $items->count()]];
        if ($has('is_published')) {
            $stats[] = ['label' => 'Published', 'value' => $items->where('is_published', true)->count()];
            $stats[] = ['label' => 'Draft', 'value' => $items->where('is_published', false)->count()];
        }
        if ($has('is_featured')) {
            $stats[] = ['label' => 'Featured', 'value' => $items->where('is_featured', true)->count()];
        }

        return Inertia::render('Admin/Resource/Index', [
            'resource' => Resources::public($resource),
            'items' => $items,
            'stats' => $stats,
            // tabs = the values of one field (e.g. project status), with counts
            'tabs' => isset($r['tabs']) ? $items->groupBy($r['tabs'])->map->count() : null,
        ]);
    }

    /** Flip a yes/no field from the list (Featured, Published). */
    public function toggle(string $resource, int $id, string $field): RedirectResponse
    {
        $r = Resources::get($resource);
        $f = collect($r['fields'])->firstWhere('name', $field);
        abort_unless($f && $f['type'] === 'boolean', 404);
        $item = $r['model']::findOrFail($id);
        $item->{$field} = ! $item->{$field};
        $item->save();

        return back()->with('success', '"'.\App\Support\Audit::label($item).'": '.strtolower($f['label']).' '.($item->{$field} ? 'on' : 'off').'.');
    }

    /** Move an item up / down in the order (the order on the website). */
    public function move(Request $request, string $resource, int $id): RedirectResponse
    {
        $r = Resources::get($resource);
        $dir = $request->validate(['dir' => 'required|in:up,down'])['dir'];
        $items = $r['model']::query()->orderBy('sort_order')->orderBy('id')->get();
        $pos = $items->search(fn ($i) => $i->id === $id);
        abort_if($pos === false, 404);
        $swap = $dir === 'up' ? $pos - 1 : $pos + 1;
        if ($swap < 0 || $swap >= $items->count()) {
            return back();
        }

        $order = $items->all();
        [$order[$pos], $order[$swap]] = [$order[$swap], $order[$pos]];
        \Illuminate\Support\Facades\DB::transaction(function () use ($order) {
            foreach ($order as $n => $item) {
                if ((int) $item->sort_order !== $n + 1) {
                    $item->sort_order = $n + 1;
                    $item->saveQuietly();
                }
            }
        });
        \App\Support\Audit::log('reordered', 'Moved '.strtolower($r['singular']).' "'.\App\Support\Audit::label($order[$swap]).'" '.$dir, $order[$swap]);

        return back();
    }

    /** Copy an item (images copied too). The copy starts unpublished so it can be edited first. */
    public function duplicate(string $resource, int $id): RedirectResponse
    {
        $r = Resources::get($resource);
        $item = $r['model']::findOrFail($id);
        $copy = $item->replicate();

        foreach ($r['fields'] as $f) {
            $n = $f['name'];
            if ($f['type'] === 'image') {
                $copy->{$n} = Media::copy($item->getRawOriginal($n));
            } elseif ($f['type'] === 'gallery') {
                $copy->{$n} = array_map([Media::class, 'copy'], $item->{$n} ?? []);
            }
        }
        foreach (['name', 'title'] as $t) {
            if (collect($r['fields'])->contains('name', $t)) {
                $copy->{$t} = mb_substr($item->{$t}.' (copy)', 0, 120);
                break;
            }
        }
        if (collect($r['fields'])->contains('name', 'slug')) {
            $base = ($item->slug ?: \Illuminate\Support\Str::slug($item->name ?? 'item')).'-copy';
            $slug = $base;
            for ($n = 2; $r['model']::where('slug', $slug)->exists(); $n++) {
                $slug = $base.'-'.$n;
            }
            $copy->slug = $slug;
        }
        if (collect($r['fields'])->contains('name', 'is_published')) {
            $copy->is_published = false;
        }
        if (collect($r['fields'])->contains('name', 'is_featured')) {
            $copy->is_featured = false;
        }
        $copy->sort_order = (int) $r['model']::max('sort_order') + 1;
        $copy->save();

        return redirect()->route('admin.resource.edit', [$resource, $copy->id])->with('success', $r['singular'].' duplicated. It is hidden until you publish it.');
    }

    public function create(string $resource): Response
    {
        return Inertia::render('Admin/Resource/Form', [
            'resource' => Resources::public($resource),
            'item' => null,
        ]);
    }

    public function store(Request $request, string $resource): RedirectResponse
    {
        $r = Resources::get($resource);
        $this->fill($request, $r, new $r['model']);

        return redirect()->route('admin.resource.index', $resource)->with('success', $r['singular'].' created.');
    }

    public function edit(string $resource, int $id): Response
    {
        $r = Resources::get($resource);

        return Inertia::render('Admin/Resource/Form', [
            'resource' => Resources::public($resource),
            'item' => $r['model']::findOrFail($id),
        ]);
    }

    public function update(Request $request, string $resource, int $id): RedirectResponse
    {
        $r = Resources::get($resource);
        $this->fill($request, $r, $r['model']::findOrFail($id));

        return redirect()->route('admin.resource.index', $resource)->with('success', $r['singular'].' saved.');
    }

    public function destroy(string $resource, int $id): RedirectResponse
    {
        $r = Resources::get($resource);
        $item = $r['model']::findOrFail($id);

        foreach ($r['fields'] as $f) {
            if ($f['type'] === 'image') {
                Media::delete($item->getRawOriginal($f['name']));
            }
            if ($f['type'] === 'gallery') {
                foreach ($item->{$f['name']} ?? [] as $path) {
                    Media::delete($path);
                }
            }
        }
        $item->delete();

        return back()->with('success', $r['singular'].' deleted.');
    }

    private function rules(array $r, Model $item): array
    {
        $rules = [];
        foreach ($r['fields'] as $f) {
            $n = $f['name'];
            switch ($f['type']) {
                case 'image':
                    $rules[$n] = 'nullable|image|max:5120';
                    break;
                case 'gallery':
                    $rules[$n] = 'nullable|array';
                    $rules[$n.'.*'] = 'string';
                    $rules[$n.'_new'] = 'nullable|array';
                    $rules[$n.'_new.*'] = 'image|max:5120';
                    break;
                case 'list':
                    $rules[$n] = 'nullable|array';
                    $rules[$n.'.*'] = 'nullable|string|max:255';
                    break;
                case 'features':
                    $rules[$n] = 'nullable|array';
                    $rules[$n.'.*.label'] = 'nullable|string|max:80';
                    $rules[$n.'.*.value'] = 'nullable|string|max:160';
                    break;
                case 'boolean':
                    $rules[$n] = 'nullable|boolean';
                    break;
                case 'select':
                    $rules[$n] = 'required|in:'.implode(',', $f['options']);
                    break;
                default:
                    $rules[$n] = $f['rules'] ?? 'nullable|string';
            }
        }

        if ($r['slug'] === 'projects') {
            $rules['slug'] .= '|unique:projects,slug'.($item->exists ? ','.$item->id : '');
        }

        return $rules;
    }

    private function fill(Request $request, array $r, Model $item): void
    {
        $data = $request->validate($this->rules($r, $item));
        $folder = $r['slug'];

        foreach ($r['fields'] as $f) {
            $n = $f['name'];
            switch ($f['type']) {
                case 'image':
                    if ($request->hasFile($n)) {
                        Media::delete($item->getRawOriginal($n));
                        $item->{$n} = Media::store($request->file($n), $folder);
                    } elseif ($request->boolean($n.'_remove')) {
                        Media::delete($item->getRawOriginal($n));
                        $item->{$n} = null;
                    }
                    break;
                case 'gallery':
                    $current = $item->{$n} ?? [];
                    $keep = array_values(array_intersect($data[$n] ?? [], $current));
                    foreach (array_diff($current, $keep) as $removed) {
                        Media::delete($removed);
                    }
                    foreach ($request->file($n.'_new', []) as $file) {
                        $keep[] = Media::store($file, $folder.'/gallery');
                    }
                    $item->{$n} = $keep;
                    break;
                case 'list':
                    $item->{$n} = array_values(array_filter($data[$n] ?? [], fn ($v) => filled($v)));
                    break;
                case 'features':
                    $item->{$n} = array_values(array_filter($data[$n] ?? [], fn ($v) => filled($v['label'] ?? null)));
                    break;
                case 'boolean':
                    $item->{$n} = $request->boolean($n);
                    break;
                case 'number':
                    $item->{$n} = (int) ($data[$n] ?? 0);
                    break;
                default:
                    $item->{$n} = $data[$n] ?? null;
            }
        }

        $item->save();
    }
}
