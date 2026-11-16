<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Inquiry extends Model
{
    use \App\Models\Concerns\Auditable;

    protected string $auditAs = 'lead';

    /** New leads from the website form are logged too; opening a lead (read_at) is not. */
    protected bool $auditGuests = true;

    protected array $auditIgnore = ['read_at'];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['read_at' => 'datetime', 'replied_at' => 'datetime'];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function replies(): HasMany
    {
        return $this->hasMany(InquiryReply::class)->latest();
    }

    public function getFullNameAttribute(): string
    {
        return trim($this->first_name.' '.$this->last_name);
    }
}
