<?php

use App\Cms\F;
use App\Cms\Shared;

return [
    'label' => 'About',
    'component' => 'About',
    'slug' => 'about',
    'path' => '/about',
    'duplicable' => true,
    'seo' => [
        'title' => 'About',
        'description' => 'PTI Development Ltd., led by Md. Ruhul Amin, is shaping Dhaka’s skyline with projects that combine affordability, transparency and world-class design.',
    ],
    'sections' => [
        F::section('hero', 'Hero and story', [
            F::rich('title', 'Title', "Our Legacy of\nConstruction\n*Excellence*", 'One line per row. Wrap words in *asterisks* for the gold accent style.'),
            F::image('image', 'Photo', '/images/rooftop-dusk.webp', true),
            F::text('image_alt', 'Photo description (alt text)', 'PTI Development building rooftop at dusk'),
            F::rich('story_title', 'Story heading', "Shaping Dhaka's\n*Skyline*"),
            F::textarea('story', 'Story, first paragraph', 'PTI Development’s journey began with a clear vision: to elevate living and working spaces in Dhaka through uncompromising quality and integrity. From our first residential project to our expansive mixed-use developments, our journey has been fueled by a commitment to our clients’ aspirations and the sustainable growth of our communities. Every project is a milestone in our legacy of excellence.'),
            F::textarea('story2', 'Story, second paragraph', 'Led by *Md. Ruhul Amin*, a visionary entrepreneur, we are shaping Dhaka’s skyline with projects that combine affordability, transparency, and world-class design. Every square foot we build is a commitment — to trust, to safety, and to the dreams of our clients.', 'Words in *asterisks* are underlined in gold.'),
        ], 'The full-screen photo that shrinks into the pointed door, with the story beside it.'),

        F::section('stats', 'Numbers', [], 'The figures spin with the scroll. Edit them under Collections → Numbers (page "about").',
            ['label' => 'Manage numbers', 'href' => '/admin/content/stats']),

        F::section('vision', 'Our vision', [
            F::text('label', 'Small heading', 'Our vision'),
            F::list('rows', 'Lines', [
                'PTI is shaping Dhaka\'s skyline with projects',
                'that combine affordability, transparency',
                'and world-class design, square foot by square foot',
            ], 'One line per row.'),
            F::image('image', 'Background photo', '/images/hd/construction.webp', true),
        ], 'The big lines on the construction photo; on desktop it slides into "What we stand for".'),

        F::section('values', 'What we stand for', [
            F::text('eyebrow', 'Small heading', 'What we stand for'),
            F::image('image', 'Background photo', '/images/hd/night-render.webp', true),
            F::repeater('items', 'Values', [
                F::text('title', 'Title', ''),
                F::textarea('text', 'Text', ''),
            ], [], 'title', 'These values and descriptions are shown together on the About page.'),
        ], 'The list of values and their sentences, with the section background photo.'),

        F::section('team', 'Meet our visionaries', [
            F::text('title', 'Heading', 'Meet Our Visionaries'),
            F::text('works_at', 'Profile card: workplace line', 'Works at PTI Development', null, true),
            F::text('office', 'Profile card: office line', 'PTI Development office, Mirpur, Dhaka', null, true),
            F::link('button', 'Profile card button', 'Contact', '/contact'),
        ], 'The people are edited under Collections → Team.', ['label' => 'Manage team', 'href' => '/admin/content/team']),

        Shared::quote('/images/about-pti-street.webp'),
    ],
];
