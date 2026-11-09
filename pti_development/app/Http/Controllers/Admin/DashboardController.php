<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use App\Models\Inquiry;
use App\Models\Project;
use App\Models\TeamMember;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Admin/Dashboard', [
            'counts' => [
                'projects' => Project::count(),
                'inquiries' => Inquiry::count(),
                'unread' => Inquiry::whereNull('read_at')->count(),
                'siteVisits' => Inquiry::where('source', 'site_visit')->count(),
                'team' => TeamMember::count(),
                'faqs' => Faq::count(),
            ],
            'latest' => Inquiry::with('project:id,name')->latest()->take(6)->get(),
        ]);
    }
}
