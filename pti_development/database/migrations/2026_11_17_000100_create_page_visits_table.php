<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Built-in visit counter: one row per public page view (no cookies, no raw IPs stored). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('page_visits', function (Blueprint $table) {
            $table->id();
            $table->date('day');
            $table->string('path', 255);
            $table->char('visitor', 16);                 // daily-salted hash of IP + browser: counts unique visitors per day, cannot identify anyone
            $table->string('device', 10)->default('desktop');   // desktop | mobile | tablet
            $table->string('referrer', 120)->nullable();         // host the visitor came from (google.com, facebook.com, ...)
            $table->timestamp('created_at')->useCurrent();
            $table->index(['day', 'visitor']);
            $table->index(['day', 'path']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_visits');
    }
};
