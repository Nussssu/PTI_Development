<div style="font-family:Arial,sans-serif;color:#0B2644;max-width:560px">
  <h2 style="margin:0 0 16px">{{ $inquiry->source === 'site_visit' ? 'New site visit request' : 'New website enquiry' }}</h2>
  <table cellpadding="6" style="border-collapse:collapse">
    <tr><td><b>Name</b></td><td>{{ $inquiry->full_name }}</td></tr>
    <tr><td><b>Phone</b></td><td>{{ $inquiry->phone }}</td></tr>
    @if($inquiry->email)<tr><td><b>Email</b></td><td>{{ $inquiry->email }}</td></tr>@endif
    @if($inquiry->project)<tr><td><b>Project</b></td><td>{{ $inquiry->project->name }}</td></tr>@endif
  </table>
  @if($inquiry->message)<p style="white-space:pre-line;margin-top:16px">{{ $inquiry->message }}</p>@endif
</div>
