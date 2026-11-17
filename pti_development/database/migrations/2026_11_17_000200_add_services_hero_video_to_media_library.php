<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private string $path = '/videos/services-hero.mp4';

    public function up(): void
    {
        if (DB::table('media')->where('path', $this->path)->exists()) {
            return;
        }

        $file = public_path('videos/services-hero.mp4');
        DB::table('media')->insert([
            'path' => $this->path,
            'name' => 'services-hero.mp4',
            'mime' => 'video/mp4',
            'size' => is_file($file) ? filesize($file) : 0,
            'width' => null,
            'height' => null,
            'alt' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('media')->where('path', $this->path)->delete();
    }
};
