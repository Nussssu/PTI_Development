<?php

namespace App\Models;

use App\Models\Concerns\HasMediaUrls;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Testimonial extends Model
{
    use HasMediaUrls;

    protected $guarded = ['id'];

    protected array $mediaFields = ['photo'];

    protected function casts(): array
    {
        return ['is_published' => 'boolean'];
    }

    public function scopeOrdered(Builder $q): Builder
    {
        return $q->orderBy('sort_order')->orderBy('id');
    }
}
