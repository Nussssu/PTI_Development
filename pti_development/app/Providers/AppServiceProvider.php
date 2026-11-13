<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->serveViteToTheRequestHost();
    }

    /**
     * Local network testing (`php artisan serve` with SERVER_HOST=0.0.0.0 + `npm run dev`):
     * the Vite dev server announces itself as http://127.0.0.1:5173 in public/hot, which only works
     * on this machine. Point the dev assets at the host the page was opened with instead
     * (127.0.0.1 stays 127.0.0.1, a phone on http://192.168.x.x:8000 gets http://192.168.x.x:5173).
     * Only in the local environment, and only while the dev server is running.
     */
    private function serveViteToTheRequestHost(): void
    {
        if (! $this->app->environment('local') || $this->app->runningInConsole()) {
            return;
        }

        $hot = public_path('hot');
        $host = request()->getHost();
        if (! is_file($hot) || ! filter_var($host, FILTER_VALIDATE_IP) && $host !== 'localhost') {
            return;
        }

        $url = trim((string) file_get_contents($hot));
        $parts = parse_url($url);
        if (! $parts || empty($parts['host']) || $parts['host'] === $host) {
            return;
        }

        $port = isset($parts['port']) ? ':'.$parts['port'] : '';
        $scheme = $parts['scheme'] ?? 'http';
        $target = storage_path('framework/vite-hot-'.preg_replace('/[^0-9a-z.]/i', '_', $host));
        $wanted = "{$scheme}://{$host}{$port}";

        if (! is_file($target) || trim((string) file_get_contents($target)) !== $wanted) {
            file_put_contents($target, $wanted);
        }

        Vite::useHotFile($target);
    }
}
