<?php

namespace App\Models;

use App\Models\Concerns\HasMediaUrls;
use App\Support\Media;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Project extends Model
{
    use HasMediaUrls;

    protected $guarded = ['id'];

    protected array $mediaFields = ['image'];

    protected $appends = ['gallery_urls'];

    protected function casts(): array
    {
        return [
            'features' => 'array',
            'gallery' => 'array',
            'is_featured' => 'boolean',
            'is_published' => 'boolean',
            'units' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Project $p) {
            if (! $p->slug) {
                $base = Str::slug($p->name);
                $slug = $base;
                $i = 2;
                while (static::where('slug', $slug)->where('id', '!=', $p->id)->exists()) {
                    $slug = $base.'-'.$i++;
                }
                $p->slug = $slug;
            }
        });
    }

    public function getGalleryUrlsAttribute(): array
    {
        return array_values(array_map([Media::class, 'url'], $this->gallery ?? []));
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function scopeOrdered(Builder $q): Builder
    {
        return $q->orderBy('sort_order')->orderBy('id');
    }

    public function scopePublished(Builder $q): Builder
    {
        return $q->where('is_published', true);
    }

    public function inquiries(): HasMany
    {
        return $this->hasMany(Inquiry::class);
    }
}
