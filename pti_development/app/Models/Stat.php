<?php

namespace App\Models;

use App\Models\Concerns\HasMediaUrls;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Stat extends Model
{
    use HasMediaUrls;

    protected $guarded = ['id'];

    protected array $mediaFields = ['image'];

    protected function casts(): array
    {
        return ['value' => 'integer'];
    }

    public function scopeOrdered(Builder $q): Builder
    {
        return $q->orderBy('sort_order')->orderBy('id');
    }
}
