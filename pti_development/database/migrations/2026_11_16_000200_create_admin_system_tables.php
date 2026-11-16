<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Admin system: user roles + login tracking, the audit log and editable email templates.
 * (SMTP / Gmail and custom code live in the settings table as key/value rows.)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 30)->default('editor')->after('password');   // super_admin | admin | editor
            $table->boolean('is_active')->default(true)->after('role');
            $table->timestamp('last_login_at')->nullable()->after('is_active');
            $table->string('last_login_ip', 45)->nullable()->after('last_login_at');
        });
        // whoever already exists (the seeded admin) keeps full access
        DB::table('users')->update(['role' => 'super_admin']);

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('user_name')->nullable();          // kept even if the user is deleted later
            $table->string('action', 40);                     // created | updated | deleted | login | ...
            $table->string('subject_type', 60)->nullable();   // Project, Page, Inquiry, ...
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('subject_label')->nullable();
            $table->string('description', 500);
            $table->json('changes')->nullable();              // {field: [old, new]}
            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['subject_type', 'subject_id']);
            $table->index('created_at');
        });

        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('subject');
            $table->text('body');
            $table->boolean('is_enabled')->default(true);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // inbox statuses now follow the lead's life: new → in progress → replied → archived
        DB::table('inquiries')->where('status', 'closed')->update(['status' => 'archived']);
        DB::table('inquiries')->whereNotNull('replied_at')->where('status', 'in_progress')->update(['status' => 'replied']);
    }

    public function down(): void
    {
        DB::table('inquiries')->where('status', 'archived')->update(['status' => 'closed']);
        DB::table('inquiries')->where('status', 'replied')->update(['status' => 'in_progress']);
        Schema::dropIfExists('email_templates');
        Schema::dropIfExists('audit_logs');
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn(['role', 'is_active', 'last_login_at', 'last_login_ip']));
    }
};
