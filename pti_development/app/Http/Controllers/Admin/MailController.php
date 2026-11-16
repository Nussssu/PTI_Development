<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\TemplateMail;
use App\Models\EmailTemplate;
use App\Models\Inquiry;
use App\Support\Audit;
use App\Support\MailSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/** Email & SMTP (Gmail etc.) and the editable email templates. */
class MailController extends Controller
{
    public function smtp(): Response
    {
        return Inertia::render('Admin/Mail/Smtp', [
            'settings' => MailSettings::get(),
            'presets' => MailSettings::PRESETS,
            'transport' => MailSettings::transportLabel(),
            'live' => MailSettings::isLive(),
            'recent' => \App\Models\AuditLog::where('action', 'like', 'mail%')->latest('created_at')->take(8)->get(['id', 'action', 'description', 'user_name', 'created_at']),
        ]);
    }

    public function saveSmtp(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'enabled' => 'boolean',
            'preset' => ['required', Rule::in(array_keys(MailSettings::PRESETS))],
            'host' => 'required_if:enabled,true|nullable|string|max:190',
            'port' => 'required|integer|between:1,65535',
            'encryption' => 'required|in:tls,ssl,none',
            'username' => 'required_if:enabled,true|nullable|string|max:190',
            'password' => 'nullable|string|max:255',
            'from_address' => 'required|email|max:190',
            'from_name' => 'required|string|max:120',
            'reply_to' => 'nullable|email|max:190',
            'notify_to' => ['required', 'string', 'max:500', function ($attr, $value, $fail) {
                foreach (preg_split('/[,;\s]+/', $value, -1, PREG_SPLIT_NO_EMPTY) as $e) {
                    if (! filter_var($e, FILTER_VALIDATE_EMAIL)) {
                        $fail('"'.$e.'" is not a valid email address.');
                    }
                }
            }],
        ], [
            'host.required_if' => 'Enter the SMTP server.',
            'username.required_if' => 'Enter the account (for Gmail: the full Gmail address).',
        ]);

        $before = MailSettings::get();
        if ($data['enabled'] && ! $before['has_password'] && blank($data['password'])) {
            return back()->withErrors(['password' => 'Enter the password (for Gmail: a 16-letter App Password).']);
        }
        $note = '';
        if ($data['preset'] === 'gmail' && $data['enabled'] && $data['username'] && strcasecmp($data['from_address'], $data['username']) !== 0) {
            // Gmail rewrites the sender to the signed-in account anyway; say so instead of failing silently
            $note = ' Note: Gmail sends as '.$data['username'].' unless '.$data['from_address'].' is added as a "Send mail as" alias in Gmail.';
        }

        $data['host'] = (string) ($data['host'] ?? '');
        $data['username'] = (string) ($data['username'] ?? '');
        $data['reply_to'] = (string) ($data['reply_to'] ?? '');
        MailSettings::save($data, $data['password'] ?? null);

        $after = MailSettings::get();
        $changes = [];
        foreach ($after as $k => $v) {
            if (($before[$k] ?? null) !== $v) {
                $changes[$k] = [$before[$k] ?? null, $v];
            }
        }
        if (filled($data['password'] ?? null)) {
            $changes['password'] = ['••••', 'changed'];
        }
        Audit::log('mail_settings', 'Updated Email & SMTP settings'.($after['enabled'] ? ' ('.$after['host'].')' : ' (SMTP off)'), null, $changes);

        return back()->with('success', 'Email settings saved. Send a test email to check them.'.$note);
    }

    /** Send a test email with the saved settings. */
    public function test(Request $request): RedirectResponse
    {
        $data = $request->validate(['to' => 'required|email']);
        $site = \App\Models\Setting::all_values();

        try {
            Mail::to($data['to'])->send(new TemplateMail(
                'Test email from '.$site['company'],
                "This is a test email from your website's admin panel.\n\nIf you can read this, your email settings work: lead alerts, auto-replies and replies from the inbox will be delivered.\n\nSent through: ".MailSettings::transportLabel()."\nTime: ".now()->format('j M Y, g:i a'),
            ));
        } catch (\Throwable $e) {
            Audit::log('mail_test_failed', 'Test email to '.$data['to'].' failed: '.mb_substr($e->getMessage(), 0, 300));

            return back()->with('error', 'Test failed: '.self::explain($e->getMessage()));
        }

        Audit::log('mail_test', 'Sent a test email to '.$data['to'].' ('.MailSettings::transportLabel().')');

        return back()->with('success', MailSettings::isLive()
            ? 'Test email sent to '.$data['to'].'. Check the inbox (and spam folder).'
            : 'Test "sent", but mail is not set up yet: it was only written to storage/logs/laravel.log.');
    }

    /** Turn common SMTP errors into advice. */
    private static function explain(string $msg): string
    {
        $short = mb_substr($msg, 0, 220);
        if (str_contains($msg, '535') || str_contains($msg, 'Username and Password not accepted') || str_contains($msg, 'BadCredentials')) {
            return 'the server refused the username / password. For Gmail use an App Password (Google Account → Security → 2-Step Verification → App passwords), not your normal password. ('.$short.')';
        }
        if (str_contains($msg, 'Connection could not be established') || str_contains($msg, 'timed out')) {
            return 'could not reach the mail server. Check the server and port (Gmail: smtp.gmail.com, 587 + TLS or 465 + SSL), and that the hosting allows outgoing SMTP. ('.$short.')';
        }

        return $short;
    }

    /* ---------------- templates ---------------- */

    public function templates(): Response
    {
        EmailTemplate::ensureAll();
        $rows = EmailTemplate::with('editor:id,name')->get()->keyBy('key');

        return Inertia::render('Admin/Mail/Templates', [
            'templates' => collect(EmailTemplate::DEFAULTS)->map(fn ($d, $key) => [
                'id' => $rows[$key]->id,
                'key' => $key,
                'name' => $d['name'],
                'to' => $d['to'],
                'about' => $d['about'],
                'can_disable' => $d['can_disable'],
                'subject' => $rows[$key]->subject,
                'body' => $rows[$key]->body,
                'is_enabled' => $rows[$key]->is_enabled,
                'is_default' => $rows[$key]->subject === $d['subject'] && $rows[$key]->body === $d['body'],
                'updated_at' => $rows[$key]->updated_at,
                'editor' => $rows[$key]->editor?->name,
            ])->values(),
            'placeholders' => EmailTemplate::PLACEHOLDERS,
            'live' => MailSettings::isLive(),
        ]);
    }

    public function saveTemplate(Request $request, string $key): RedirectResponse
    {
        abort_unless(isset(EmailTemplate::DEFAULTS[$key]), 404);
        $data = $request->validate([
            'subject' => 'required|string|max:200',
            'body' => 'required|string|max:10000',
            'is_enabled' => 'boolean',
            'reset' => 'boolean',
        ]);
        $d = EmailTemplate::DEFAULTS[$key];
        $t = EmailTemplate::for($key);
        $t->fill($request->boolean('reset')
            ? ['subject' => $d['subject'], 'body' => $d['body']]
            : ['subject' => $data['subject'], 'body' => $data['body']]);
        $t->is_enabled = $d['can_disable'] ? $request->boolean('is_enabled') : true;
        $t->updated_by = $request->user()->id;
        $t->save();

        return back()->with('success', $request->boolean('reset') ? '"'.$d['name'].'" reset to the original text.' : '"'.$d['name'].'" saved.');
    }

    /** HTML preview of a template with sample (or a real lead's) data; used in an iframe. */
    public function preview(Request $request): \Illuminate\Http\Response
    {
        $data = $request->validate(['subject' => 'nullable|string|max:200', 'body' => 'nullable|string|max:10000', 'key' => 'nullable|string']);
        $lead = Inquiry::latest()->first();
        $vars = EmailTemplate::varsFor($lead, $request->user());
        $t = (new EmailTemplate(['subject' => $data['subject'] ?? '', 'body' => $data['body'] ?? '']))->fill_in($vars);
        $quote = in_array($data['key'] ?? '', ['reply', 'lead_autoreply'], true) ? $vars['message'] : null;

        return response(TemplateMail::preview($t['subject'], $t['body'], $quote, 'Your message'))
            ->header('Content-Type', 'text/html; charset=utf-8')
            ->header('X-Frame-Options', 'SAMEORIGIN');
    }

    /** Send a template to yourself with sample data. */
    public function sendTemplateTest(Request $request, string $key): RedirectResponse
    {
        abort_unless(isset(EmailTemplate::DEFAULTS[$key]), 404);
        $t = EmailTemplate::for($key)->fill_in(EmailTemplate::varsFor(Inquiry::latest()->first(), $request->user()));
        try {
            Mail::to($request->user()->email)->send(new TemplateMail('[Test] '.$t['subject'], $t['body']));
        } catch (\Throwable $e) {
            return back()->with('error', 'Test failed: '.self::explain($e->getMessage()));
        }
        Audit::log('mail_test', 'Sent a test of "'.EmailTemplate::DEFAULTS[$key]['name'].'" to '.$request->user()->email);

        return back()->with('success', 'Test sent to '.$request->user()->email.'.');
    }
}
