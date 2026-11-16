<?php

namespace App\Cms;

/**
 * Field builders for page sections, the header and the footer.
 *
 * Every field carries its default value: the text / image the site shows today, so a page looks exactly the
 * same until someone edits it in the admin panel.
 *
 * Types: text, textarea, rich (text where *words in asterisks* get the italic accent font and a new line
 * starts a new line of the heading), number, toggle, select, link {label, href}, image (a path; with
 * 'responsive' => true it is {desktop, mobile}), video, list (string[]), repeater (rows of sub-fields).
 */
class F
{
    public static function text(string $name, string $label, ?string $default = '', ?string $help = null, bool $half = false): array
    {
        return compact('name', 'label', 'default', 'help', 'half') + ['type' => 'text'];
    }

    public static function textarea(string $name, string $label, ?string $default = '', ?string $help = null): array
    {
        return compact('name', 'label', 'default', 'help') + ['type' => 'textarea'];
    }

    /** Heading text: *asterisks* = accent (italic serif) words, a new line = a new line of the heading. */
    public static function rich(string $name, string $label, ?string $default = '', ?string $help = null): array
    {
        $help ??= 'Wrap words in *asterisks* for the accent style. Press Enter for a new line.';

        return compact('name', 'label', 'default', 'help') + ['type' => 'rich'];
    }

    public static function number(string $name, string $label, int|float|null $default = 0, ?string $help = null, bool $half = true): array
    {
        return compact('name', 'label', 'default', 'help', 'half') + ['type' => 'number'];
    }

    public static function toggle(string $name, string $label, bool $default = true, ?string $help = null): array
    {
        return compact('name', 'label', 'default', 'help') + ['type' => 'toggle', 'half' => true];
    }

    public static function select(string $name, string $label, array $options, ?string $default = null, ?string $help = null, bool $half = true): array
    {
        $default ??= array_key_first($options) ?? '';

        return compact('name', 'label', 'options', 'default', 'help', 'half') + ['type' => 'select'];
    }

    /** A button / link: {label, href}. */
    public static function link(string $name, string $label, string $text = '', string $href = '', ?string $help = null): array
    {
        return ['name' => $name, 'label' => $label, 'type' => 'link', 'default' => ['label' => $text, 'href' => $href], 'help' => $help];
    }

    /**
     * An image. With $responsive the editor offers a separate (optional) image for phones; the site uses it
     * on screens up to 860px wide and the desktop one everywhere else.
     */
    public static function image(string $name, string $label, ?string $default = null, bool $responsive = false, ?string $help = null): array
    {
        return [
            'name' => $name, 'label' => $label, 'type' => 'image', 'responsive' => $responsive, 'help' => $help,
            'default' => $responsive ? ['desktop' => $default, 'mobile' => null] : $default,
        ];
    }

    public static function video(string $name, string $label, ?string $default = null, ?string $help = null): array
    {
        return compact('name', 'label', 'default', 'help') + ['type' => 'video'];
    }

    /** A simple list of lines. */
    public static function list(string $name, string $label, array $default = [], ?string $help = null): array
    {
        return compact('name', 'label', 'default', 'help') + ['type' => 'list'];
    }

    /** Rows of sub-fields (e.g. slides, steps, menu items). $title = the sub-field shown as each row's title. */
    public static function repeater(string $name, string $label, array $fields, array $default = [], ?string $title = null, ?string $help = null): array
    {
        return compact('name', 'label', 'fields', 'default', 'title', 'help') + ['type' => 'repeater'];
    }

    /**
     * A page section ("widget"). $source = where its list items are managed when they come from a collection
     * (e.g. ['label' => 'Projects', 'href' => '/admin/content/projects']).
     */
    public static function section(string $key, string $label, array $fields, ?string $description = null, ?array $source = null, bool $toggle = true): array
    {
        return compact('key', 'label', 'fields', 'description', 'source', 'toggle');
    }
}
