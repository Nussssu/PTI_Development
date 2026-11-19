<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $guarded = ['id'];

    /** Editable site settings: key => [label, default]. */
    public const FIELDS = [
        'company' => ['Company name', 'PTI Development Ltd.'],
        'tagline' => ['Tagline', 'Invest in Value. Live in Trust.'],
        'phone' => ['Phone', '+880 1608 770711'],
        'email' => ['Email', 'ptidl2024@gmail.com'],
        'whatsapp' => ['WhatsApp number (digits only)', '8801608770711'],
        'address' => ['Address (short)', '802/C, F-F Cottage, Sagufta Housing, Pallabi, Mirpur, Dhaka-1216'],
        'address_long' => ['Address (full)', '802/C, F-F Cottage, Sagufta Housing, Pallabi (beside Pallabi Police Station), Mirpur, Dhaka-1216'],
        'map_query' => ['Office map search', 'Pallabi Police Station, Mirpur, Dhaka'],
        'youtube_id' => ['Home video (YouTube ID)', 'XHOmBV4js_E'],
        'facebook' => ['Facebook URL', ''],
        'instagram' => ['Instagram URL', ''],
        'linkedin' => ['LinkedIn URL', ''],
    ];

    /**
     * Brand logos kept with the settings (Settings → General): key => default file. Empty = the default.
     * The header badge logo and the footer logo live in the header / footer blocks and are edited there too.
     */
    public const BRAND = [
        'logo_favicon' => '/images/pti-logo-vertical.svg',
        'logo_preloader' => null,                     // null = the PTI mark drawn in code
        'logo_email' => '/images/pti-mail-logo.png',
    ];

    /** The brand logos as public URLs (null = draw the built-in PTI mark). */
    public static function brand(): array
    {
        $out = [];
        foreach (self::BRAND as $key => $default) {
            $out[$key] = \App\Support\Media::url(static::extra($key) ?: null) ?: $default;
        }

        return $out;
    }

    /** File on disk for the email logo (it is embedded in every email). */
    public static function emailLogoFile(): string
    {
        $p = static::extra('logo_email') ?: self::BRAND['logo_email'];
        $file = str_starts_with($p, '/') ? public_path(ltrim($p, '/')) : storage_path('app/public/'.ltrim($p, '/'));

        return is_file($file) ? $file : public_path('images/pti-mail-logo.png');
    }

    /**
     * More WhatsApp numbers (Settings → Social links), besides the main one: [['label' => 'Sales', 'number' => '880...'], ...].
     * Shown on the website next to the main number (Contact page cards, project "Talk to our team").
     */
    public static function whatsappMore(): array
    {
        $rows = json_decode((string) static::extra('whatsapp_more', '[]'), true);

        return array_values(array_filter(is_array($rows) ? $rows : [], fn ($r) => is_array($r) && ! empty($r['number'])));
    }

    public static function all_values(): array
    {
        return Cache::rememberForever('site-settings', function () {
            $stored = static::pluck('value', 'key')->all();
            $out = [];
            foreach (self::FIELDS as $key => [, $default]) {
                $out[$key] = $stored[$key] ?? $default;
            }

            return $out;
        });
    }

    public static function put(array $values): void
    {
        foreach ($values as $key => $value) {
            if (array_key_exists($key, self::FIELDS)) {
                static::updateOrCreate(['key' => $key], ['value' => $value]);
            }
        }
        Cache::forget('site-settings');
    }

    /**
     * Settings that are not site details (SMTP / Gmail, custom code, ...): any key outside FIELDS.
     * Cached together; read with extra('key').
     */
    public static function extra(?string $key = null, mixed $default = null): mixed
    {
        $all = Cache::rememberForever('site-settings-extra', fn () => static::whereNotIn('key', array_keys(self::FIELDS))->pluck('value', 'key')->all());

        return $key === null ? $all : ($all[$key] ?? $default);
    }

    public static function putExtra(array $values): void
    {
        foreach ($values as $key => $value) {
            if (! array_key_exists($key, self::FIELDS)) {
                static::updateOrCreate(['key' => $key], ['value' => $value]);
            }
        }
        Cache::forget('site-settings-extra');
    }
}
