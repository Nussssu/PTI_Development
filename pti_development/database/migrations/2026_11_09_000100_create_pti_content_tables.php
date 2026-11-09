<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->unsignedInteger('units')->default(0);
            $table->string('location');                 // e.g. "3 min to ECB Chattar"
            $table->string('area');                     // e.g. "ECB Chattar" (used for filters)
            $table->string('status')->default('Under Construction');
            $table->string('image')->nullable();
            $table->text('description')->nullable();
            $table->json('features')->nullable();       // [{label, value}]
            $table->json('gallery')->nullable();        // [path, path, ...]
            $table->boolean('is_featured')->default(true);
            $table->boolean('is_published')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('image')->nullable();
            $table->json('points')->nullable();         // ["Verified land titles", ...]
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('team_members', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('role');
            $table->string('photo')->nullable();
            $table->boolean('is_published')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('company_values', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('text');
            $table->string('image')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('stats', function (Blueprint $table) {
            $table->id();
            $table->string('page')->default('home');    // home | about
            $table->unsignedInteger('value');
            $table->string('suffix', 8)->nullable();
            $table->string('label');
            $table->string('image')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('faqs', function (Blueprint $table) {
            $table->id();
            $table->string('question');
            $table->text('answer');
            $table->boolean('is_published')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('testimonials', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('role')->nullable();
            $table->text('quote');
            $table->string('photo')->nullable();
            $table->boolean('is_published')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        Schema::create('inquiries', function (Blueprint $table) {
            $table->id();
            $table->string('source')->default('contact');   // contact | site_visit
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->string('first_name');
            $table->string('last_name')->nullable();
            $table->string('email')->nullable();
            $table->string('phone');
            $table->text('message')->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['inquiries', 'settings', 'testimonials', 'faqs', 'stats', 'company_values', 'team_members', 'services', 'projects'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
