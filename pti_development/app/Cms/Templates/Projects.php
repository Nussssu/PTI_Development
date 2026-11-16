<?php

use App\Cms\F;
use App\Cms\Shared;

return [
    'label' => 'Projects',
    'component' => 'Projects/Index',
    'slug' => 'projects',
    'path' => '/projects',
    'duplicable' => true,
    'seo' => [
        'title' => 'Projects',
        'description' => 'Apartments and towers by PTI Development across Dhaka: Mirpur, ECB Chattar, Kalshi, Kawla and Manikdi.',
    ],
    'sections' => [
        Shared::pageHero("Towers Rising\nAcross *Dhaka*", '/images/projects-hero.webp'),
        F::section('list', 'Projects grid', [
            F::rich('title', 'Heading', 'Our *Projects*'),
        ], 'Every published project, as cards. Add, edit or reorder them under Collections → Projects.',
            ['label' => 'Manage projects', 'href' => '/admin/content/projects']),
        Shared::cta(),
    ],
];
