<?php

namespace App\Cms;

/** Section definitions used by more than one page. */
class Shared
{
    /** The photo / video hero of the inner pages (Components/Site.jsx PageHero). */
    public static function pageHero(string $title, ?string $image, ?string $video = null, ?string $description = null): array
    {
        $fields = [
            F::rich('title', 'Title', $title, 'One line per row. Wrap words in *asterisks* for the gold accent style.'),
            F::image('image', $video ? 'Poster image (shown while the video loads)' : 'Background image', $image, true),
        ];
        if ($video !== null) {
            $fields[] = F::video('video', 'Background video (MP4)', $video, 'Muted, looping. Leave empty to show the image only.');
        }

        return F::section('hero', 'Hero', $fields, $description ?? 'The full-screen photo at the top of the page.');
    }

    /** The contact form block with the keys photo (Pages/Home.jsx HomeContact; also on Contact). */
    public static function homeContact(string $image): array
    {
        return F::section('contact', 'Contact form', [
            F::image('image', 'Photo', $image, true),
            F::text('image_alt', 'Photo description (alt text)', 'A PTI agent handing the keys of a new home to a couple'),
            F::text('eyebrow', 'Small heading', 'Get in touch', null, true),
            F::rich('title', 'Title', 'Letâ€™s build *your home*', 'Words in *asterisks* get the handwritten style.'),
            F::text('label_first', 'First name label', 'First Name', null, true),
            F::text('label_last', 'Last name label', 'Last Name', null, true),
            F::text('label_email', 'Email label', 'Email Address', null, true),
            F::text('label_phone', 'Phone label', 'Phone', null, true),
            F::text('label_message', 'Message label', 'Message', null, true),
            F::text('submit', 'Send button', 'Send message', null, true),
            F::text('sent_title', 'After sending: title', 'Message sent.', null, true),
            F::text('again', 'After sending: button', 'Send another message', null, true),
            F::textarea('sent_text', 'After sending: text', 'Thank you for reaching out. Our team will get back to you shortly.'),
        ], 'The photo with the "Letâ€™s build your home" form. Messages arrive under Messages.');
    }

    /** "Questions, answered" (Pages/Home.jsx Faq). */
    public static function faq(): array
    {
        return F::section('faq', 'Questions, answered', [
            F::textarea('title', 'Heading', "Questions,\nanswered", 'Press Enter for a new line.'),
            F::repeater('items', 'Questions', [
                F::text('question', 'Question', ''),
                F::textarea('answer', 'Answer', ''),
            ], [
                ['question' => 'What services does PTI Development offer?', 'answer' => 'We deliver end-to-end solutions for Dhaka\'s real estate market: property development of residential and commercial projects, land share purchase, and full legal & compliance support.'],
                ['question' => 'Is investing with PTI halal?', 'answer' => 'Yes. We follow ethical practices, offering safe and halal ownership, with an ethical investment model behind every land share.'],
                ['question' => 'How do you make sure land titles are safe?', 'answer' => 'Every land share comes with verified land titles and clear ownership documents. Our compliance team handles detailed contract reviews, proper documentation and compliance with government requirements, with no hidden fees.'],
                ['question' => 'Where are your projects located?', 'answer' => 'Our projects are in strategic Dhaka locations, minutes from ECB Chattar and the Kalshi Flyover, as well as Kawla and Manikdi Bazar.'],
                ['question' => 'Will my home be handed over on time?', 'answer' => 'We commit to handovers as promised, ensuring timely delivery, and share transparent project updates throughout construction.'],
            ], 'question', 'The first question opens by default on the Contact page.'),
        ], 'The heading and the questions & answers shown on the Contact page.');
    }

    /** "What we stand for" (Pages/Home.jsx Values). */
    public static function values(string $image): array
    {
        return F::section('values', 'What we stand for', [
            F::text('eyebrow', 'Small heading', 'What we stand for'),
            F::image('image', 'Background photo', $image, true),
        ], 'Manage values and their images under Pages → About → What we stand for.');
    }

    /** The chairman's quote band (Pages/Home.jsx Quote). */
    public static function quote(string $image): array
    {
        return F::section('quote', 'Quote', [
            F::textarea('text', 'Quote', 'Every square foot we build is a commitment, to trust, to safety, and to the dreams of our clients.'),
            F::textarea('author', 'Name and role', "Md. Ruhul Amin\nChairman, PTI Development", 'Press Enter for a new line.'),
            F::image('image', 'Photo', $image, true),
            F::text('image_alt', 'Photo description (alt text)', 'Building under construction with tower cranes'),
        ]);
    }

    /** "Let's talk / Ready to build your dream?" (Components/Site.jsx Cta). */
    public static function cta(): array
    {
        return F::section('cta', "Let's talk", [
            F::image('image', 'Photo', '/images/lets-talk-keys.webp', true),
            F::text('image_alt', 'Photo description (alt text)', 'A PTI agent handing the keys of a new apartment to a smiling couple'),
            F::text('eyebrow', 'Small heading', "Let's talk", null, true),
            F::rich('title', 'Title', 'Ready to build *your dream?*', 'Words in *asterisks* get the handwritten style.'),
            F::textarea('lead', 'Text', 'We will show you finished and under construction projects, introduce you to the features of the areas and tell you about the real estate market in Dhaka.'),
            F::text('badge_text', 'Round badge text', 'Book the meeting Â· Book the meeting Â·', null, true),
            F::text('href', 'Badge link', '/contact#contact', null, true),
        ], 'The closing block with the photo and the round "Book the meeting" badge.');
    }
}
