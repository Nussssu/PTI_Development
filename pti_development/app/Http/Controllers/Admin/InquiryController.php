<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\InquiryReplyMail;
use App\Models\EmailTemplate;
use App\Models\EmailLog;
use App\Models\Inquiry;
use App\Models\Project;
use App\Support\Audit;
use App\Support\MailSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Leads: contact-form messages and site-visit requests. View, reply by email, edit, delete, CSV import / export. */
class InquiryController extends Controller
{
    public const STATUSES = ['new' => 'New', 'in_progress' => 'In progress', 'replied' => 'Replied', 'archived' => 'Archived'];

    public const TYPES = ['contact' => 'Contact form', 'site_visit' => 'Site visit'];

    public function index(Request $request): Response
    {
        $f = $this->filters($request);

        // counts per status follow the other filters (type, dates, search), like the tabs in the reference
        $counts = $this->query(['status' => ''] + $f)->reorder()->selectRaw('status, count(*) as n')->groupBy('status')->pluck('n', 'status');

        return Inertia::render('Admin/Inquiries/Index', [
            'inquiries' => $this->query($f)->with('project:id,name,slug')->withCount('replies')->paginate(25)->withQueryString(),
            'filters' => $f,
            'counts' => ['all' => $counts->sum()] + collect(self::STATUSES)->map(fn ($l, $k) => (int) ($counts[$k] ?? 0))->all(),
            'unread' => Inquiry::whereNull('read_at')->count(),
            'statuses' => self::STATUSES,
            'types' => self::TYPES,
        ]);
    }

    /** CSV of the leads matching the current filters (opens in Excel / Google Sheets). */
    public function export(Request $request): StreamedResponse
    {
        $rows = $this->query($this->filters($request))->with('project:id,name')->get();
        Audit::log('exported', 'Exported '.$rows->count().' leads to CSV');

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF"); // UTF-8 BOM so Excel shows Bangla / accents correctly
            fputcsv($out, self::CSV_COLUMNS);
            foreach ($rows as $i) {
                fputcsv($out, [$i->id, $i->first_name, $i->last_name, $i->email, $i->phone, self::TYPES[$i->source] ?? $i->source, $i->project?->name,
                    $i->message, self::STATUSES[$i->status] ?? $i->status, $i->notes, $i->created_at?->format('Y-m-d H:i'), $i->replied_at?->format('Y-m-d H:i')]);
            }
            fclose($out);
        }, 'leads-'.now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv; charset=utf-8']);
    }

    public const CSV_COLUMNS = ['ID', 'First name', 'Last name', 'Email', 'Phone', 'Type', 'Project', 'Message', 'Status', 'Notes', 'Received', 'Replied'];

    /**
     * Import leads from a CSV (e.g. from Facebook lead ads, a fair, an old spreadsheet).
     * Needs a header row; recognised columns: first name / name, last name, email, phone, type, project, message, status, notes, received.
     * Rows whose phone + received time already exist are skipped.
     */
    public function import(Request $request): RedirectResponse
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt|max:5120']);
        $fh = fopen($request->file('file')->getRealPath(), 'r');
        $header = fgetcsv($fh);
        if (! $header) {
            return back()->with('error', 'The file is empty.');
        }
        $header = array_map(fn ($h) => strtolower(trim(preg_replace('/^\xEF\xBB\xBF/', '', (string) $h))), $header);
        $col = function (array $names) use ($header) {
            foreach ($names as $n) {
                if (($i = array_search($n, $header, true)) !== false) {
                    return $i;
                }
            }

            return null;
        };
        $map = [
            'first_name' => $col(['first name', 'first_name', 'firstname', 'name', 'full name', 'full_name']),
            'last_name' => $col(['last name', 'last_name', 'lastname', 'surname']),
            'email' => $col(['email', 'e-mail', 'email address']),
            'phone' => $col(['phone', 'phone number', 'mobile', 'phone_number', 'contact']),
            'source' => $col(['type', 'source']),
            'project' => $col(['project', 'project name']),
            'message' => $col(['message', 'comments', 'note to us', 'details']),
            'status' => $col(['status']),
            'notes' => $col(['notes', 'internal note']),
            'created_at' => $col(['received', 'date', 'created_at', 'created', 'submitted']),
        ];
        if ($map['first_name'] === null || $map['phone'] === null) {
            fclose($fh);

            return back()->with('error', 'The CSV needs at least a "Name" (or "First name") and a "Phone" column.');
        }

        $projects = Project::pluck('id', 'name')->mapWithKeys(fn ($id, $n) => [mb_strtolower($n) => $id]);
        $statusByLabel = collect(self::STATUSES)->mapWithKeys(fn ($l, $k) => [mb_strtolower($l) => $k, $k => $k]);
        $added = $skipped = 0;

        DB::transaction(function () use ($fh, $map, $projects, $statusByLabel, &$added, &$skipped) {
            while (($row = fgetcsv($fh)) !== false) {
                $get = fn ($k) => $map[$k] === null ? null : trim((string) ($row[$map[$k]] ?? ''));
                $first = $get('first_name');
                $phone = $get('phone');
                if (! $first || ! $phone || mb_strlen($phone) > 30) {
                    $skipped++;

                    continue;
                }
                $last = $get('last_name');
                if ($map['last_name'] === null && str_contains($first, ' ')) {
                    [$first, $last] = explode(' ', $first, 2);
                }
                $created = $get('created_at') && strtotime($get('created_at')) ? date('Y-m-d H:i:s', strtotime($get('created_at'))) : now();
                if (Inquiry::where('phone', $phone)->where('created_at', $created)->exists()) {
                    $skipped++;

                    continue;
                }
                $email = $get('email');
                $type = mb_strtolower((string) $get('source'));
                $i = new Inquiry([
                    'first_name' => mb_substr($first, 0, 80), 'last_name' => $last ? mb_substr($last, 0, 80) : null,
                    'email' => filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : null,
                    'phone' => $phone,
                    'source' => str_contains($type, 'visit') ? 'site_visit' : 'contact',
                    'project_id' => $projects[mb_strtolower((string) $get('project'))] ?? null,
                    'message' => $get('message') ? mb_substr($get('message'), 0, 3000) : null,
                    'status' => $statusByLabel[mb_strtolower((string) $get('status'))] ?? 'new',
                    'notes' => $get('notes') ?: 'Imported from CSV',
                ]);
                $i->created_at = $created;
                $i->read_at = now();
                $i->saveQuietly();
                $added++;
            }
        });
        fclose($fh);
        Audit::log('imported', "Imported {$added} leads from CSV".($skipped ? " ({$skipped} rows skipped)" : ''));

        return back()->with($added ? 'success' : 'error', "Imported {$added} lead".($added === 1 ? '' : 's').($skipped ? ", skipped {$skipped} (missing name / phone or already imported)" : '').'.');
    }

    /** Act on several leads at once: mark read / unread, set a status, delete. */
    public function bulk(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'ids' => 'required|array|max:500',
            'ids.*' => 'integer',
            'action' => 'required|in:read,unread,delete,'.implode(',', array_keys(self::STATUSES)),
        ]);
        $q = Inquiry::whereIn('id', $data['ids']);
        $n = (clone $q)->count();

        match ($data['action']) {
            'read' => $q->update(['read_at' => now()]),
            'unread' => $q->update(['read_at' => null]),
            'delete' => $q->get()->each->delete(),
            default => $q->update(['status' => $data['action']]),
        };
        if (! in_array($data['action'], ['read', 'unread', 'delete'], true)) {
            Audit::log('bulk_status', "Set {$n} leads to \"".self::STATUSES[$data['action']].'"');
        }

        $label = ['read' => 'marked as read', 'unread' => 'marked as unread', 'delete' => 'deleted'][$data['action']] ?? 'set to '.self::STATUSES[$data['action']];

        return back()->with('success', "{$n} lead".($n === 1 ? '' : 's')." {$label}.");
    }

    private function filters(Request $request): array
    {
        $status = $request->query('status', '');

        return [
            'status' => array_key_exists($status, self::STATUSES) || $status === 'unread' ? $status : '',
            'type' => array_key_exists($request->query('type', ''), self::TYPES) ? $request->query('type') : '',
            'search' => trim((string) $request->query('search', '')),
            'from' => (string) $request->query('from', ''),
            'to' => (string) $request->query('to', ''),
        ];
    }

    private function query(array $f)
    {
        $q = Inquiry::query()->latest()->latest('id');
        if ($f['status'] === 'unread') {
            $q->whereNull('read_at');
        } elseif ($f['status']) {
            $q->where('status', $f['status']);
        }
        if ($f['type']) {
            $q->where('source', $f['type']);
        }
        if ($f['search'] !== '') {
            $like = '%'.$f['search'].'%';
            $q->where(fn ($w) => $w->where('first_name', 'like', $like)->orWhere('last_name', 'like', $like)
                ->orWhere('email', 'like', $like)->orWhere('phone', 'like', $like)->orWhere('message', 'like', $like)
                ->orWhereRaw("CONCAT(first_name, ' ', COALESCE(last_name, '')) like ?", [$like])
                ->orWhereHas('project', fn ($p) => $p->where('name', 'like', $like)));
        }
        if ($f['from'] && strtotime($f['from'])) {
            $q->where('created_at', '>=', date('Y-m-d 00:00:00', strtotime($f['from'])));
        }
        if ($f['to'] && strtotime($f['to'])) {
            $q->where('created_at', '<=', date('Y-m-d 23:59:59', strtotime($f['to'])));
        }

        return $q;
    }

    public function show(Request $request, Inquiry $inquiry): Response|\Illuminate\Http\JsonResponse
    {
        // ?refresh=1: the pop-up reloading after a change (e.g. "Mark as unread") does not count as reading it
        if (! $inquiry->read_at && ! $request->boolean('refresh')) {
            $inquiry->update(['read_at' => now()]);
        }

        $props = [
            'inquiry' => $inquiry->load(['project:id,name,slug', 'replies.user:id,name']),
            'statuses' => self::STATUSES,
            // starting text of the reply box (Email templates → Reply from the inbox)
            'replyTemplate' => EmailTemplate::for('reply')->fill_in(EmailTemplate::varsFor($inquiry, $request->user())),
            'mailLive' => MailSettings::isLive(),
        ];

        // the pop-up in the leads list asks for the same data as JSON
        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json($props);
        }

        return Inertia::render('Admin/Inquiries/Show', $props);
    }

    public function edit(Request $request, Inquiry $inquiry): Response|\Illuminate\Http\JsonResponse
    {
        $props = [
            'inquiry' => $inquiry->load('project:id,name'),
            'statuses' => self::STATUSES,
            'projects' => Project::orderBy('name')->get(['id', 'name']),
        ];

        return $request->wantsJson() && ! $request->header('X-Inertia')
            ? response()->json($props)
            : Inertia::render('Admin/Inquiries/Edit', $props);
    }

    public function update(Request $request, Inquiry $inquiry): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        $inquiry->update($request->validate([
            'first_name' => 'required|string|max:80',
            'last_name' => 'nullable|string|max:80',
            'email' => 'nullable|email|max:160',
            'phone' => ['required', 'string', 'max:30'],
            'message' => 'nullable|string|max:3000',
            'source' => 'required|in:contact,site_visit',
            'project_id' => 'nullable|exists:projects,id',
            'status' => 'required|in:'.implode(',', array_keys(self::STATUSES)),
            'notes' => 'nullable|string|max:5000',
        ]));

        return $request->wantsJson() && ! $request->header('X-Inertia')
            ? response()->json(['success' => true])
            : redirect()->route('admin.inquiries.show', $inquiry)->with('success', 'Message updated.');
    }

    /** Send an email reply and keep it in the message's history. */
    public function reply(Request $request, Inquiry $inquiry): RedirectResponse
    {
        if (! $inquiry->email) {
            return back()->with('error', 'This message has no email address. Call or WhatsApp instead.');
        }
        $data = $request->validate(['subject' => 'required|string|max:200', 'body' => 'required|string|max:10000']);

        $error = null;
        try {
            Mail::to($inquiry->email, $inquiry->full_name)->send(new InquiryReplyMail($inquiry, $data['subject'], $data['body']));
        } catch (\Throwable $e) {
            $error = mb_substr($e->getMessage(), 0, 250);
            Log::warning('Inquiry reply failed: '.$e->getMessage());
        }
        EmailLog::record($error ? 'failed' : (MailSettings::isLive() ? 'sent' : 'skipped'), 'Inbox reply', $inquiry->email, $data['subject'], $error ?: (MailSettings::isLive() ? 'Email reply sent.' : 'SMTP is not connected; message was not delivered.'), $request->user()->name);

        $inquiry->replies()->create([
            'user_id' => $request->user()->id, 'to' => $inquiry->email, 'subject' => $data['subject'], 'body' => $data['body'],
            'sent' => $error === null, 'error' => $error,
        ]);
        if ($error === null) {
            $inquiry->update(['replied_at' => now(), 'status' => $inquiry->status === 'archived' ? 'archived' : 'replied']);
            Audit::log('mail_reply', 'Replied by email to '.$inquiry->full_name.' <'.$inquiry->email.'>: "'.$data['subject'].'"', $inquiry);
        } else {
            Audit::log('mail_reply_failed', 'Reply to '.$inquiry->email.' failed: '.$error, $inquiry);
        }

        return back()->with($error ? 'error' : 'success', $error
            ? 'The email could not be sent: '.$error.(MailSettings::isLive() ? '' : ' (Set up Email & SMTP first.)')
            : (MailSettings::isLive() ? 'Reply sent to '.$inquiry->email.'.' : 'Reply saved, but email is not set up yet (Email & SMTP), so it was not delivered.'));
    }

    public function toggle(Inquiry $inquiry): RedirectResponse
    {
        $inquiry->update(['read_at' => $inquiry->read_at ? null : now()]);

        return back();
    }

    public function destroy(Inquiry $inquiry): RedirectResponse
    {
        $inquiry->delete();

        return redirect()->route('admin.inquiries.index')->with('success', 'Message deleted.');
    }
}
