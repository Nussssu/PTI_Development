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
        Route::get('/', Admin\DashboardController::class)->name('dashboard');

        Route::get('/inquiries', [Admin\InquiryController::class, 'index'])->name('inquiries.index');
        Route::get('/inquiries/{inquiry}', [Admin\InquiryController::class, 'show'])->name('inquiries.show');
        Route::patch('/inquiries/{inquiry}/toggle', [Admin\InquiryController::class, 'toggle'])->name('inquiries.toggle');
        Route::delete('/inquiries/{inquiry}', [Admin\InquiryController::class, 'destroy'])->name('inquiries.destroy');

        Route::get('/settings', [Admin\SettingsController::class, 'edit'])->name('settings');
        Route::put('/settings', [Admin\SettingsController::class, 'update'])->name('settings.update');
        Route::put('/settings/password', [Admin\SettingsController::class, 'password'])->name('settings.password');

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
                Route::delete('/{id}', 'destroy')->whereNumber('id')->name('destroy');
            });
    });
});
