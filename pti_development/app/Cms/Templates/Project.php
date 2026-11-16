<?php

use App\Cms\F;

/*
 * The layout every single project page shares (/projects/{slug}). The project's own name, photos, facts and
 * description are edited under Collections → Projects; here are the headings and texts around them.
 * Texts may use {name} (the project's name), {units} and {area}.
 */
return [
    'label' => 'Project detail',
    'component' => 'Projects/Show',
    'slug' => 'project-detail',
    'path' => '/projects/{slug}',
    'duplicable' => false,
    'seo' => [
        'title' => '{name}',
        'description' => '{name} by PTI Development: {units} apartments at {area}, Dhaka. Clear pricing, documented paperwork and lasting quality.',
    ],
    'sections' => [
        F::section('facts', 'Project facts card', [
            F::text('title', 'Card title', 'Project Facts', null, true),
            F::text('subtitle', 'Card subtitle', 'At a glance', null, true),
            F::text('figures_label', 'Key figures label', 'Key figures', null, true),
            F::text('share_label', 'Share label', 'Share', null, true),
            F::link('button', 'Enquiry button', 'Enquire About This Project', '/contact#contact'),
        ], 'The navy card beside the main photo.', ['label' => 'Edit projects', 'href' => '/admin/content/projects']),
        F::section('about', 'About the project', [
            F::rich('title', 'Heading', 'About *This Project*'),
            F::textarea('fallback', 'Text when a project has no description', '{units} thoughtfully planned residences by PTI Development, with clear pricing, documented paperwork and lasting quality.'),
            F::rich('elements_title', 'Key elements heading', 'Key Project *Elements*'),
            F::rich('location_title', 'Location heading', 'Project *Location*'),
        ]),
        F::section('team', 'Talk to our team (side box)', [
            F::text('title', 'Title', 'Talk to Our Team'),
            F::textarea('text', 'Text', 'Interested in {name}? We will walk you through the units, pricing and paperwork.'),
            F::text('whatsapp_label', 'WhatsApp link text', 'Chat on WhatsApp', null, true),
            F::link('button', 'Button', 'Book a Site Visit', '/contact'),
        ]),
        F::section('gallery', 'Gallery', [
            F::rich('title', 'Heading', '{name} *in pictures*'),
            F::list('slots', 'Tile names (in order)', ['Main view', 'Exterior', 'Entrance & lobby', 'Living room', 'Bedroom', 'Amenities', 'Neighbourhood'], 'Seven tiles; the project photos fill them in order, empty tiles show this name.'),
            F::text('placeholder', 'Empty tile text', 'Photo coming soon'),
        ]),
        F::section('related', 'Related projects', [
            F::rich('title', 'Heading', 'Related *Projects*'),
            F::link('link', 'Link', 'All projects', '/projects'),
        ]),
    ],
];
