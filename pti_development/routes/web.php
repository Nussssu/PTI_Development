<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\SiteController;
use Illuminate\Support\Facades\Route;

/* ---------------- Public site ---------------- */
Route::controller(SiteController::class)->group(function () {
    Route::get('/', 'home')->name('home');
    Route::get('/about', 'about')->name('about');
    Route::get('/services', 'services')->name('services');
    Route::get('/projects', 'projects')->name('projects');
    Route::get('/projects/{project:slug}', 'project')->name('projects.show');
    Route::get('/contact', 'contact')->name('contact');
    Route::get('/404', 'notFound')->name('not-found');   // the 404 page itself (Admin → Pages → 404 page → View)
});

Route::post('/inquiries', [InquiryController::class, 'store'])
    ->middleware('throttle:6,1')
    ->name('inquiries.store');

/* ---------------- Admin panel ---------------- */
Route::prefix('admin')->name('admin.')->group(function () {
    Route::middleware('guest')->group(function () {
        Route::get('/login', [Admin\AuthController::class, 'show'])->name('login');
        Route::post('/login', [Admin\AuthController::class, 'login'])->middleware('throttle:10,1');
    });

    Route::middleware('auth')->group(function () {
        Route::post('/logout', [Admin\AuthController::class, 'logout'])->name('logout');

        // everyone signed in: dashboard + own security
        Route::middleware('area:content')->group(function () {
            Route::get('/', Admin\DashboardController::class)->name('dashboard');
            Route::controller(Admin\SecurityController::class)->prefix('security')->name('security.')->group(function () {
                Route::get('/', 'edit')->name('edit');
                Route::put('/profile', 'profile')->name('profile');
                Route::put('/password', 'password')->name('password');
                Route::post('/logout-others', 'logoutOthers')->name('logout-others');
            });
        });

        /* Leads (inbox) */
        Route::middleware('area:leads')->controller(Admin\InquiryController::class)->prefix('inquiries')->name('inquiries.')->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/export', 'export')->name('export');
            Route::post('/import', 'import')->name('import');
            Route::post('/bulk', 'bulk')->name('bulk');
            Route::get('/{inquiry}', 'show')->name('show');
            Route::patch('/{inquiry}/toggle', 'toggle')->name('toggle');
            Route::get('/{inquiry}/edit', 'edit')->name('edit');
            Route::put('/{inquiry}', 'update')->name('update');
            Route::post('/{inquiry}/reply', 'reply')->middleware('throttle:20,1')->name('reply');
            Route::delete('/{inquiry}', 'destroy')->name('destroy');
        });

        /* Content: pages (sections + SEO), header & footer, media library, collections */
        Route::middleware('area:content')->group(function () {
            Route::controller(Admin\PageController::class)->prefix('pages')->name('pages.')->group(function () {
                Route::get('/', 'index')->name('index');
                Route::post('/', 'store')->name('store');
                Route::get('/{page}/edit', 'edit')->name('edit');
                Route::put('/{page}', 'update')->name('update');
                Route::post('/{page}/duplicate', 'duplicate')->name('duplicate');
                Route::patch('/{page}/toggle', 'toggle')->name('toggle');
                Route::delete('/{page}', 'destroy')->name('destroy');
            });
            Route::get('/layout', [Admin\BlockController::class, 'edit'])->name('layout');
            Route::put('/layout/{key}', [Admin\BlockController::class, 'update'])->whereIn('key', ['header', 'footer'])->name('layout.update');
            Route::controller(Admin\MediaController::class)->prefix('media')->name('media.')->group(function () {
                Route::get('/', 'index')->name('index');
                Route::get('/list', 'list')->name('list');
                Route::post('/', 'store')->name('store');
                Route::patch('/{media}', 'update')->name('update');
                Route::delete('/{media}', 'destroy')->name('destroy');
            });

            // generic content CRUD: projects, services, team, values, stats, faqs, testimonials
            Route::controller(Admin\ResourceController::class)
                ->prefix('content/{resource}')
                ->whereIn('resource', array_keys(\App\Admin\Resources::all()))
                ->name('resource.')
                ->group(function () {
                    Route::get('/', 'index')->name('index');
                    Route::get('/create', 'create')->name('create');
                    Route::post('/', 'store')->name('store');
                    Route::get('/{id}/edit', 'edit')->whereNumber('id')->name('edit');
                    Route::put('/{id}', 'update')->whereNumber('id')->name('update');
                    Route::patch('/{id}/toggle/{field}', 'toggle')->whereNumber('id')->name('toggle');
                    Route::patch('/{id}/move', 'move')->whereNumber('id')->name('move');
                    Route::post('/{id}/duplicate', 'duplicate')->whereNumber('id')->name('duplicate');
                    Route::delete('/{id}', 'destroy')->whereNumber('id')->name('destroy');
                });
        });

        /* System & administration */
        Route::middleware('area:system')->group(function () {
            Route::get('/settings', [Admin\SettingsController::class, 'edit'])->name('settings');
            Route::put('/settings', [Admin\SettingsController::class, 'update'])->name('settings.update');

            Route::controller(Admin\MailController::class)->prefix('email')->name('email.')->group(function () {
                Route::get('/smtp', 'smtp')->name('smtp');
                Route::get('/logs', 'logs')->name('logs');
                Route::put('/smtp', 'saveSmtp')->name('smtp.update');
                Route::post('/smtp/test', 'test')->middleware('throttle:10,1')->name('smtp.test');
                Route::get('/templates', 'templates')->name('templates');
                Route::put('/templates/{key}', 'saveTemplate')->name('templates.update');
                Route::post('/templates/{key}/test', 'sendTemplateTest')->middleware('throttle:10,1')->name('templates.test');
                Route::post('/preview', 'preview')->name('preview');
            });

            Route::get('/audit', [Admin\AuditController::class, 'index'])->name('audit');
            Route::get('/audit/export', [Admin\AuditController::class, 'export'])->name('audit.export');
            Route::delete('/audit', [Admin\AuditController::class, 'purge'])->name('audit.purge');
        });

        Route::middleware('area:users')->controller(Admin\UserController::class)->prefix('users')->name('users.')->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/', 'store')->name('store');
            Route::put('/{user}', 'update')->name('update');
            Route::delete('/{user}', 'destroy')->name('destroy');
        });
    });
});

/* ---------------- Pages made in the admin panel (copies of the site's pages), e.g. /offers ---------------- */
Route::get('/{slug}', [SiteController::class, 'page'])
    ->where('slug', '[a-z0-9]+(?:-[a-z0-9]+)*')
    ->name('page');

/* ---------------- Any other address: the 404 page (Admin → Pages → 404 page) ---------------- */
Route::fallback([SiteController::class, 'notFound']);
