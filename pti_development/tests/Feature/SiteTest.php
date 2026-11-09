<?php

namespace Tests\Feature;

use App\Models\Inquiry;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SiteTest extends TestCase
{
    use RefreshDatabase;

    protected bool $seed = true;

    public function test_public_pages_render_with_database_content(): void
    {
        $this->get('/')->assertOk()->assertInertia(fn (Assert $p) => $p
            ->component('Home')
            ->has('projects', 9)
            ->has('stats', 4)
            ->has('faqs', 5)
            ->where('site.phone', '+880 1608 770711'));

        $this->get('/about')->assertOk()->assertInertia(fn (Assert $p) => $p->component('About')->has('team', 14)->has('values', 6));
        $this->get('/services')->assertOk()->assertInertia(fn (Assert $p) => $p->component('Services')->has('services', 3));
        $this->get('/projects')->assertOk()->assertInertia(fn (Assert $p) => $p->component('Projects/Index')->has('projects', 9));
        $this->get('/contact')->assertOk();
    }

    public function test_project_page_and_unpublished_projects(): void
    {
        $this->get('/projects/arcadia-palace')->assertOk()->assertInertia(fn (Assert $p) => $p
            ->component('Projects/Show')
            ->where('project.name', 'Arcadia Palace')
            ->has('related', 8));

        Project::where('slug', 'dream-tower')->update(['is_published' => false]);
        $this->get('/projects/dream-tower')->assertNotFound();
        $this->get('/projects/does-not-exist')->assertNotFound();
    }

    public function test_contact_form_validates_and_stores_inquiry(): void
    {
        $this->post('/inquiries', [])->assertSessionHasErrors(['first_name', 'last_name', 'email', 'phone', 'message']);

        $this->post('/inquiries', [
            'first_name' => 'Rahim', 'last_name' => 'Uddin', 'email' => 'rahim@example.com',
            'phone' => '+880 1700 000000', 'message' => 'Interested in a flat.',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('inquiries', ['email' => 'rahim@example.com', 'source' => 'contact']);
    }

    public function test_site_visit_request_needs_only_name_and_phone(): void
    {
        $project = Project::first();
        $this->post('/inquiries', [
            'source' => 'site_visit', 'project_id' => $project->id, 'first_name' => 'Karim', 'phone' => '01700000000',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('inquiries', ['first_name' => 'Karim', 'source' => 'site_visit', 'project_id' => $project->id]);
    }

    public function test_honeypot_blocks_bots(): void
    {
        $this->post('/inquiries', [
            'source' => 'site_visit', 'first_name' => 'Bot', 'phone' => '01700000000', 'website' => 'http://spam.example',
        ])->assertSessionHasErrors('website');
        $this->assertDatabaseCount('inquiries', 0);
    }

    public function test_admin_requires_login(): void
    {
        $this->get('/admin')->assertRedirect('/admin/login');
        $this->get('/admin/content/projects')->assertRedirect('/admin/login');
        $this->post('/admin/content/projects', [])->assertRedirect('/admin/login');
    }

    public function test_admin_can_log_in_with_seeded_credentials(): void
    {
        $this->post('/admin/login', ['email' => 'admin@ptidlbd.com', 'password' => 'wrong'])->assertSessionHasErrors('email');
        $this->post('/admin/login', ['email' => 'admin@ptidlbd.com', 'password' => env('ADMIN_PASSWORD', 'password')])
            ->assertRedirect('/admin');
    }

    public function test_admin_can_create_update_and_delete_a_project_with_images(): void
    {
        Storage::fake('public');
        $admin = User::first();

        $this->actingAs($admin)->post('/admin/content/projects', [
            'name' => 'PTI Green Valley', 'units' => 40, 'status' => 'Upcoming',
            'location' => '5 min to Mirpur 10', 'area' => 'Mirpur',
            'image' => UploadedFile::fake()->image('tower.jpg', 800, 1000),
            'features' => [['label' => 'Floors', 'value' => 'G+9'], ['label' => '', 'value' => '']],
            'gallery_new' => [UploadedFile::fake()->image('g1.jpg'), UploadedFile::fake()->image('g2.jpg')],
            'is_published' => '1', 'is_featured' => '0',
        ])->assertRedirect('/admin/content/projects');

        $project = Project::where('slug', 'pti-green-valley')->firstOrFail();
        $this->assertSame([['label' => 'Floors', 'value' => 'G+9']], $project->features);
        $this->assertCount(2, $project->gallery);
        $this->assertFalse($project->is_featured);
        Storage::disk('public')->assertExists($project->image);
        $this->get('/projects/pti-green-valley')->assertOk();

        // keep one gallery image, remove the main image
        $keep = $project->gallery[0];
        $removed = $project->gallery[1];
        $this->actingAs($admin)->put("/admin/content/projects/{$project->id}", [
            'name' => 'PTI Green Valley', 'units' => 42, 'status' => 'Upcoming',
            'location' => '5 min to Mirpur 10', 'area' => 'Mirpur',
            'gallery' => [$keep], 'image_remove' => '1', 'is_published' => '1',
        ])->assertRedirect();

        $project->refresh();
        $this->assertSame(42, $project->units);
        $this->assertSame([$keep], $project->gallery);
        $this->assertNull($project->image);
        Storage::disk('public')->assertMissing($removed);

        $this->actingAs($admin)->delete("/admin/content/projects/{$project->id}")->assertRedirect();
        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
        Storage::disk('public')->assertMissing($keep);
    }

    public function test_admin_validation_and_unknown_resources(): void
    {
        $admin = User::first();
        $this->actingAs($admin)->post('/admin/content/projects', ['name' => ''])->assertSessionHasErrors(['name', 'units', 'location', 'area']);
        $this->actingAs($admin)->get('/admin/content/users')->assertNotFound();
    }

    public function test_admin_inbox_marks_messages_read_and_settings_update_site(): void
    {
        $admin = User::first();
        $inquiry = Inquiry::create(['first_name' => 'A', 'phone' => '0170000000', 'source' => 'contact']);

        $this->actingAs($admin)->get("/admin/inquiries/{$inquiry->id}")->assertOk();
        $this->assertNotNull($inquiry->fresh()->read_at);

        $this->actingAs($admin)->put('/admin/settings', ['email' => 'sales@ptidlbd.com', 'phone' => '+880 1999 999999'])->assertSessionHasNoErrors();
        $this->get('/')->assertInertia(fn (Assert $p) => $p->where('site.phone', '+880 1999 999999'));
    }
}
