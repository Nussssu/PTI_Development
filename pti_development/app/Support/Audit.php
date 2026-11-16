<?php

namespace App\Support;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

/** Writes the audit log (Admin → Audit log). Never throws: logging must not break the action it records. */
class Audit
{
    /** Fields never written into the log. */
    public const HIDDEN = ['password', 'remember_token', 'updated_at', 'created_at', 'updated_by', 'smtp_password'];

    public static function log(string $action, string $description, ?Model $subject = null, array $changes = [], ?User $user = null): void
    {
        try {
            $user ??= auth()->user();
            $request = app()->runningInConsole() ? null : request();

            AuditLog::create([
                'user_id' => $user?->id,
                'user_name' => $user?->name ?? ($request ? 'Website visitor' : 'System'),
                'action' => $action,
                'subject_type' => $subject ? class_basename($subject) : null,
                'subject_id' => $subject?->getKey(),
                'subject_label' => $subject ? self::label($subject) : null,
                'description' => mb_substr($description, 0, 500),
                'changes' => $changes ? self::clean($changes) : null,
                'ip' => $request?->ip(),
                'user_agent' => $request ? mb_substr((string) $request->userAgent(), 0, 255) : null,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Audit log failed: '.$e->getMessage());
        }
    }

    /** A readable name for a record: its name / title / subject, else "#id". */
    public static function label(Model $m): string
    {
        foreach (['title', 'name', 'subject', 'key', 'email'] as $attr) {
            if (filled($m->getAttribute($attr)) && is_string($m->getAttribute($attr))) {
                return mb_substr($m->getAttribute($attr), 0, 190);
            }
        }
        if ($m->getAttribute('first_name')) {
            return trim($m->first_name.' '.$m->last_name);
        }

        return '#'.$m->getKey();
    }

    /** Drop hidden fields; shorten long values so one log row stays small. */
    private static function clean(array $changes): array
    {
        $out = [];
        foreach ($changes as $field => [$old, $new]) {
            if (in_array($field, self::HIDDEN, true)) {
                continue;
            }
            $out[$field] = [self::short($old), self::short($new)];
        }

        return $out;
    }

    private static function short(mixed $v): mixed
    {
        if (is_array($v) || is_object($v)) {
            $v = json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }

        return is_string($v) && mb_strlen($v) > 300 ? mb_substr($v, 0, 300).'…' : $v;
    }
}
