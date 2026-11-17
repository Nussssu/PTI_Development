<?php

namespace App\Http\Controllers;

use App\Mail\NewInquiry;
use App\Mail\TemplateMail;
use App\Models\EmailTemplate;
use App\Models\EmailLog;
use App\Models\Inquiry;
use App\Models\Setting;
use App\Support\MailSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class InquiryController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $siteVisit = $request->input('source') === 'site_visit';
        $optional = $siteVisit ? 'nullable' : 'required';

        $data = $request->validate([
            'source' => 'nullable|in:contact,site_visit',
            'project_id' => 'nullable|exists:projects,id',
            'first_name' => 'required|string|max:80',
            'last_name' => $optional.'|string|max:80',
            'email' => $optional.'|email|max:160',
            'phone' => ['required', 'string', 'max:30', 'regex:/^[0-9+\-\s()]{6,}$/'],
            'message' => $optional.'|string|max:3000',
            'website' => 'prohibited', // honeypot: real visitors never fill this hidden field
        ], [
            'phone.regex' => 'Please enter a valid phone number.',
            'website.prohibited' => 'Spam detected.',
        ]);

        unset($data['website']);
        $data['source'] = $data['source'] ?? 'contact';
        $data['ip'] = $request->ip();

        $inquiry = Inquiry::create($data);

        // alert to the team + optional auto-reply (Admin → Email templates / Email & SMTP)
        $notifyTo = MailSettings::notifyTo() ?: [Setting::all_values()['email']];
        $notification = EmailTemplate::for('lead_notification')->fill_in(EmailTemplate::varsFor($inquiry));
        try {
            if (EmailTemplate::for('lead_notification')->is_enabled) {
                Mail::to($notifyTo)->send(new NewInquiry($inquiry->load('project')));
                EmailLog::record(MailSettings::isLive() ? 'sent' : 'skipped', 'Lead notification', implode(', ', $notifyTo), $notification['subject'], MailSettings::isLive() ? 'New lead alert sent.' : 'SMTP is not connected; message was not delivered.');
            } else {
                EmailLog::record('skipped', 'Lead notification', implode(', ', $notifyTo), $notification['subject'], 'The lead notification template is disabled.');
            }
        } catch (\Throwable $e) {
            Log::warning('Inquiry mail failed: '.$e->getMessage());
            EmailLog::record('failed', 'Lead notification', implode(', ', $notifyTo), $notification['subject'], mb_substr($e->getMessage(), 0, 1000));
        }
        try {
            $auto = EmailTemplate::for('lead_autoreply');
            if ($inquiry->source === 'contact' && $inquiry->email) {
                $t = $auto->fill_in(EmailTemplate::varsFor($inquiry));
                Mail::to($inquiry->email, $inquiry->full_name)->send(new TemplateMail($t['subject'], $t['body']));
                EmailLog::record(MailSettings::isLive() ? 'sent' : 'skipped', 'Lead auto-reply', $inquiry->email, $t['subject'], MailSettings::isLive() ? 'Contact auto-reply sent.' : 'SMTP is not connected; message was not delivered.');
            } else {
                EmailLog::record('skipped', 'Lead auto-reply', $inquiry->email ?? '', 'Contact auto-reply', 'This inquiry does not have a contact email address.');
            }
        } catch (\Throwable $e) {
            Log::warning('Inquiry auto-reply failed: '.$e->getMessage());
            EmailLog::record('failed', 'Lead auto-reply', $inquiry->email ?? '', 'Contact auto-reply', mb_substr($e->getMessage(), 0, 1000));
        }

        return back()->with('success', $siteVisit
            ? 'Thank you! Our team will call you shortly to arrange your site visit.'
            : 'Thank you! Your message has been received. We will get back to you soon.');
    }
}
