<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** The header and footer, edited apart from the pages. */
class SiteBlock extends Model
{
    use \App\Models\Concerns\Auditable;

    protected string $auditAs = 'menu';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['content' => 'array'];
    }

    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
