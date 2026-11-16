<?php

use App\Cms\F;
use App\Cms\Shared;

return [
    'label' => 'Services',
    'component' => 'Services',
    'slug' => 'services',
    'path' => '/services',
    'duplicable' => true,
    'seo' => [
        'title' => 'Services',
        'description' => 'PTI Development services in Dhaka: property development, land share purchase and full legal & compliance support, from your first visit to handover.',
    ],
    'sections' => [
        Shared::pageHero("Services Built on\nTrust & *Expertise*", null, '/videos/services-hero.mp4', 'The full-screen video at the top of the page.'),
        F::section('services', 'What we do (services)', [
            F::link('button', 'Button under each service', 'Our Projects', '/projects'),
        ], 'The first three services, each with its photo, revealed one after another on scroll. Their titles, texts, bullet points and photos are edited under Collections → Services.',
            ['label' => 'Manage services', 'href' => '/admin/content/services']),
        F::section('journey', 'From first visit to handover', [
            F::rich('title', 'Heading', "From first visit\nto *handover*", 'One line per row. Wrap words in *asterisks* for the gold accent style.'),
            F::image('image', 'Background panorama', '/images/journey-panorama.webp', true),
            F::repeater('steps', 'Steps', [
                F::text('title', 'Title', ''),
                F::textarea('text', 'Text', ''),
            ], [
                ['title' => 'Meet & explore', 'text' => 'We show you finished and under construction projects and the features of each area.'],
                ['title' => 'Choose with clarity', 'text' => 'Transparent pricing and verified land titles, all clear and documented.'],
                ['title' => 'Secure & sign', 'text' => 'Detailed contract reviews, proper documentation and no hidden fees.'],
                ['title' => 'Build & hand over', 'text' => 'Transparent project updates and handovers as promised.'],
            ], 'title', 'Four steps fit the line best.'),
        ], 'The dark section with the numbered steps on a construction panorama.'),
        Shared::cta(),
    ],
];
