<?php

use App\Cms\F;

/*
 * The "page not found" (404) page. Shown for every address on the website that does not exist (and for hidden
 * pages or projects). It cannot be copied, deleted or hidden; its big number and heading are edited here (no other text, no buttons, no footer).
 */
return [
    'label' => '404 page',
    'component' => 'NotFound',
    'slug' => 'not-found',
    'path' => '/404',
    'duplicable' => false,
    'seo' => [
        'title' => 'Page not found',
        'description' => 'The page you are looking for could not be found.',
    ],
    'sections' => [
        F::section('content', 'Page not found', [
            F::text('code', 'Big number', '404', null, true),
            F::text('title', 'Heading', 'Page not found', null, true),
        ], 'Shown whenever someone opens an address that does not exist on the website.', null, false),
    ],
];
