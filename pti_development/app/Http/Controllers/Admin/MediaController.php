<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MediaFile;
use App\Models\Page;
use App\Models\PageSection;
use App\Models\SiteBlock;
use App\Support\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** The media library: images and videos uploaded once and picked anywhere in the editor. */
class MediaController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Admin/Media/Index', [
            'media' => $this->query($request)->paginate(36)->withQueryString(),
            'filter' => $request->query('type', 'all'),
            'search' => (string) $request->query('search', ''),
        ]);
    }

    /** JSON for the picker in the editor. */
    public function list(Request $request): JsonResponse
    {
        return response()->json($this->query($request)->paginate(30));
    }

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $request->validate([
            'files' => 'required|array|max:20',
            'files.*' => 'file|max:51200|mimes:jpg,jpeg,png,webp,gif,svg,avif,mp4,webm',
        ], ['files.*.max' => 'Each file must be 50 MB or smaller.', 'files.*.mimes' => 'Images (JPG, PNG, WEBP, GIF, SVG, AVIF) or videos (MP4, WEBM) only.']);

        $saved = [];
        foreach ($request->file('files') as $file) {
            $mime = $file->getMimeType();
            $size = $file->getSize();
            $dims = str_starts_with((string) $mime, 'image/') && $mime !== 'image/svg+xml' ? @getimagesize($file->getRealPath()) : null;
            $path = Media::store($file, str_starts_with((string) $mime, 'video/') ? 'videos' : 'images');
            $saved[] = MediaFile::create([
                'path' => $path, 'name' => mb_substr($file->getClientOriginalName(), 0, 250), 'mime' => $mime, 'size' => $size,
                'width' => $dims[0] ?? null, 'height' => $dims[1] ?? null,
            ]);
        }

        if ($request->expectsJson() && ! $request->header('X-Inertia')) {
            return response()->json(['files' => $saved]);
        }

        return back()->with('success', count($saved).' file'.(count($saved) > 1 ? 's' : '').' uploaded.');
    }

    public function update(Request $request, MediaFile $media): RedirectResponse
    {
        $media->update($request->validate(['alt' => 'nullable|string|max:255', 'name' => 'nullable|string|max:250']));

        return back()->with('success', 'Saved.');
    }

    public function destroy(MediaFile $media): RedirectResponse
    {
        // never pull a file out from under a page: find where it is still used first
        $needle = '%'.str_replace(['%', '_'], ['\%', '\_'], $media->path).'%';
        $used = PageSection::where('content', 'like', $needle)->with('page:id,title')->get()->pluck('page.title')
            ->merge(Page::where('seo', 'like', $needle)->pluck('title'))
            ->merge(SiteBlock::where('content', 'like', $needle)->pluck('key')->map(fn ($k) => ucfirst($k)))
            ->filter()->unique()->values();
        if ($used->isNotEmpty()) {
            return back()->with('error', 'This file is still used on: '.$used->implode(', ').'. Replace it there first.');
        }
        Media::delete($media->path);
        $media->delete();

        return back()->with('success', 'File deleted.');
    }

    private function query(Request $request)
    {
        $q = MediaFile::query()->latest();
        $type = $request->query('type');
        if ($type === 'image' || $type === 'video') {
            $q->where('mime', 'like', $type.'/%');
        }
        if ($s = trim((string) $request->query('search', ''))) {
            $q->where('name', 'like', '%'.$s.'%');
        }

        return $q;
    }
}
