<?php

namespace App\Http\Controllers;

use App\Mail\NewInquiry;
use App\Mail\TemplateMail;
use App\Models\EmailTemplate;
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
        try {
            if (EmailTemplate::for('lead_notification')->is_enabled) {
                Mail::to(MailSettings::notifyTo() ?: [Setting::all_values()['email']])->send(new NewInquiry($inquiry->load('project')));
            }
        } catch (\Throwable $e) {
            Log::warning('Inquiry mail failed: '.$e->getMessage());
        }
        try {
            $auto = EmailTemplate::for('lead_autoreply');
            if ($auto->is_enabled && $inquiry->email) {
                $t = $auto->fill_in(EmailTemplate::varsFor($inquiry));
                Mail::to($inquiry->email, $inquiry->full_name)->send(new TemplateMail($t['subject'], $t['body'], $inquiry->message ?: null, 'Your message'));
            }
        } catch (\Throwable $e) {
            Log::warning('Inquiry auto-reply failed: '.$e->getMessage());
        }

        return back()->with('success', $siteVisit
            ? 'Thank you! Our team will call you shortly to arrange your site visit.'
            : 'Thank you! Your message has been received. We will get back to you soon.');
    }
}
