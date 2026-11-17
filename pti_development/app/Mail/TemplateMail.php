<?php

namespace App\Mail;

use App\Models\Setting;
use App\Support\MailSettings;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** Any email the site sends: plain-text body (from an email template) inside the branded layout. */
class TemplateMail extends Mailable
{
    public function __construct(public string $mailSubject, public string $body, public ?string $replyToAddress = null) {}

    public function envelope(): Envelope
    {
        $replyTo = $this->replyToAddress ?: MailSettings::replyTo();

        return new Envelope(subject: $this->mailSubject, replyTo: $replyTo ? [$replyTo] : []);
    }

    public function content(): Content
    {
        return new Content(view: 'mail.layout', with: [
            'site' => Setting::all_values(),
            'body' => $this->body,
        ]);
    }

    /** The rendered HTML, for the template preview in the admin. */
    public static function preview(string $subject, string $body): string
    {
        return view('mail.layout', ['site' => Setting::all_values(), 'body' => $body, 'previewSubject' => $subject])->render();
    }
}
