<?php

namespace App\Http\Controllers;

use App\Models\CompanyValue;
use App\Models\Faq;
use App\Models\Project;
use App\Models\Service;
use App\Models\Stat;
use App\Models\TeamMember;
use App\Models\Testimonial;
use Inertia\Inertia;
use Inertia\Response;

class SiteController extends Controller
{
    public function home(): Response
    {
        return Inertia::render('Home', [
            'projects' => Project::published()->where('is_featured', true)->ordered()->get(),
            'stats' => Stat::where('page', 'home')->ordered()->get(),
            'testimonials' => Testimonial::where('is_published', true)->ordered()->get(),
            'faqs' => Faq::where('is_published', true)->ordered()->get(),
            'projectCount' => Project::published()->count(),
            'services' => Service::ordered()->get(),
            'values' => CompanyValue::ordered()->get(),
        ]);
    }

    public function about(): Response
    {
        return Inertia::render('About', [
            'values' => CompanyValue::ordered()->get(),
            'stats' => Stat::where('page', 'about')->ordered()->get(),
            'team' => TeamMember::where('is_published', true)->ordered()->get(),
        ]);
    }

    public function services(): Response
    {
        return Inertia::render('Services', [
            'services' => Service::ordered()->get(),
        ]);
    }

    public function projects(): Response
    {
        return Inertia::render('Projects/Index', [
            'projects' => Project::published()->ordered()->get(),
        ]);
    }

    public function project(Project $project): Response
    {
        abort_unless($project->is_published, 404);
        $all = Project::published()->ordered()->get(['id']);

        return Inertia::render('Projects/Show', [
            'project' => $project,
            'index' => $all->search(fn ($p) => $p->id === $project->id) + 1,
            'total' => $all->count(),
            'related' => Project::published()->where('id', '!=', $project->id)->ordered()->get(),
        ]);
    }

    public function contact(): Response
    {
        return Inertia::render('Contact');
    }
}
