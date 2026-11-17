<?php

namespace App\Http\Controllers\Admin;

use App\Cms\Cms;
use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\SiteBlock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Site settings: site details, social links and every brand logo. The header badge logo and the footer logo are
 * the same values as under Menus (header / footer blocks), so both places always show the same file.
 */
class SettingsController extends Controller
{
    /** Logos kept in the header / footer blocks: form key => [block, field]. */
    private const BLOCK_LOGOS = ['header_logo' => ['header', 'logo'], 'footer_logo' => ['footer', 'logo']];

    public function edit(): Response
    {
        $fields = collect(Setting::FIELDS)
            ->map(fn ($f, $key) => ['name' => $key, 'label' => $f[0]])
            ->values();

        $blocks = SiteBlock::all()->keyBy('key');
        $schemas = Cms::blockSchemas();
        $logos = $logoDefaults = [];
        foreach (self::BLOCK_LOGOS as $name => [$block, $field]) {
            $values = Cms::merge($schemas[$block]['fields'], $blocks->get($block)?->content);
            $logos[$name] = $values[$field] ?? null;
            $logoDefaults[$name] = Cms::defaults($schemas[$block]['fields'])[$field] ?? null;
        }
        foreach (Setting::BRAND as $key => $default) {
            $logos[$key] = Setting::extra($key) ?: $default;
            $logoDefaults[$key] = $default;
        }
        $footerValues = Cms::merge($schemas['footer']['fields'], $blocks->get('footer')?->content);
        $socials = $footerValues['socials'];

        return Inertia::render('Admin/Settings', [
            'fields' => $fields,
            'values' => [...Setting::all_values(), ...$logos],
            'logoDefaults' => $logoDefaults,
            'socials' => $socials,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $rules = collect(Setting::FIELDS)->mapWithKeys(fn ($f, $k) => [$k => 'nullable|string|max:500'])->all();
        $rules['email'] = 'required|email';
        $rules['whatsapp'] = 'nullable|regex:/^[0-9]{8,15}$/';
        $rules['facebook'] = $rules['instagram'] = $rules['linkedin'] = 'nullable|url|max:255';
        $rules['socials'] = 'nullable|array|max:30';
        $rules['socials.*.network'] = 'required|in:facebook,instagram,linkedin,youtube,whatsapp,custom';
        $rules['socials.*.label'] = 'nullable|string|max:80';
        $rules['socials.*.url'] = 'nullable|url|max:500';
        $rules['socials.*.enabled'] = 'required|boolean';
        foreach ([...array_keys(self::BLOCK_LOGOS), ...array_keys(Setting::BRAND)] as $logo) {
            $rules[$logo] = 'nullable|string|max:500';
        }

        $before = Setting::all_values();
        $data = $request->validate($rules, ['whatsapp.regex' => 'Digits only, with country code (e.g. 8801608770711).']);
        Setting::put(array_intersect_key($data, Setting::FIELDS));

        $changes = [];
        foreach (array_intersect_key($data, Setting::FIELDS) as $k => $v) {
            if ((string) ($before[$k] ?? '') !== (string) $v) {
                $changes[$k] = [$before[$k] ?? null, $v];
            }
        }

        // brand logos kept with the settings ('' = back to the default file)
        $brand = [];
        foreach (Setting::BRAND as $key => $default) {
            $new = ($data[$key] ?? null) === $default ? '' : (string) ($data[$key] ?? '');
            if ((string) Setting::extra($key, '') !== $new) {
                $changes[$key] = [Setting::extra($key), $new];
                $brand[$key] = $new;
            }
        }
        if ($brand) {
            Setting::putExtra($brand);
        }

        $blocksChanged = false;
        if (array_key_exists('socials', $data)) {
            $footerSchema = Cms::blockSchemas()['footer']['fields'];
            $socialField = collect($footerSchema)->firstWhere('name', 'socials');
            $row = SiteBlock::firstOrNew(['key' => 'footer']);
            $content = $row->content ?? [];
            $previousSocials = Cms::merge([$socialField], ['socials' => $content['socials'] ?? null])['socials'];
            $socials = Cms::clean([$socialField], ['socials' => $data['socials'] ?? []])['socials'];
            if (json_encode($previousSocials) !== json_encode($socials)) {
                $content['socials'] = $socials;
                $row->content = $content;
                $row->updated_by = $request->user()->id;
                $row->save();
                $row->touch();
                $blocksChanged = true;
                $changes['social_links'] = [$previousSocials, $socials];
            }
        }

        // header badge logo / footer logo: written into the header / footer blocks (the same values as under Menus)
        foreach (self::BLOCK_LOGOS as $name => [$block, $field]) {
            $row = SiteBlock::firstOrNew(['key' => $block]);
            $content = $row->content ?? [];
            $current = array_key_exists($field, $content) ? $content[$field] : (Cms::defaults(Cms::blockSchemas()[$block]['fields'])[$field] ?? null);
            $new = $data[$name] ?? null;
            if ((string) $current !== (string) $new) {
                $content[$field] = $new;
                $row->content = $content;
                $row->updated_by = $request->user()->id;
                $row->save();
                $row->touch();
                $blocksChanged = true;
                $changes[$name] = [$current, $new];
            }
        }

        if ($blocksChanged) {
            Cache::forget('cms-blocks-'.strtotime((string) SiteBlock::max('updated_at')));
        }

        if ($changes) {
            \App\Support\Audit::log('settings', 'Updated site settings ('.implode(', ', array_keys($changes)).')', null, $changes);
        }

        return back()->with('success', 'Settings saved.');
    }
}
