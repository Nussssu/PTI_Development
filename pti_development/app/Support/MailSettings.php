<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

/**
 * Outgoing mail, set in Admin → Email & SMTP (stored in the settings table, the password encrypted).
 * Until SMTP is switched on there, the .env mailer is used unchanged.
 */
class MailSettings
{
    public const PRESETS = [
        'gmail' => ['label' => 'Gmail / Google Workspace', 'host' => 'smtp.gmail.com', 'port' => 587, 'encryption' => 'tls'],
        'outlook' => ['label' => 'Outlook / Microsoft 365', 'host' => 'smtp.office365.com', 'port' => 587, 'encryption' => 'tls'],
        'zoho' => ['label' => 'Zoho Mail', 'host' => 'smtp.zoho.com', 'port' => 465, 'encryption' => 'ssl'],
        'custom' => ['label' => 'Other SMTP server (cPanel, hosting, ...)', 'host' => '', 'port' => 587, 'encryption' => 'tls'],
    ];

    /** Everything except the password (never sent back to the browser). */
    public static function get(): array
    {
        $x = fn (string $k, $d = null) => Setting::extra($k, $d);
        $site = Setting::all_values();

        return [
            'enabled' => (bool) $x('smtp_enabled', false),
            'preset' => $x('smtp_preset', 'gmail'),
            'host' => $x('smtp_host', 'smtp.gmail.com'),
            'port' => (int) $x('smtp_port', 587),
            'encryption' => $x('smtp_encryption', 'tls'),
            'username' => $x('smtp_username', ''),
            'has_password' => filled($x('smtp_password')),
            'from_address' => $x('mail_from_address', '') ?: (string) config('mail.from.address'),
            'from_name' => $x('mail_from_name', '') ?: $site['company'],
            'reply_to' => $x('mail_reply_to', '') ?: $site['email'],
            'notify_to' => $x('mail_notify_to', '') ?: $site['email'],
        ];
    }

    public static function password(): ?string
    {
        $enc = Setting::extra('smtp_password');
        if (! $enc) {
            return null;
        }
        try {
            return Crypt::decryptString($enc);
        } catch (\Throwable) {
            return null;
        }
    }

    public static function save(array $data, ?string $newPassword): void
    {
        $values = [
            'smtp_enabled' => $data['enabled'] ? '1' : '0',
            'smtp_preset' => $data['preset'],
            'smtp_host' => $data['host'],
            'smtp_port' => (string) $data['port'],
            'smtp_encryption' => $data['encryption'],
            'smtp_username' => $data['username'],
            'mail_from_address' => $data['from_address'],
            'mail_from_name' => $data['from_name'],
            'mail_reply_to' => $data['reply_to'],
            'mail_notify_to' => $data['notify_to'],
        ];
        if (filled($newPassword)) {
            // Gmail shows app passwords as "abcd efgh ijkl mnop"; the spaces are not part of it
            $values['smtp_password'] = Crypt::encryptString($data['preset'] === 'gmail' ? str_replace(' ', '', $newPassword) : $newPassword);
        }
        Setting::putExtra($values);
        self::apply();
    }

    /** Point Laravel's mailer at the saved SMTP account (called on boot and after saving). */
    public static function apply(): void
    {
        try {
            $s = self::get();
            config([
                'mail.from.address' => $s['from_address'] ?: config('mail.from.address'),
                'mail.from.name' => $s['from_name'] ?: config('mail.from.name'),
            ]);
            if (! $s['enabled'] || ! $s['host']) {
                return;
            }
            config([
                'mail.default' => 'smtp',
                'mail.mailers.smtp' => [
                    'transport' => 'smtp',
                    'scheme' => $s['encryption'] === 'ssl' ? 'smtps' : 'smtp',
                    'host' => $s['host'],
                    'port' => $s['port'],
                    'username' => $s['username'] ?: null,
                    'password' => self::password(),
                    'timeout' => 20,
                    'local_domain' => parse_url((string) config('app.url'), PHP_URL_HOST),
                ],
            ]);
            // the smtp mailer may already be built with the old settings (e.g. right after saving)
            if (app()->resolved('mail.manager')) {
                app('mail.manager')->purge('smtp');
            }
        } catch (\Throwable $e) {
            // tables missing (fresh install / migrating): keep the .env mailer
            if (! app()->runningInConsole()) {
                Log::warning('Mail settings not applied: '.$e->getMessage());
            }
        }
    }

    /** Addresses that get the "new lead" alert. */
    public static function notifyTo(): array
    {
        return collect(preg_split('/[,;\s]+/', self::get()['notify_to']))
            ->filter(fn ($e) => filter_var($e, FILTER_VALIDATE_EMAIL))->values()->all();
    }

    public static function replyTo(): ?string
    {
        $r = self::get()['reply_to'];

        return filter_var($r, FILTER_VALIDATE_EMAIL) ? $r : null;
    }

    /** Human description of where mail goes now (shown in the admin). */
    public static function transportLabel(): string
    {
        $s = self::get();
        if ($s['enabled'] && $s['host']) {
            return 'SMTP: '.$s['host'].':'.$s['port'];
        }

        return match (config('mail.default')) {
            'log' => 'Not set up: emails are only written to the log file',
            'array' => 'Not set up: emails are discarded',
            default => '.env mailer: '.config('mail.default'),
        };
    }

    public static function isLive(): bool
    {
        $s = self::get();

        return ($s['enabled'] && $s['host']) || ! in_array(config('mail.default'), ['log', 'array'], true);
    }
}
