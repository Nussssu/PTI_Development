<?php

namespace App\Models\Concerns;

use App\Support\Audit;

/**
 * Records create / update / delete of a model in the audit log, with the changed fields (old → new).
 * Only changes made by a signed-in admin are recorded, plus anything a model opts into via $auditGuests.
 */
trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function ($m) {
            if ($m->shouldAudit()) {
                Audit::log('created', 'Created '.$m->auditName().' "'.Audit::label($m).'"', $m);
            }
        });

        static::updated(function ($m) {
            if (! $m->shouldAudit()) {
                return;
            }
            $changes = [];
            foreach ($m->getChanges() as $field => $new) {
                if (in_array($field, Audit::HIDDEN, true) || in_array($field, $m->auditIgnore ?? [], true)) {
                    continue;
                }
                $changes[$field] = [$m->getOriginal($field), $new];
            }
            if ($changes) {
                Audit::log('updated', 'Updated '.$m->auditName().' "'.Audit::label($m).'" ('.implode(', ', array_keys($changes)).')', $m, $changes);
            }
        });

        static::deleted(function ($m) {
            if ($m->shouldAudit()) {
                Audit::log('deleted', 'Deleted '.$m->auditName().' "'.Audit::label($m).'"', $m);
            }
        });
    }

    protected function shouldAudit(): bool
    {
        return auth()->check() || ($this->auditGuests ?? false);
    }

    public function auditName(): string
    {
        return $this->auditAs ?? strtolower(preg_replace('/(?<!^)[A-Z]/', ' $0', class_basename($this)));
    }
}
