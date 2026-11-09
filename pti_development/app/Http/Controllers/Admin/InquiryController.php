<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Inquiry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InquiryController extends Controller
{
    public function index(Request $request): Response
    {
        $filter = $request->query('filter', 'all');
        $search = trim((string) $request->query('search', ''));

        $q = Inquiry::with('project:id,name,slug')->latest();
        if ($filter === 'unread') {
            $q->whereNull('read_at');
        } elseif (in_array($filter, ['contact', 'site_visit'], true)) {
            $q->where('source', $filter);
        }
        if ($search !== '') {
            $like = '%'.$search.'%';
            $q->where(fn ($w) => $w->where('first_name', 'like', $like)->orWhere('last_name', 'like', $like)
                ->orWhere('email', 'like', $like)->orWhere('phone', 'like', $like));
        }

        return Inertia::render('Admin/Inquiries/Index', [
            'inquiries' => $q->paginate(20)->withQueryString(),
            'filter' => $filter,
            'search' => $search,
        ]);
    }

    public function show(Inquiry $inquiry): Response
    {
        if (! $inquiry->read_at) {
            $inquiry->update(['read_at' => now()]);
        }

        return Inertia::render('Admin/Inquiries/Show', ['inquiry' => $inquiry->load('project:id,name,slug')]);
    }

    public function toggle(Inquiry $inquiry): RedirectResponse
    {
        $inquiry->update(['read_at' => $inquiry->read_at ? null : now()]);

        return back();
    }

    public function destroy(Inquiry $inquiry): RedirectResponse
    {
        $inquiry->delete();

        return redirect()->route('admin.inquiries.index')->with('success', 'Inquiry deleted.');
    }
}
