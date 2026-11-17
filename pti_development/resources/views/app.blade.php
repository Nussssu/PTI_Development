@php
    // SEO from the CMS (Pages → SEO tab); rendered here so search engines and link previews get it without JavaScript.
    $seo = $page['props']['cms']['seo'] ?? null;
    $seoTitle = $seo['title'] ?? null;
    $seoDescription = ($seo['description'] ?? '') ?: 'PTI Development Ltd. builds homes and commercial spaces you can trust in Dhaka: property development, land share purchase and full legal support.';
    $seoImage = ! empty($seo['image']) ? url($seo['image']) : null;
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    @if ($seoTitle)
    <title inertia>{{ $seoTitle }} — PTI Development</title>
    <meta property="og:title" content="{{ $seoTitle }}" inertia="og:title">
    @endif
    <meta name="description" content="{{ $seoDescription }}" inertia="description">
    <meta property="og:description" content="{{ $seoDescription }}" inertia="og:description">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="PTI Development">
    @if (! empty($seo['keywords']))
    <meta name="keywords" content="{{ $seo['keywords'] }}" inertia="keywords">
    @endif
    @if ($seoImage)
    <meta property="og:image" content="{{ $seoImage }}" inertia="og:image">
    <meta name="twitter:card" content="summary_large_image">
    @endif
    @if (! empty($seo['canonical']))
    <link rel="canonical" href="{{ $seo['canonical'] }}" inertia="canonical">
    @endif
    @if (! empty($seo['noindex']))
    <meta name="robots" content="noindex, nofollow" inertia="robots">
    @endif
    <meta name="theme-color" content="#06182C">
    @php($ptiBrand = \App\Models\Setting::brand())
    <link rel="icon" href="{{ $ptiBrand['logo_favicon'] }}">
    {{-- brand logos from Settings (the loading screen reads its logo from here) --}}
    <script>window.__ptiBrand = @json(['preloader' => $ptiBrand['logo_preloader']]);</script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Sora:wght@100..800&display=swap" rel="stylesheet">
    @viteReactRefresh
    @vite('resources/js/app.jsx')
    @inertiaHead
</head>
<body>
    @inertia
</body>
</html>
