<?php

namespace App\Http\Controllers\Admin;

use App\Cms\Cms;
use App\Http\Controllers\Controller;
use App\Models\Faq;
use App\Models\Inquiry;
use App\Models\MediaFile;
use App\Models\Page;
use App\Models\Project;
use App\Models\TeamMember;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        Cms::ensurePages();

        return Inertia::render('Admin/Dashboard', [
            'counts' => [
                'projects' => Project::count(),
                'inquiries' => Inquiry::count(),
                'unread' => Inquiry::whereNull('read_at')->count(),
                'open' => Inquiry::whereIn('status', ['new', 'in_progress'])->count(),
                'siteVisits' => Inquiry::where('source', 'site_visit')->count(),
                'team' => TeamMember::count(),
                'faqs' => Faq::count(),
                'pages' => Page::count(),
                'media' => MediaFile::count(),
            ],
            'latest' => Inquiry::with('project:id,name')->latest()->take(6)->get(),
            'visits' => $this->visits(),
            'recentPages' => Page::with('editor:id,name')->latest('updated_at')->take(5)->get(['id', 'title', 'slug', 'template', 'is_published', 'is_system', 'updated_at', 'updated_by'])
                ->map(fn (Page $p) => ['id' => $p->id, 'title' => $p->title, 'path' => Cms::pathFor($p), 'is_published' => $p->is_published, 'updated_at' => $p->updated_at, 'editor' => $p->editor?->name]),
            // latest activity (only for roles that can open the audit log)
            'activity' => request()->user()->canAccess('system')
                ? \App\Models\AuditLog::latest('created_at')->latest('id')->take(8)->get(['id', 'action', 'description', 'user_name', 'created_at'])
                : [],
        ]);
    }

    /** Built-in visit counter: daily views + unique visitors for the last 90 days, and 30-day breakdowns. */
    private function visits(): array
    {
        $from = now()->subDays(89)->toDateString();
        $rows = DB::table('page_visits')->where('day', '>=', $from)
            ->selectRaw('day, count(*) as views, count(distinct visitor) as visitors')->groupBy('day')->get()->keyBy('day');

        $days = [];
        for ($d = now()->subDays(89); $d->lte(now()); $d->addDay()) {
            $k = $d->toDateString();
            $days[] = ['day' => $k, 'views' => (int) ($rows[$k]->views ?? 0), 'visitors' => (int) ($rows[$k]->visitors ?? 0)];
        }

        $last30 = DB::table('page_visits')->where('day', '>=', now()->subDays(29)->toDateString());

        return [
            'days' => $days,
            'pages' => (clone $last30)->selectRaw('path, count(*) as views')->groupBy('path')->orderByDesc('views')->limit(6)->get(),
            'sources' => (clone $last30)->selectRaw("coalesce(referrer, 'Direct / typed') as source, count(*) as views")->groupBy('source')->orderByDesc('views')->limit(5)->get(),
            'devices' => (clone $last30)->selectRaw('device, count(*) as views')->groupBy('device')->orderByDesc('views')->pluck('views', 'device'),
            'since' => DB::table('page_visits')->min('day'),
        ];
    }
}
