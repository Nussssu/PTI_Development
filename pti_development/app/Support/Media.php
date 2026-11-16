<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class Media
{
    /** Public URL for a path on the "public" disk (works on any host / port). */
    public static function url(?string $path): ?string
    {
        if (! $path) {
            return null;
        }
        if (str_starts_with($path, 'http') || str_starts_with($path, '/')) {
            return $path;   // remote URL, or a file shipped with the site (public/images/...)
        }

        return '/storage/'.ltrim($path, '/');
    }

    public static function store(UploadedFile $file, string $folder): string
    {
        return $file->store('uploads/'.$folder, 'public');
    }

    /** Copy an uploaded file (for duplicates, so deleting one copy never removes the other's image). */
    public static function copy(?string $path): ?string
    {
        if (! $path || str_starts_with($path, 'http') || str_starts_with($path, '/') || ! Storage::disk('public')->exists($path)) {
            return $path;
        }
        $info = pathinfo($path);
        $new = ($info['dirname'] !== '.' ? $info['dirname'].'/' : '').$info['filename'].'-copy-'.substr(md5(uniqid('', true)), 0, 6).(isset($info['extension']) ? '.'.$info['extension'] : '');
        Storage::disk('public')->copy($path, $new);

        return $new;
    }

    public static function delete(?string $path): void
    {
        if ($path && ! str_starts_with($path, 'http') && ! str_starts_with($path, '/')) {
            Storage::disk('public')->delete($path);
        }
    }
}
