<?php

namespace App\Admin;

use App\Models\CompanyValue;
use App\Models\Faq;
use App\Models\Project;
use App\Models\Service;
use App\Models\Stat;
use App\Models\TeamMember;
use App\Models\Testimonial;

/**
 * Registry of content types editable in the admin panel.
 *
 * Field types: text, textarea, number, boolean, select, image, list (string[]),
 * features ({label,value}[]), gallery (image[]).
 */
class Resources
{
    public static function all(): array
    {
        return [
            'projects' => [
                'model' => Project::class,
                'label' => 'Projects',
                'singular' => 'Project',
                'icon' => 'building',
                'columns' => ['image', 'name', 'area', 'units', 'status', 'is_published'],
                'fields' => [
                    ['name' => 'name', 'label' => 'Project name', 'type' => 'text', 'rules' => 'required|string|max:120'],
                    ['name' => 'slug', 'label' => 'URL slug', 'type' => 'text', 'rules' => 'nullable|alpha_dash|max:140', 'help' => 'Leave empty to generate from the name.'],
                    ['name' => 'image', 'label' => 'Main image', 'type' => 'image'],
                    ['name' => 'units', 'label' => 'Units', 'type' => 'number', 'rules' => 'required|integer|min:0', 'half' => true],
                    ['name' => 'status', 'label' => 'Status', 'type' => 'select', 'options' => ['Under Construction', 'Ready to Move', 'Upcoming', 'Completed'], 'rules' => 'required|string', 'half' => true],
                    ['name' => 'location', 'label' => 'Location line', 'type' => 'text', 'rules' => 'required|string|max:120', 'help' => 'e.g. "3 min to ECB Chattar"', 'half' => true],
                    ['name' => 'area', 'label' => 'Area (used for filters)', 'type' => 'text', 'rules' => 'required|string|max:80', 'help' => 'e.g. "ECB Chattar"', 'half' => true],
                    ['name' => 'description', 'label' => 'Description', 'type' => 'textarea', 'rules' => 'nullable|string|max:5000'],
                    ['name' => 'features', 'label' => 'Key features', 'type' => 'features', 'help' => 'e.g. Floors / Lift / Bedrooms per unit / Car garage'],
                    ['name' => 'gallery', 'label' => 'Gallery', 'type' => 'gallery'],
                    ['name' => 'is_featured', 'label' => 'Show on home page', 'type' => 'boolean', 'half' => true],
                    ['name' => 'is_published', 'label' => 'Published', 'type' => 'boolean', 'half' => true],
                    ['name' => 'sort_order', 'label' => 'Sort order', 'type' => 'number', 'rules' => 'nullable|integer|min:0'],
                ],
            ],
            'services' => [
                'model' => Service::class,
                'label' => 'Services',
                'singular' => 'Service',
                'icon' => 'layers',
                'columns' => ['image', 'title', 'sort_order'],
                'fields' => [
                    ['name' => 'title', 'label' => 'Title', 'type' => 'text', 'rules' => 'required|string|max:120'],
                    ['name' => 'description', 'label' => 'Description', 'type' => 'textarea', 'rules' => 'required|string|max:1000'],
                    ['name' => 'image', 'label' => 'Image', 'type' => 'image'],
                    ['name' => 'points', 'label' => 'Bullet points', 'type' => 'list'],
                    ['name' => 'sort_order', 'label' => 'Sort order', 'type' => 'number', 'rules' => 'nullable|integer|min:0'],
                ],
            ],
            'team' => [
                'model' => TeamMember::class,
                'label' => 'Team',
                'singular' => 'Team member',
                'icon' => 'users',
                'columns' => ['photo', 'name', 'role', 'is_published'],
                'fields' => [
                    ['name' => 'name', 'label' => 'Name', 'type' => 'text', 'rules' => 'required|string|max:120', 'half' => true],
                    ['name' => 'role', 'label' => 'Role', 'type' => 'text', 'rules' => 'required|string|max:120', 'half' => true],
                    ['name' => 'photo', 'label' => 'Photo', 'type' => 'image'],
                    ['name' => 'is_published', 'label' => 'Published', 'type' => 'boolean', 'half' => true],
                    ['name' => 'sort_order', 'label' => 'Sort order', 'type' => 'number', 'rules' => 'nullable|integer|min:0', 'half' => true],
                ],
            ],
            'values' => [
                'model' => CompanyValue::class,
                'label' => 'Values',
                'singular' => 'Value',
                'icon' => 'star',
                'columns' => ['image', 'title', 'text'],
                'fields' => [
                    ['name' => 'title', 'label' => 'Title', 'type' => 'text', 'rules' => 'required|string|max:80'],
                    ['name' => 'text', 'label' => 'Text', 'type' => 'text', 'rules' => 'required|string|max:255'],
                    ['name' => 'image', 'label' => 'Hover image', 'type' => 'image'],
                    ['name' => 'sort_order', 'label' => 'Sort order', 'type' => 'number', 'rules' => 'nullable|integer|min:0'],
                ],
            ],
            'stats' => [
                'model' => Stat::class,
                'label' => 'Numbers',
                'singular' => 'Number',
                'icon' => 'chart',
                'columns' => ['image', 'page', 'value', 'suffix', 'label'],
                'fields' => [
                    ['name' => 'page', 'label' => 'Page', 'type' => 'select', 'options' => ['home', 'about'], 'rules' => 'required|in:home,about', 'half' => true],
                    ['name' => 'value', 'label' => 'Value', 'type' => 'number', 'rules' => 'required|integer|min:0', 'half' => true],
                    ['name' => 'suffix', 'label' => 'Suffix', 'type' => 'text', 'rules' => 'nullable|string|max:8', 'help' => 'e.g. +', 'half' => true],
                    ['name' => 'label', 'label' => 'Label', 'type' => 'text', 'rules' => 'required|string|max:120', 'half' => true],
                    ['name' => 'image', 'label' => 'Background image', 'type' => 'image'],
                    ['name' => 'sort_order', 'label' => 'Sort order', 'type' => 'number', 'rules' => 'nullable|integer|min:0'],
                ],
            ],
            'faqs' => [
                'model' => Faq::class,
                'label' => 'FAQ',
                'singular' => 'Question',
                'icon' => 'help',
                'columns' => ['question', 'is_published', 'sort_order'],
                'fields' => [
                    ['name' => 'question', 'label' => 'Question', 'type' => 'text', 'rules' => 'required|string|max:255'],
                    ['name' => 'answer', 'label' => 'Answer', 'type' => 'textarea', 'rules' => 'required|string|max:3000'],
                    ['name' => 'is_published', 'label' => 'Published', 'type' => 'boolean', 'half' => true],
                    ['name' => 'sort_order', 'label' => 'Sort order', 'type' => 'number', 'rules' => 'nullable|integer|min:0', 'half' => true],
                ],
            ],
            'testimonials' => [
                'model' => Testimonial::class,
                'label' => 'Testimonials',
                'singular' => 'Testimonial',
                'icon' => 'quote',
                'columns' => ['photo', 'name', 'role', 'is_published'],
                'fields' => [
                    ['name' => 'name', 'label' => 'Client name', 'type' => 'text', 'rules' => 'required|string|max:120', 'half' => true],
                    ['name' => 'role', 'label' => 'Role / project', 'type' => 'text', 'rules' => 'nullable|string|max:120', 'half' => true],
                    ['name' => 'quote', 'label' => 'Quote', 'type' => 'textarea', 'rules' => 'required|string|max:2000'],
                    ['name' => 'photo', 'label' => 'Photo', 'type' => 'image'],
                    ['name' => 'is_published', 'label' => 'Published', 'type' => 'boolean', 'half' => true],
                    ['name' => 'sort_order', 'label' => 'Sort order', 'type' => 'number', 'rules' => 'nullable|integer|min:0', 'half' => true],
                ],
            ],
        ];
    }

    public static function get(string $slug): array
    {
        $all = static::all();
        abort_unless(isset($all[$slug]), 404);

        return $all[$slug] + ['slug' => $slug];
    }

    /** Navigation data for the admin sidebar (no model classes). */
    public static function nav(): array
    {
        return collect(static::all())->map(fn ($r, $slug) => [
            'slug' => $slug, 'label' => $r['label'], 'icon' => $r['icon'],
        ])->values()->all();
    }

    /** Config safe to send to the browser. */
    public static function public(string $slug): array
    {
        $r = static::get($slug);
        unset($r['model']);
        $r['fields'] = array_map(function ($f) {
            unset($f['rules']);

            return $f;
        }, $r['fields']);

        return $r;
    }
}
