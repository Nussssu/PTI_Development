<?php

use App\Cms\F;
use App\Cms\Shared;

/*
 * The landing page (Pages/Home.jsx). Texts may use {tagline} {company} {phone} {email} {address} (from Settings).
 * The hero and the first arch section carry the page's opening animation, so they cannot be switched off.
 */
return [
    'label' => 'Home',
    'component' => 'Home',
    'slug' => 'home',
    'path' => '/',
    'duplicable' => true,
    'seo' => [
        'title' => 'Shaping Dreams into Homes',
        'description' => 'PTI Development Ltd. builds homes and commercial spaces you can trust in Dhaka: apartments in Mirpur, ECB Chattar and Kalshi, land share purchase and full legal support.',
    ],
    'sections' => [
        F::section('hero', 'Hero', [
            F::text('eyebrow', 'Small heading', 'Premium living in Dhaka'),
            F::textarea('title', 'Headline', "Homes for\na Better Life", 'One line of the headline per row (the letters animate in one by one).'),
            F::text('subtitle', 'Text under the headline', 'Thoughtfully designed for comfort and modern living.'),
            F::image('image', 'Photo', '/images/hero-tower-dusk.webp', true),
            F::text('image_alt', 'Photo description (alt text)', 'PTI residential tower at dusk, rising above flowering trees, palms and a lit swimming pool'),
        ], 'The full-screen photo that opens inside the pointed arch.', null, false),

        F::section('arch', 'Built on trust', [
            F::text('curve_text', 'Curved title', 'Built On Trust', null, true),
            F::text('tagline', 'Line under the crest', '{tagline}', 'Use {tagline} for the tagline from Settings.', true),
            F::text('crest_left', 'Crest, left word', 'Mirpur', null, true),
            F::text('crest_right', 'Crest, right word', 'Dhaka', null, true),
            F::repeater('promises', 'Promises slider', [
                F::text('title', 'Title', '', null, true),
                F::image('image', 'Photo'),
                F::textarea('text', 'Line under the photo'),
            ], [
                ['title' => 'Quality Craftsmanship', 'image' => '/images/hd/construction.webp', 'text' => 'Precise, durable and high-standard construction.'],
                ['title' => 'Transparency', 'image' => '/images/hd/skyline.webp', 'text' => 'Clear, documented pricing and honest paperwork.'],
                ['title' => 'Halal Investment', 'image' => '/images/hd/land.webp', 'text' => 'Ethical practices with safe and halal ownership.'],
            ], 'title'),
        ], 'The lavender dome rising over the hero, with the promises slider.', null, false),

        F::section('says', 'What our clients say', [
            F::text('eyebrow', 'Small heading', 'What our clients say'),
            F::image('image', 'Photo under the quotes', '/images/says-scene.webp', true),
            F::text('image_alt', 'Photo description (alt text)', 'PTI residences at dusk: glass building, flowering gardens and a lit pool'),
        ], 'The quotes come from Collections → Testimonials (three sample quotes show while it is empty).',
            ['label' => 'Manage testimonials', 'href' => '/admin/content/testimonials']),

        F::section('numbers', 'We are in numbers', [
            F::text('title', 'Heading', 'We are in numbers'),
            F::repeater('images', 'Card photos (in order)', [F::image('image', 'Photo')], [
                ['image' => '/images/faq.jpg'],
                ['image' => '/images/projects-hd/Project5.webp'],
                ['image' => '/images/projects-hd/Project1.webp'],
                ['image' => '/images/projects-hd/Project4.webp'],
            ]),
        ], 'The four figures and their labels are edited under Collections → Numbers (page "home").',
            ['label' => 'Manage numbers', 'href' => '/admin/content/stats']),

        F::section('projects', 'Our projects (sideways strip)', [
            F::text('title', 'Title on the aerial photo', 'Our Projects'),
            F::image('image', 'Aerial photo', '/images/aerial-roundabout.webp', true),
            F::text('image_alt', 'Photo description (alt text)', 'Aerial view of a tree-lined neighbourhood around a roundabout'),
            F::textarea('fallback', 'Text for a project without a description', '{units} thoughtfully planned residences by PTI Development, with clear pricing, documented paperwork and lasting quality.', '{units} = the project\'s number of units.'),
            F::textarea('cta', 'Round button on the last project', "View all\nprojects", 'Press Enter for a new line.'),
            F::text('cta_href', 'Round button link', '/projects'),
        ], 'One panel per project shown on the home page (Collections → Projects, "Show on home page").',
            ['label' => 'Manage projects', 'href' => '/admin/content/projects']),

        F::section('place', 'The city you\'ll call home', [
            F::image('image', 'Photo under the clouds', '/images/clouds-scene.webp', true),
            F::text('image_alt', 'Photo description (alt text)', 'Glass towers and gardens under a bright cloudy sky'),
            F::text('line1', 'Heading, first line', 'The city', null, true),
            F::text('script', 'Heading, handwritten word', 'you\'ll', null, true),
            F::text('line2', 'Heading, last line', 'Call home', null, true),
            F::text('subtitle', 'Sub-heading', 'Minutes from what matters', null, true),
            F::textarea('text', 'Text', 'Our projects are in strategic Dhaka locations, minutes from ECB Chattar and the Kalshi Flyover, as well as Kawla and Manikdi Bazar. Visit us at {address}.', 'Use {address} for the address from Settings.'),
            F::text('office_label', 'Last stop on the route', 'Pallabi office', null, true),
            F::text('office_sub', 'Last stop, small line', 'Mirpur, Dhaka-1216', null, true),
        ], 'The route stops are made from the projects\' locations.'),

        F::section('video', 'Crafted for everyday living', [
            F::textarea('title', 'Title', "Crafted\nFor\nEveryday", 'One word per row.'),
            F::text('script', 'Handwritten last word', 'Living', null, true),
            F::text('lede', 'Small line', 'Our story', null, true),
            F::text('youtube_id', 'YouTube video ID', '2C9NmA_p-6Q', 'The part after youtu.be/ in the video link.', true),
            F::text('video_title', 'Video title (for screen readers)', 'PTI Development: our story on film', null, true),
            F::repeater('pictures', 'Pictures', [
                F::image('image', 'Photo'),
                F::text('alt', 'Photo description', '', null, true),
                F::text('caption', 'Caption', '', null, true),
                F::textarea('text', 'Text'),
            ], [
                ['image' => '/images/craft-architecture.webp', 'alt' => 'Scaffolding around a building under construction', 'caption' => 'Architecture',
                    'text' => 'Every PTI tower starts with a sound structure: engineered foundations, tested materials and on-site supervision on every floor, so the building stands as strong as it looks.'],
                ['image' => '/images/craft-living.webp', 'alt' => 'PTI residential tower lit up at night', 'caption' => 'Living space',
                    'text' => 'Bright, well-planned homes with natural light, cross ventilation and green balconies, designed around the way Dhaka families live every day.'],
            ], 'caption', 'Two pictures: the first sits left, the second lower right.'),
        ], 'The pointed door with the film in a laptop and two pictures.'),

        F::section('merge', 'Designed to inspire', [
            F::image('image', 'Photo', '/images/merge-skyline.webp', true),
            F::text('image_alt', 'Photo description (alt text)', 'Glass and brick towers seen from the street, looking up at a clear sky'),
            F::textarea('heading', 'Heading', "Designed\nto Inspire", 'Press Enter for a new line.'),
            F::textarea('text', 'Text', 'Every PTI home starts with light, air and the street around it: calm proportions, honest materials and spaces planned to be lived in for generations.'),
            F::link('link', 'Link', 'Explore our vision', '/about#vision'),
            F::text('title', 'Big word on the full photo', 'Contact'),
        ], 'The split photo that joins into one and zooms to full screen.'),

        Shared::homeContact('/images/lets-talk-keys.webp'),
    ],
];
