<?php

namespace App\Mail;

use App\Models\Inquiry;

/** A reply written in the admin panel (Leads → Reply), sent to the person who wrote in. */
class InquiryReplyMail extends TemplateMail
{
    public function __construct(public Inquiry $inquiry, string $replySubject, string $body)
    {
        parent::__construct($replySubject, $body);
    }
}
