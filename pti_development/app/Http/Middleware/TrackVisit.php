<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Built-in visit counter (Admin → Dashboard graph). Records successful public page views only:
 * not the admin, not signed-in admins, not bots, not form posts / partial reloads / prefetches.
 * Changes nothing in the response.
 */
class TrackVisit
{
    private const BOTS = '/bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|curl|wget|python|headless|lighthouse|pingdom|uptime|monitor|scan/i';

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        try {
            if ($this->shouldCount($request, $response)) {
                $ua = (string) $request->userAgent();
                $day = now()->toDateString();
                $ref = parse_url((string) $request->headers->get('referer'), PHP_URL_HOST);

                DB::table('page_visits')->insert([
                    'day' => $day,
                    'path' => mb_substr('/'.ltrim($request->path(), '/'), 0, 255),
                    'visitor' => substr(hash('sha256', $day.'|'.$request->ip().'|'.$ua.'|'.config('app.key')), 0, 16),
                    'device' => preg_match('/iPad|Tablet/i', $ua) ? 'tablet' : (preg_match('/Mobi|Android|iPhone/i', $ua) ? 'mobile' : 'desktop'),
                    // only outside sites count as a source; moving between our own pages does not
                    'referrer' => $ref && $ref !== $request->getHost() ? mb_substr(preg_replace('/^www\./', '', $ref), 0, 120) : null,
                    'created_at' => now(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('Visit not recorded: '.$e->getMessage());   // never break the page over a statistic
        }

        return $response;
    }

    private function shouldCount(Request $request, Response $response): bool
    {
        return $request->isMethod('GET')
            && $response->getStatusCode() === 200
            && ! $request->is('admin', 'admin/*', 'storage/*', 'build/*', 'up', 'images/*', 'videos/*')
            && ! $request->user()
            && ! $request->header('X-Inertia-Partial-Data')
            && $request->header('Purpose') !== 'prefetch'
            && $request->header('Sec-Purpose') !== 'prefetch'
            && ! preg_match(self::BOTS, (string) $request->userAgent())
            && filled($request->userAgent());
    }
}
