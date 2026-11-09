<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="PTI Development Ltd. builds homes and commercial spaces you can trust in Dhaka: property development, land share purchase and full legal support.">
    <meta name="theme-color" content="#06182C">
    <link rel="icon" href="/images/pti-logo-vertical.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Poppins:wght@300;400;500;600;700&family=Libre+Caslon+Condensed:ital,wght@0,400..700;1,400..700&family=Mrs+Saint+Delafield&family=Archivo:wdth,wght@62..125,300..700&display=swap" rel="stylesheet">
    @viteReactRefresh
    @vite('resources/js/app.jsx')
    @inertiaHead
</head>
<body>
    @inertia
</body>
</html>
