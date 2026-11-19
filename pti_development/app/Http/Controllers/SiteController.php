<?php

namespace App\Http\Controllers;

use App\Cms\Cms;
use App\Models\CompanyValue;
use App\Models\Faq;
use App\Models\Page;
use App\Models\Project;
use App\Models\Service;
use App\Models\Stat;
use App\Models\TeamMember;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * The public website. Every page is a CMS page (App\Cms): its template decides the design and the collections
 * it lists, its sections carry the texts / images edited in the admin panel.
 */
class SiteController extends Controller
{
    public function home(): Response
    {
        return $this->render(Cms::system('home'));
    }

    public function about(): Response
    {
        return $this->render(Cms::system('about'));
    }

    public function services(): Response
    {
        return $this->render(Cms::system('services'));
    }

    public function projects(): Response
    {
        return $this->render(Cms::system('projects'));
    }

    public function contact(): Response
    {
        return $this->render(Cms::system('contact'));
    }

    public function project(Project $project): Response
    {
        abort_unless($project->is_published || auth()->check(), 404);
        $all = Project::published()->ordered()->get(['id']);

        return $this->render(Cms::system('project-detail'), [
            'project' => $project,
            'index' => $all->search(fn ($p) => $p->id === $project->id) + 1,
            'total' => $all->count(),
            'related' => Project::published()->where('id', '!=', $project->id)->ordered()->get(),
        ], ['name' => $project->name, 'units' => (string) $project->units, 'area' => $project->area]);
    }

    /** A page made in the admin panel (a copy of one of the site's pages) at /{slug}. */
    public function page(string $slug): Response
    {
        $page = Page::where('slug', $slug)->where('is_system', false)->firstOrFail();

        return $this->render($page);
    }

    /** /404 (the admin's "View" link) and every address that matches no route. */
    public function notFound(Request $request): SymfonyResponse
    {
        abort_unless(static::showsNotFoundPage($request), 404);   // admin / files: Laravel's plain 404

        return static::notFoundPage($request);
    }

    /** Only the public website gets the designed 404 page; the admin panel, files and JSON calls do not. */
    public static function showsNotFoundPage(Request $request): bool
    {
        return ! $request->is('admin', 'admin/*', 'storage/*', 'build/*', 'images/*', 'videos/*', 'uploads/*', 'up')
            && ! ($request->expectsJson() && ! $request->header('X-Inertia'));
    }

    /**
     * The "page not found" page (Admin → Pages → 404 page), sent with the 404 status. Also used by the exception
     * handler (bootstrap/app.php) for missing projects, hidden pages and the like. Always shown, never indexed.
     */
    public static function notFoundPage(Request $request): SymfonyResponse
    {
        $cms = Cms::payload(Cms::system('not-found'));
        $cms['seo']['noindex'] = true;

        return Inertia::render('NotFound', ['cms' => $cms])->toResponse($request)->setStatusCode(404);
    }

    /** @param array $tokens {name}-style values filled into the SEO texts */
    private function render(Page $page, array $extra = [], array $tokens = []): Response
    {
        abort_unless($page->is_published || auth()->check(), 404);
        $template = Cms::template($page->template);
        $cms = Cms::payload($page);
        if ($tokens) {
            $map = collect($tokens)->mapWithKeys(fn ($v, $k) => ['{'.$k.'}' => $v])->all();
            $cms['seo']['title'] = strtr($cms['seo']['title'], $map);
            $cms['seo']['description'] = strtr($cms['seo']['description'], $map);
        }

        return Inertia::render($template['component'], $this->collections($page->template) + $extra + ['cms' => $cms]);
    }

    /** The lists (projects, team, FAQ...) each page design shows. */
    private function collections(string $template): array
    {
        return match ($template) {
            'home' => [
                'projects' => Project::published()->where('is_featured', true)->ordered()->get(),
                'stats' => Stat::where('page', 'home')->ordered()->get(),
                'faqs' => Faq::where('is_published', true)->ordered()->get(),
                'projectCount' => Project::published()->count(),
                'services' => Service::ordered()->get(),
                'values' => $this->values(),
            ],
            'about' => [
                'values' => $this->values(),
                'stats' => Stat::where('page', 'about')->ordered()->get(),
                'team' => TeamMember::where('is_published', true)->ordered()->get(),
                'projects' => Project::published()->where('is_featured', true)->ordered()->get(),
                'services' => Service::ordered()->get(),
                'faqs' => Faq::where('is_published', true)->ordered()->get(),
                'homeStats' => Stat::where('page', 'home')->ordered()->get(),
            ],
            'services' => ['services' => Service::ordered()->get()],
            'projects' => ['projects' => Project::published()->ordered()->get()],
            default => [],
        };
    }

    /** Values are managed with the About page section and shared with the home page. */
    private function values(): array
    {
        $about = Cms::system('about');
        $stored = $about->sections()->where('key', 'values')->first()?->content ?? [];
        if (array_key_exists('items', $stored)) {
            $items = Cms::payload($about)['sections']['values']['items'] ?? [];
            return collect($items)->values()->map(fn ($value, $i) => [
                'id' => 'about-value-'.$i,
                'title' => $value['title'] ?? '',
                'text' => $value['text'] ?? '',
            ])->all();
        }

        return CompanyValue::ordered()->get()->all();
    }
}
