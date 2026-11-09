<?php

namespace App\Mail;

use App\Models\Inquiry;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class NewInquiry extends Mailable
{
    public function __construct(public Inquiry $inquiry) {}

    public function envelope(): Envelope
    {
        $kind = $this->inquiry->source === 'site_visit' ? 'Site visit request' : 'Website enquiry';

        return new Envelope(subject: $kind.' from '.$this->inquiry->full_name);
    }

    public function content(): Content
    {
        return new Content(view: 'mail.inquiry');
    }
}
