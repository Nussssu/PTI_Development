<?php

namespace App\Cms;

use App\Models\Page;
use App\Models\PageSection;
use App\Models\SiteBlock;
use App\Support\Media;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * The CMS core: page templates and their sections, the header / footer blocks, and turning stored content into
 * what the website receives (stored values over the template defaults, file paths turned into URLs).
 */
class Cms
{
    /** URL slugs a copied page may not take (they belong to the site's own routes). */
    public const RESERVED = ['home', 'about', 'services', 'projects', 'contact', 'admin', 'storage', 'inquiries', 'up', 'login', 'build', 'images', 'videos'];

    private static ?array $templates = null;

    /* ------------------------------------------------------------------ templates */

    /** Every page design: key => [label, component, slug, path, duplicable, seo, sections]. */
    public static function templates(): array
    {
        if (static::$templates === null) {
            static::$templates = [];
            foreach (['home', 'about', 'services', 'projects', 'project', 'contact'] as $key) {
                static::$templates[$key] = require __DIR__.'/Templates/'.Str::studly($key).'.php';
            }
        }

        return static::$templates;
    }

    public static function template(string $key): array
    {
        $all = static::templates();
        abort_unless(isset($all[$key]), 404);

        return $all[$key] + ['key' => $key];
    }

    public static function blockSchemas(): array
    {
        return require __DIR__.'/Blocks.php';
    }

    /* ------------------------------------------------------------------ pages */

    /** Make sure every built-in page (and each of its sections) has a row, so it can be listed and edited. */
    public static function ensurePages(): void
    {
        $order = 0;
        foreach (static::templates() as $key => $t) {
            $order++;
            if (empty($t['slug'])) {
                continue;
            }
            $page = Page::firstOrCreate(['slug' => $t['slug']], [
                'title' => $t['label'], 'template' => $key, 'is_system' => true, 'is_published' => true, 'sort_order' => $order,
            ]);
            static::ensureSections($page);
        }
    }

    public static function ensureSections(Page $page): void
    {
        $existing = $page->sections()->pluck('key')->all();
        foreach (static::template($page->template)['sections'] as $i => $s) {
            if (! in_array($s['key'], $existing, true)) {
                $page->sections()->create(['key' => $s['key'], 'is_enabled' => true, 'sort_order' => $i, 'content' => null]);
            }
        }
    }

    /** A built-in page by its slug (created on first use). */
    public static function system(string $slug): Page
    {
        $page = Page::where('slug', $slug)->first();
        if (! $page) {
            static::ensurePages();
            $page = Page::where('slug', $slug)->firstOrFail();
        }

        return $page;
    }

    public static function pathFor(Page $page): string
    {
        $t = static::template($page->template);
        if ($page->is_system) {
            return $t['path'];
        }

        return '/'.$page->slug;
    }

    /** What the website receives for a page: SEO + every section's content, enabled flag included. */
    public static function payload(Page $page): array
    {
        return Cache::rememberForever('cms-page-'.$page->id, function () use ($page) {
            $t = static::template($page->template);
            $stored = $page->sections()->get()->keyBy('key');
            $sections = [];
            foreach ($t['sections'] as $s) {
                /** @var PageSection|null $row */
                $row = $stored->get($s['key']);
                $values = static::merge($s['fields'], $row?->content);
                $sections[$s['key']] = ['enabled' => $row ? $row->is_enabled : true] + static::publish($s['fields'], $values);
            }

            return [
                'page' => ['id' => $page->id, 'title' => $page->title, 'slug' => $page->slug, 'template' => $page->template],
                'seo' => static::seo($page, $t),
                'sections' => $sections,
            ];
        });
    }

    public static function seoFields(): array
    {
        return [
            F::text('title', 'Meta title', '', 'Shown in the browser tab and as the Google headline. 50-60 characters is ideal.'),
            F::textarea('description', 'Meta description', '', 'The short summary under the headline in search results. 120-160 characters is ideal.'),
            F::text('keywords', 'Keywords', '', 'Comma separated, e.g. apartments in Mirpur, land share Dhaka'),
            F::image('image', 'Social share image', null, false, 'Shown when the page is shared on Facebook, WhatsApp, LinkedIn... (1200x630 works best).'),
            F::text('canonical', 'Canonical URL', '', 'Only if this page is a copy of another one; otherwise leave empty.'),
            F::toggle('noindex', 'Hide from search engines', false),
        ];
    }

    private static function seo(Page $page, array $t): array
    {
        $values = static::merge(static::seoFields(), $page->seo);
        $values['title'] = $values['title'] ?: ($t['seo']['title'] ?? $page->title);
        $values['description'] = $values['description'] ?: ($t['seo']['description'] ?? '');
        $values['image'] = Media::url($values['image'] ?: ($t['seo']['image'] ?? null));

        return $values;
    }

    /* ------------------------------------------------------------------ header / footer */

    public static function blocks(): array
    {
        $stamp = SiteBlock::max('updated_at');

        return Cache::rememberForever('cms-blocks-'.strtotime((string) $stamp), function () {
            $stored = SiteBlock::all()->keyBy('key');
            $out = [];
            foreach (static::blockSchemas() as $key => $b) {
                $out[$key] = static::publish($b['fields'], static::merge($b['fields'], $stored->get($key)?->content));
            }

            return $out;
        });
    }

    /* ------------------------------------------------------------------ field values */

    public static function defaults(array $fields): array
    {
        return collect($fields)->mapWithKeys(fn ($f) => [$f['name'] => $f['default'] ?? null])->all();
    }

    /** Stored values over the defaults, field by field. */
    public static function merge(array $fields, ?array $stored): array
    {
        $stored ??= [];
        $out = [];
        foreach ($fields as $f) {
            $n = $f['name'];
            $default = $f['default'] ?? null;
            if (! array_key_exists($n, $stored)) {
                $out[$n] = $default;
                continue;
            }
            $v = $stored[$n];
            $out[$n] = match ($f['type']) {
                'link' => ['label' => $v['label'] ?? '', 'href' => $v['href'] ?? ''],
                'image' => ! empty($f['responsive'])
                    ? ['desktop' => is_array($v) ? ($v['desktop'] ?? null) : $v, 'mobile' => is_array($v) ? ($v['mobile'] ?? null) : null]
                    : (is_array($v) ? ($v['desktop'] ?? null) : $v),
                'repeater' => is_array($v) ? array_map(fn ($row) => static::merge($f['fields'], is_array($row) ? $row : []), $v) : $default,
                default => $v,
            };
        }

        return $out;
    }

    /** Values ready for the browser: stored file paths become URLs. */
    public static function publish(array $fields, array $values): array
    {
        foreach ($fields as $f) {
            $n = $f['name'];
            $v = $values[$n] ?? null;
            if ($f['type'] === 'image') {
                $values[$n] = ! empty($f['responsive'])
                    ? ['desktop' => Media::url($v['desktop'] ?? null), 'mobile' => Media::url($v['mobile'] ?? null)]
                    : Media::url($v);
            } elseif ($f['type'] === 'video') {
                $values[$n] = Media::url($v);
            } elseif ($f['type'] === 'repeater') {
                $values[$n] = array_map(fn ($row) => static::publish($f['fields'], $row), $v ?? []);
            }
        }

        return $values;
    }

    /** Values from the admin form, checked and tidied before they are stored. */
    public static function clean(array $fields, mixed $input): array
    {
        $input = is_array($input) ? $input : [];
        $out = [];
        foreach ($fields as $f) {
            $n = $f['name'];
            $v = $input[$n] ?? null;
            $out[$n] = match ($f['type']) {
                'number' => is_numeric($v) ? $v + 0 : ($f['default'] ?? 0),
                'toggle' => filter_var($v, FILTER_VALIDATE_BOOLEAN),
                'select' => array_key_exists((string) $v, $f['options']) ? (string) $v : ($f['default'] ?? null),
                'link' => ['label' => static::str($v['label'] ?? '', 200), 'href' => static::href($v['href'] ?? '')],
                'image' => ! empty($f['responsive'])
                    ? ['desktop' => static::path(is_array($v) ? ($v['desktop'] ?? null) : $v), 'mobile' => static::path(is_array($v) ? ($v['mobile'] ?? null) : null)]
                    : static::path(is_array($v) ? ($v['desktop'] ?? null) : $v),
                'video' => static::path($v),
                'list' => array_values(array_filter(array_map(fn ($x) => static::str($x, 500), is_array($v) ? $v : []), 'strlen')),
                'repeater' => array_values(array_map(fn ($row) => static::clean($f['fields'], $row), array_slice(is_array($v) ? $v : [], 0, 100))),
                default => static::str($v, 10000),
            };
        }

        return $out;
    }

    private static function str(mixed $v, int $max): string
    {
        return is_scalar($v) ? mb_substr(trim((string) $v), 0, $max) : '';
    }

    private static function href(mixed $v): string
    {
        $v = static::str($v, 500);

        return preg_match('/^\s*(javascript|data|vbscript):/i', $v) ? '' : $v;
    }

    /** A file reference: a site file (/images/...), an upload (uploads/...) or a full URL. */
    private static function path(mixed $v): ?string
    {
        $v = static::str($v, 500);
        if ($v === '' || str_contains($v, '..')) {
            return null;
        }

        return preg_match('#^(/|uploads/|seed/|https?://)#', $v) ? $v : null;
    }
}
