<?php

namespace Database\Seeders;

use App\Models\CompanyValue;
use App\Models\Faq;
use App\Models\Project;
use App\Models\Service;
use App\Models\Setting;
use App\Models\Stat;
use App\Models\TeamMember;
use App\Models\Testimonial;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

/**
 * Seeds the site with the content from the original ptidlbd.com website.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->copyMedia();

        User::updateOrCreate(
            ['email' => env('ADMIN_EMAIL', 'admin@ptidlbd.com')],
            ['name' => 'PTI Admin', 'password' => Hash::make(env('ADMIN_PASSWORD', 'password'))]
        );

        Setting::put(collect(Setting::FIELDS)->map(fn ($f) => $f[1])->all());

        $projects = [
            ['PTI Shopno Tower-1', 'pti-shopno-tower-1', '3 min to ECB Chattar', 'ECB Chattar', 'p3.webp'],
            ['PTI Shopno Tower-2', 'pti-shopno-tower-2', '3 min to ECB Chattar', 'ECB Chattar', 'Project5.webp'],
            ['Darul Fazle Tower', 'darul-fazle-tower', '3 min to Kalshi Flyover', 'Kalshi Flyover', 'Project1.webp'],
            ['Matikata Tower', 'matikata-tower', '3 min to Kalshi Flyover', 'Kalshi Flyover', 'Project2.webp'],
            ['Airmen Tower', 'airmen-tower-2', '3 min to Kalshi Flyover', 'Kalshi Flyover', 'Project6.webp'],
            ['Dolphin Tower-1', 'dolphin-tower-1', '3 min to Kalshi Flyover', 'Kalshi Flyover', 'Project3.webp'],
            ['Arcadia Palace', 'arcadia-palace', 'Kawla', 'Kawla', 'Project4.webp'],
            ['Dream Tower', 'dream-tower', 'Manikdi Bazar', 'Manikdi Bazar', 'Project5.webp'],
            ['PTI Unique Society', 'pti-unique-society', '3 min to ECB Chattar', 'ECB Chattar', 'Project6.webp'],
        ];
        foreach ($projects as $i => [$name, $slug, $location, $area, $img]) {
            Project::updateOrCreate(['slug' => $slug], [
                'name' => $name, 'units' => 60, 'location' => $location, 'area' => $area,
                'status' => 'Under Construction', 'image' => "seed/projects/$img",
                'features' => [], 'gallery' => [], 'sort_order' => $i + 1,
                'is_featured' => true, 'is_published' => true,
            ]);
        }

        $this->replace(Service::class, [
            ['title' => 'Property development', 'image' => 'seed/services/service-development.jpg',
                'description' => 'We plan, design, and deliver residential and commercial projects in Dhaka.',
                'points' => ['Strategic Dhaka locations', 'Modern amenities', 'Strong construction quality', 'Commitment to timelines', 'Transparent project updates']],
            ['title' => 'Land share purchase', 'image' => 'seed/services/service-land.jpg',
                'description' => 'Our land share service allows families to secure property ownership in Dhaka with confidence.',
                'points' => ['Verified land titles', 'Clear ownership documents', 'Ethical investment model', 'Expert site selection', 'Hassle-free support', 'Long-term potential']],
            ['title' => 'Legal / Compliance', 'image' => 'seed/services/service-legal.svg',
                'description' => 'Our compliance team safeguards every step, ensuring secure, and risk-free transactions.',
                'points' => ['Detailed contract reviews', 'Proper documentation', 'Compliance with government', 'Legal guidance', 'No hidden fees', 'Dispute resolution']],
        ]);

        $team = [
            ['Md. Sheikh Ruhul Amin', 'Chairman', '2316fded96bae492aa5d435d807029ce2538f389'],
            ['S.M. Imran Hossain', 'Vice-Chairman', 'eebf10ba0d535a198f3460a90d532e527ff62870'],
            ['Md. Abdul Latif', 'Executive Director', 'b873070dd06688b29ac9a838b2e6bada4f5aaeef'],
            ['Engr. S.M. Ferdus Taj', 'Managing Director', '67cf1114b9221bd6526c1472b583bb574d9e745a'],
            ['Dr. Md. Asaduzzaman', 'Director', '4f38ed710ea508d896a4c96ed31705d577b67890'],
            ['Tajbir Alam', 'Sales & Marketing', '694ac253946e89e1f0a869781e482396b572b4ac'],
            ['Mohammad Din Islam', 'Marketing Manager', 'ee0cbc64f7912eea55aaf573e60df83bdcf936f7'],
            ['Furkan Islam', 'Project Director', '9ba68b334ae03d762ffff417288bdf8a5fb3f00d'],
            ['Md. Shahinur Rahman', 'Marketing Officer', '518957e400a179493ed5266b0c0310582325ba4e'],
            ['Tapan Hajra', 'Land Manager', 'd5fc95e4656847680ba23f89a0d6471a3244131e'],
            ['Zahiidur Rahaman', 'Project Director', 'e6968a0091e2b6f4f01c2d80df30011ab98aecfd'],
            ['Mahmudul Hasan', 'Office Assistant', 'e9ec6103604fd44ce80df127c037cb041178bf88'],
            ['Uzzal Miah', 'Driver', '5b69fa100cb4d39f75dcbd34f0344074174285fb'],
            ['Md. Torikul Sardar', 'Driver', '3d19b4bb32698d35357e2fa9c9834df033a3841f'],
        ];
        $this->replace(TeamMember::class, array_map(fn ($m) => [
            'name' => $m[0], 'role' => $m[1], 'photo' => "seed/team/{$m[2]}.webp", 'is_published' => true,
        ], $team));

        $this->replace(CompanyValue::class, [
            ['title' => 'Quality Craftsmanship', 'text' => 'We take pride in delivering precise, durable, and high-standard construction.', 'image' => 'seed/values/galleryimage106.webp'],
            ['title' => 'Transparency', 'text' => 'From pricing to paperwork, everything is clear and documented for clients.', 'image' => 'seed/values/galleryimage025.webp'],
            ['title' => 'Halal Investment', 'text' => 'We follow ethical practices, offering safe and halal ownership.', 'image' => 'seed/values/galleryimage025.webp'],
            ['title' => 'On-Time Delivery', 'text' => 'We commit to handovers as promised, ensuring timely delivery.', 'image' => 'seed/values/galleryimage4.webp'],
            ['title' => 'Customer Trust', 'text' => 'Every deal is backed by honesty and open communication.', 'image' => 'seed/values/galleryimage02.webp'],
            ['title' => 'Sustainable Design', 'text' => 'We adopt techniques that enhance comfort and reduce costs.', 'image' => 'seed/values/galleryimage01.webp'],
        ]);

        $this->replace(Stat::class, [
            ['page' => 'home', 'value' => 9, 'suffix' => '+', 'label' => 'years of experience', 'image' => 'seed/stats/impact1.webp'],
            ['page' => 'home', 'value' => 400, 'suffix' => '+', 'label' => 'units sold', 'image' => 'seed/stats/impact2.webp'],
            ['page' => 'home', 'value' => 10, 'suffix' => '+', 'label' => 'projects in portfolio', 'image' => 'seed/stats/impact3.webp'],
            ['page' => 'home', 'value' => 500, 'suffix' => '+', 'label' => 'land share sold', 'image' => 'seed/stats/impact4.webp'],
            ['page' => 'about', 'value' => 9, 'suffix' => '+', 'label' => 'Years · experience in development', 'image' => 'seed/stats/impact1.webp'],
            ['page' => 'about', 'value' => 8, 'suffix' => '', 'label' => 'Projects · in the portfolio', 'image' => 'seed/stats/impact3.webp'],
            ['page' => 'about', 'value' => 1000, 'suffix' => '+', 'label' => 'Units · sold in last year', 'image' => 'seed/stats/impact2.webp'],
            ['page' => 'about', 'value' => 2, 'suffix' => '', 'label' => 'Offices · in Dhaka', 'image' => 'seed/stats/impact4.webp'],
        ]);

        // Answers are drawn from the site's own service & value copy.
        $this->replace(Faq::class, [
            ['question' => 'What services does PTI Development offer?', 'answer' => "We deliver end-to-end solutions for Dhaka's real estate market: property development of residential and commercial projects, land share purchase, and full legal & compliance support."],
            ['question' => 'Is investing with PTI halal?', 'answer' => 'Yes. We follow ethical practices, offering safe and halal ownership, with an ethical investment model behind every land share.'],
            ['question' => 'How do you make sure land titles are safe?', 'answer' => 'Every land share comes with verified land titles and clear ownership documents. Our compliance team handles detailed contract reviews, proper documentation and compliance with government requirements, with no hidden fees.'],
            ['question' => 'Where are your projects located?', 'answer' => 'Our projects are in strategic Dhaka locations, minutes from ECB Chattar and the Kalshi Flyover, as well as Kawla and Manikdi Bazar.'],
            ['question' => 'Will my home be handed over on time?', 'answer' => 'We commit to handovers as promised, ensuring timely delivery, and share transparent project updates throughout construction.'],
        ]);

        // Placeholder carried over from the original site. Replace it from the admin panel.
        $this->replace(Testimonial::class, [
            ['name' => 'Hannah Schmitt', 'role' => 'Owner PTI Dream Tower-1', 'is_published' => true,
                'quote' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cursus nibh mauris, nec turpis orci lectus maecenas. Suspendisse sed magna eget nibh in turpis. Consequat duis diam lacus arcu.'],
        ]);
    }

    /** Seed a table only when it is empty, so re-running never wipes admin edits. */
    private function replace(string $model, array $rows): void
    {
        if ($model::query()->exists()) {
            return;
        }
        foreach ($rows as $i => $row) {
            $model::create($row + ['sort_order' => $i + 1]);
        }
    }

    private function copyMedia(): void
    {
        $disk = Storage::disk('public');
        foreach (File::allFiles(database_path('seeders/media')) as $file) {
            $target = 'seed/'.str_replace('\\', '/', $file->getRelativePathname());
            if (! $disk->exists($target)) {
                $disk->put($target, File::get($file->getPathname()));
            }
        }
    }
}
