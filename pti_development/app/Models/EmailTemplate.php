<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Emails the website sends, edited in Admin → Email templates.
 * Subject and body are plain text with {placeholders}; they are wrapped in the branded layout (mail/layout).
 */
class EmailTemplate extends Model
{
    use \App\Models\Concerns\Auditable;

    protected string $auditAs = 'email template';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['is_enabled' => 'boolean'];
    }

    public const DEFAULTS = [
        'lead_notification' => [
            'name' => 'New lead alert',
            'to' => 'You (the notification addresses in Email & SMTP)',
            'about' => 'Sent to your team when someone submits the contact form or books a site visit.',
            'can_disable' => true,
            'enabled' => true,
            'subject' => 'New {type} from {name}',
            'body' => "You have a new {type} from the website.\n\nName: {name}\nPhone: {phone}\nEmail: {email}\nProject: {project}\n\nMessage:\n{message}\n\nOpen it in the admin panel:\n{admin_link}",
        ],
        'lead_autoreply' => [
            'name' => 'Auto-reply to the visitor',
            'to' => 'The person who wrote in (only if they gave an email)',
            'about' => 'An instant "we got your message" email. Off until you switch it on.',
            'can_disable' => true,
            'enabled' => false,
            'subject' => 'We received your message | {company}',
            'body' => "Dear {first_name},\n\nThank you for contacting {company}. We have received your {type} and a member of our team will get back to you within one working day.\n\nIf it is urgent, call us on {site_phone}.\n\nBest regards,\n{company}",
        ],
        'reply' => [
            'name' => 'Reply from the inbox',
            'to' => 'The lead you reply to (Leads → Reply)',
            'about' => 'The starting text of the reply box. You can change it before each send.',
            'can_disable' => false,
            'enabled' => true,
            'subject' => 'Re: your {type} to {company}',
            'body' => "Dear {first_name},\n\nThank you for contacting {company}.\n\n\n\nBest regards,\n{admin_name}\n{company}",
        ],
    ];

    public const PLACEHOLDERS = [
        '{name}' => 'Full name of the lead',
        '{first_name}' => 'First name',
        '{email}' => 'Their email',
        '{phone}' => 'Their phone',
        '{message}' => 'What they wrote',
        '{project}' => 'Project they asked about',
        '{type}' => '"message" or "site visit request"',
        '{date}' => 'When they wrote in',
        '{company}' => 'Your company name',
        '{site_phone}' => 'Your phone',
        '{site_email}' => 'Your email',
        '{admin_name}' => 'Who is replying',
        '{admin_link}' => 'Link to the lead in the admin',
    ];

    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /** The saved template, or its default (created on first use). */
    public static function for(string $key): self
    {
        $d = self::DEFAULTS[$key];

        return static::firstOrCreate(['key' => $key], ['subject' => $d['subject'], 'body' => $d['body'], 'is_enabled' => $d['enabled']]);
    }

    public static function ensureAll(): void
    {
        foreach (array_keys(self::DEFAULTS) as $key) {
            self::for($key);
        }
    }

    public function getNameAttribute(): string
    {
        return self::DEFAULTS[$this->key]['name'] ?? $this->key;
    }

    /** @return array{subject: string, body: string} with {placeholders} filled */
    public function fill_in(array $vars): array
    {
        $map = [];
        foreach ($vars as $k => $v) {
            $map['{'.$k.'}'] = (string) $v;
        }

        return ['subject' => strtr($this->subject, $map), 'body' => strtr($this->body, $map)];
    }

    /** Placeholder values for a lead. */
    public static function varsFor(?Inquiry $i = null, ?User $admin = null): array
    {
        $site = Setting::all_values();
        $i?->loadMissing('project');

        return [
            'name' => $i?->full_name ?? 'Rahim Ahmed',
            'first_name' => $i?->first_name ?? 'Rahim',
            'email' => $i ? ($i->email ?: '(not given)') : 'rahim@example.com',
            'phone' => $i?->phone ?? '+880 1711 000000',
            'message' => $i ? ($i->message ?: '(no message)') : 'I am interested in a 3-bedroom flat. Please call me.',
            'project' => $i ? ($i->project?->name ?? '(none)') : 'PTI Shopno Tower-1',
            'type' => ($i?->source ?? 'contact') === 'site_visit' ? 'site visit request' : 'message',
            'date' => ($i?->created_at ?? now())->format('j M Y, g:i a'),
            'company' => $site['company'],
            'site_phone' => $site['phone'],
            'site_email' => $site['email'],
            'admin_name' => $admin?->name ?? auth()->user()?->name ?? $site['company'],
            'admin_link' => $i ? route('admin.inquiries.show', $i) : url('/admin/inquiries'),
        ];
    }
}
