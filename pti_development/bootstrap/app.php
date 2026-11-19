<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\TrackVisit::class,   // built-in visit counter (public pages only)
        ]);
        $middleware->alias(['area' => \App\Http\Middleware\EnsureAdminArea::class]);
        $middleware->redirectGuestsTo(fn () => route('admin.login'));
        $middleware->redirectUsersTo(fn () => route('admin.dashboard'));
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        /* public website: a "not found" (missing project, hidden page...) shows the site's own 404 page, edited in
           Admin → Pages → 404 page. The admin panel, files and JSON requests keep Laravel's plain response. */
        $exceptions->respond(function (\Symfony\Component\HttpFoundation\Response $response, \Throwable $e, \Illuminate\Http\Request $request) {
            if ($response->getStatusCode() !== 404 || ! \App\Http\Controllers\SiteController::showsNotFoundPage($request)) {
                return $response;
            }
            try {
                return \App\Http\Controllers\SiteController::notFoundPage($request);
            } catch (\Throwable) {
                return $response;   // never let the 404 page itself break the response
            }
        });
    })->create();
