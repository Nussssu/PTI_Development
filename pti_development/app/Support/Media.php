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
        if (str_starts_with($path, 'http')) {
            return $path;
        }

        return '/storage/'.ltrim($path, '/');
    }

    public static function store(UploadedFile $file, string $folder): string
    {
        return $file->store('uploads/'.$folder, 'public');
    }

    public static function delete(?string $path): void
    {
        if ($path && ! str_starts_with($path, 'http')) {
            Storage::disk('public')->delete($path);
        }
    }
}
