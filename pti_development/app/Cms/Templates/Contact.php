<?php

use App\Cms\F;
use App\Cms\Shared;

return [
    'label' => 'Contact',
    'component' => 'Contact',
    'slug' => 'contact',
    'path' => '/contact',
    'duplicable' => true,
    'seo' => [
        'title' => 'Contact',
        'description' => 'Contact PTI Development Ltd.: call, email, WhatsApp or visit our office in Pallabi, Mirpur, Dhaka. Book a site visit or ask about apartments and land share.',
    ],
    'sections' => [
        Shared::pageHero("Connect With\nPTI Development\n*Today*", '/images/skyline-up.webp'),
        Shared::homeContact('/images/lets-talk-keys.webp'),
        Shared::faq(),
        F::section('office', 'Our office', [
            F::rich('title', 'Heading', 'Our *office*'),
            F::text('call_label', 'Phone card label', 'Call us', null, true),
            F::text('email_label', 'Email card label', 'Email', null, true),
            F::text('office_label', 'Office card label', 'Office', null, true),
            F::text('whatsapp_label', 'WhatsApp card label', 'WhatsApp', null, true),
            F::text('whatsapp_text', 'WhatsApp card text', 'Message us anytime', null, true),
        ], 'The map and the phone, email, address and WhatsApp number come from Settings.',
            ['label' => 'Edit contact details', 'href' => '/admin/settings']),
    ],
];
