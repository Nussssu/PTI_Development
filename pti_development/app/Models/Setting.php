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
}
