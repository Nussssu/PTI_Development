<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

class EmailLog extends Model
{
    public const UPDATED_AT = null;

    protected $guarded = ['id'];

    public $timestamps = false;

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    /** Logging is best effort and must never interrupt sending or saving mail settings. */
    public static function record(string $status, string $type, string $recipient = '', string $subject = '', string $description = '', ?string $actor = null): void
    {
        try {
            static::create([
                'status' => $status,
                'type' => mb_substr($type, 0, 80),
                'recipient' => mb_substr($recipient, 0, 1000),
                'subject' => mb_substr($subject, 0, 200),
                'description' => mb_substr($description, 0, 1000),
                'actor' => mb_substr($actor ?? auth()->user()?->name ?? 'Website visitor', 0, 120),
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Email activity log failed: '.$e->getMessage());
        }
    }
}
