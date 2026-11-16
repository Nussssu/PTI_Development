<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * CMS: editable pages (each made of toggleable sections with their own content + SEO),
 * the header / footer blocks, a media library, and replies / notes on inquiries.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();             // home, about, ... or a custom slug for copies
            $table->string('title');
            $table->string('template');                   // which page design renders it (App\Cms\Templates)
            $table->boolean('is_system')->default(false); // the site's built-in pages cannot be deleted
            $table->boolean('is_published')->default(true);
            $table->json('seo')->nullable();              // {title, description, keywords, image, canonical, noindex}
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('page_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('page_id')->constrained()->cascadeOnDelete();
            $table->string('key');                        // section key from the template
            $table->boolean('is_enabled')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->json('content')->nullable();          // only the edited fields; defaults come from the template
            $table->timestamps();
            $table->unique(['page_id', 'key']);
        });

        Schema::create('site_blocks', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();              // header | footer
            $table->json('content')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->string('path');
            $table->string('name');
            $table->string('mime', 100)->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->string('alt')->nullable();
            $table->timestamps();
        });

        Schema::table('inquiries', function (Blueprint $table) {
            $table->string('status')->default('new')->after('message');   // new | in_progress | closed
            $table->text('notes')->nullable()->after('status');
            $table->timestamp('replied_at')->nullable()->after('read_at');
        });

        Schema::create('inquiry_replies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inquiry_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('to');
            $table->string('subject');
            $table->text('body');
            $table->boolean('sent')->default(true);
            $table->string('error')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inquiry_replies');
        Schema::table('inquiries', fn (Blueprint $t) => $t->dropColumn(['status', 'notes', 'replied_at']));
        Schema::dropIfExists('media');
        Schema::dropIfExists('site_blocks');
        Schema::dropIfExists('page_sections');
        Schema::dropIfExists('pages');
    }
};
