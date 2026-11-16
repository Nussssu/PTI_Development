<?php

namespace App\Models;

use App\Models\Concerns\HasMediaUrls;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class CompanyValue extends Model
{
    use \App\Models\Concerns\Auditable;

    protected string $auditAs = 'value';

    use HasMediaUrls;

    protected $guarded = ['id'];

    protected array $mediaFields = ['image'];

    protected function casts(): array
    {
        return [];
    }

    public function scopeOrdered(Builder $q): Builder
    {
        return $q->orderBy('sort_order')->orderBy('id');
    }
}
