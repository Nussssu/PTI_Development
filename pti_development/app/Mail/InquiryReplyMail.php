<?php

namespace App\Mail;

use App\Models\Inquiry;

/** A reply written in the admin panel (Leads → Reply), sent to the person who wrote in, with their message quoted. */
class InquiryReplyMail extends TemplateMail
{
    public function __construct(public Inquiry $inquiry, string $replySubject, string $body)
    {
        parent::__construct($replySubject, $body, $inquiry->message ?: null, 'Your message ('.$inquiry->created_at->format('j M Y').')');
    }
}
