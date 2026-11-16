<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use \App\Models\Concerns\Auditable;

    protected array $auditIgnore = ['last_login_at', 'last_login_ip'];

    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /** Roles and what they can open in the admin panel. */
    public const ROLES = [
        'super_admin' => 'Super Admin',
        'admin' => 'Admin',
        'editor' => 'Editor',
    ];

    public const ROLE_HELP = [
        'super_admin' => 'Everything, including users and custom code.',
        'admin' => 'Leads, content, email & SMTP, settings and the audit log. Cannot manage users or custom code.',
        'editor' => 'Leads and content (pages, projects, media, menus) only.',
    ];

    /** area => roles allowed */
    private const AREAS = [
        'leads' => ['super_admin', 'admin', 'editor'],
        'content' => ['super_admin', 'admin', 'editor'],
        'system' => ['super_admin', 'admin'],   // settings, email & SMTP, email templates, audit log
        'users' => ['super_admin'],
        'code' => ['super_admin'],              // custom code can run scripts on the site
    ];

    protected $fillable = ['name', 'email', 'password', 'role', 'is_active', 'last_login_at', 'last_login_ip'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'is_active' => 'boolean',
            'password' => 'hashed',
        ];
    }

    public function canAccess(string $area): bool
    {
        return in_array($this->role, self::AREAS[$area] ?? [], true);
    }

    /** {area: bool} for the admin UI (hides menu items the user cannot open). */
    public function abilities(): array
    {
        return collect(array_keys(self::AREAS))->mapWithKeys(fn ($a) => [$a => $this->canAccess($a)])->all();
    }

    public function getRoleLabelAttribute(): string
    {
        return self::ROLES[$this->role] ?? ucfirst((string) $this->role);
    }
}
