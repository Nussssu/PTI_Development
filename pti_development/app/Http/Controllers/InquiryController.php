<?php

namespace App\Http\Controllers;

use App\Mail\NewInquiry;
use App\Models\Inquiry;
use App\Models\Setting;
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

        try {
            Mail::to(Setting::all_values()['email'])->send(new NewInquiry($inquiry->load('project')));
        } catch (\Throwable $e) {
            Log::warning('Inquiry mail failed: '.$e->getMessage());
        }

        return back()->with('success', $siteVisit
            ? 'Thank you! Our team will call you shortly to arrange your site visit.'
            : 'Thank you! Your message has been received. We will get back to you soon.');
    }
}
