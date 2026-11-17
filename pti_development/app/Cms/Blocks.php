<?php

use App\Cms\F;

/*
 * The header and the footer (one of each for the whole site), edited under "Header & Footer".
 * Footer texts may use {year} {company} {tagline} {phone} {email} {address} (from Settings).
 */
return [
    'header' => [
        'label' => 'Header',
        'description' => 'The round badge (top left, back to Home) and the Menu button with its dropdown (top right).',
        'fields' => [
            F::text('ring_text', 'Badge ring text', 'PTI DEVELOPMENT · SHAPING DREAMS · DHAKA ·', 'The words running round the logo badge.'),
            F::image('logo', 'Badge logo', null, false, 'Optional. Leave empty to keep the PTI mark in the middle of the badge.'),
            F::text('menu_label', 'Menu button', 'Menu', null, true),
            F::text('close_label', 'Menu button when open', 'Close', null, true),
            F::repeater('items', 'Menu items', [
                F::text('label', 'Label', '', null, true),
                F::text('href', 'Link', '', 'e.g. /about or /contact#contact', true),
            ], [
                ['label' => 'Our Projects', 'href' => '/projects'],
                ['label' => 'About', 'href' => '/about'],
                ['label' => 'Services', 'href' => '/services'],
                ['label' => 'Book a visit', 'href' => '/contact#contact'],
            ], 'label', 'The first item is shown large.'),
        ],
    ],
    'footer' => [
        'label' => 'Footer',
        'description' => 'Logo, short text, social icons, links, contact details, the big outlined name and the copyright line.',
        'fields' => [
            F::image('logo', 'Logo', '/images/pti-logo-white.svg'),
            F::textarea('text', 'Text under the logo', 'Shaping Dreams into Homes. {tagline}', 'You can use {tagline}, {company}, {phone}, {email}, {address}.'),
            F::repeater('socials', 'Social icons', [
                F::select('network', 'Network', ['facebook' => 'Facebook', 'instagram' => 'Instagram', 'linkedin' => 'LinkedIn', 'youtube' => 'YouTube', 'whatsapp' => 'WhatsApp', 'custom' => 'Other']),
                F::text('label', 'Display name', '', null, true),
                F::text('url', 'Link', '', null, true),
                F::toggle('enabled', 'Show on website', true),
            ], [
                ['network' => 'facebook', 'label' => 'Facebook', 'url' => 'https://www.facebook.com/login/', 'enabled' => true],
                ['network' => 'instagram', 'label' => 'Instagram', 'url' => 'https://www.instagram.com/accounts/login/', 'enabled' => true],
                ['network' => 'linkedin', 'label' => 'LinkedIn', 'url' => 'https://www.linkedin.com/login', 'enabled' => true],
            ], 'network'),
            F::text('links_title', 'Links heading', 'Links', null, true),
            F::repeater('links', 'Links', [
                F::text('label', 'Label', '', null, true),
                F::text('href', 'Link', '', null, true),
            ], [
                ['label' => 'Home', 'href' => '/'],
                ['label' => 'About', 'href' => '/about'],
                ['label' => 'Services', 'href' => '/services'],
                ['label' => 'Projects', 'href' => '/projects'],
                ['label' => 'Contact', 'href' => '/contact'],
            ], 'label'),
            F::text('contact_title', 'Contact heading', 'Contact', null, true),
            F::text('phone_label', 'Phone label', 'Phone', 'The phone, email and address come from Settings.', true),
            F::text('email_label', 'Email label', 'Email', null, true),
            F::text('address_label', 'Address label', 'Address', null, true),
            F::text('big_text', 'Big outlined name', 'PTI Development'),
            F::text('copyright', 'Copyright line', '© {year} {company} All Rights Reserved.'),
        ],
    ],
];
