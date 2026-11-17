{{-- Branded wrapper for every email (Admin → Email templates). The body is plain text: escaped, line breaks kept, links clickable. --}}
@php
    $html = preg_replace('~(https?://[^\s<]+)~', '<a href="$1" style="color:#B9822F">$1</a>', e($body));
@endphp
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{{ $previewSubject ?? $site['company'] }}</title></head>
<body style="margin:0;padding:0;background:#F4F1EA">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EA;padding:32px 12px">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#0B2644">
      <tr><td align="center" style="background:#06182C;padding:18px 28px">
        <img src="{{ isset($message) ? $message->embed(\App\Models\Setting::emailLogoFile()) : asset(ltrim(\App\Models\Setting::brand()['logo_email'], '/')) }}" alt="PTI Development" width="190" height="102" style="display:block;width:190px;max-width:100%;height:auto;border:0;margin:0 auto">
        @if(!empty($site['tagline']))<br><span style="font-size:12px;color:#D9A55B;letter-spacing:.08em">{{ $site['tagline'] }}</span>@endif
      </td></tr>
      <tr><td style="padding:32px;font-size:15px;line-height:1.65;white-space:pre-line">{!! $html !!}</td></tr>
      <tr><td style="padding:20px 32px;border-top:1px solid #E3E7EC;font-size:12.5px;line-height:1.6;color:#6B7A8C">
        {{ $site['company'] }} · {{ $site['phone'] }} · {{ $site['email'] }}<br>{{ $site['address'] }}
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
