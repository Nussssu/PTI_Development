<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Audit log: who changed what, when, from where. */
class AuditController extends Controller
{
    public function index(Request $request): Response
    {
        $f = $this->filters($request);

        return Inertia::render('Admin/Audit/Index', [
            'logs' => $this->query($f)->paginate(30)->withQueryString(),
            'filters' => $f,
            'users' => User::orderBy('name')->get(['id', 'name']),
            'actions' => AuditLog::query()->distinct()->orderBy('action')->pluck('action'),
            'subjects' => AuditLog::query()->whereNotNull('subject_type')->distinct()->orderBy('subject_type')->pluck('subject_type'),
            'total' => AuditLog::count(),
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $rows = $this->query($this->filters($request))->limit(20000)->get();
        Audit::log('exported', 'Exported '.$rows->count().' audit log rows to CSV');

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, ['Time', 'User', 'Action', 'Type', 'Item', 'Description', 'Changes', 'IP']);
            foreach ($rows as $r) {
                fputcsv($out, [$r->created_at?->format('Y-m-d H:i:s'), $r->user_name, $r->action, $r->subject_type, $r->subject_label, $r->description, $r->changes ? json_encode($r->changes, JSON_UNESCAPED_UNICODE) : '', $r->ip]);
            }
            fclose($out);
        }, 'audit-log-'.now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv; charset=utf-8']);
    }

    /** Delete entries older than N days (super admins only). */
    public function purge(Request $request): RedirectResponse
    {
        abort_unless($request->user()->canAccess('users'), 403);
        $days = (int) $request->validate(['days' => 'required|integer|in:30,90,180,365'])['days'];
        $n = AuditLog::where('created_at', '<', now()->subDays($days))->delete();
        Audit::log('purged', "Cleared {$n} audit log entries older than {$days} days");

        return back()->with('success', "Removed {$n} entries older than {$days} days.");
    }

    private function filters(Request $request): array
    {
        return [
            'search' => trim((string) $request->query('search', '')),
            'user' => $request->query('user', ''),
            'action' => $request->query('action', ''),
            'subject' => $request->query('subject', ''),
            'from' => $request->query('from', ''),
            'to' => $request->query('to', ''),
        ];
    }

    private function query(array $f)
    {
        $q = AuditLog::query()->latest('created_at')->latest('id');
        if ($f['search'] !== '') {
            $like = '%'.$f['search'].'%';
            $q->where(fn ($w) => $w->where('description', 'like', $like)->orWhere('subject_label', 'like', $like)->orWhere('user_name', 'like', $like)->orWhere('ip', 'like', $like));
        }
        if ($f['user'] !== '' && $f['user'] !== null) {
            $q->where('user_id', (int) $f['user']);
        }
        if ($f['action']) {
            $q->where('action', $f['action']);
        }
        if ($f['subject']) {
            $q->where('subject_type', $f['subject']);
        }
        if ($f['from'] && strtotime($f['from'])) {
            $q->where('created_at', '>=', date('Y-m-d 00:00:00', strtotime($f['from'])));
        }
        if ($f['to'] && strtotime($f['to'])) {
            $q->where('created_at', '<=', date('Y-m-d 23:59:59', strtotime($f['to'])));
        }

        return $q;
    }
}
