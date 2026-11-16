<?php

namespace App\Mail;

use App\Models\EmailTemplate;
use App\Models\Inquiry;

/** The "new lead" alert to the team (template: lead_notification). */
class NewInquiry extends TemplateMail
{
    public function __construct(public Inquiry $inquiry)
    {
        $t = EmailTemplate::for('lead_notification')->fill_in(EmailTemplate::varsFor($inquiry));
        parent::__construct($t['subject'], $t['body'], null, null, $inquiry->email ?: null);
    }
}
