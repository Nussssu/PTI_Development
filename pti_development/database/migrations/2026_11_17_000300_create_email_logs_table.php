<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_logs', function (Blueprint $table) {
            $table->id();
            $table->string('status', 16)->index(); // sent | failed | skipped | activity
            $table->string('type', 80)->index();
            $table->string('recipient', 1000)->default('');
            $table->string('subject', 200)->default('');
            $table->text('description')->nullable();
            $table->string('actor', 120)->nullable();
            $table->timestamp('created_at')->useCurrent()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_logs');
    }
};
