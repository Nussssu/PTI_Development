import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout, { ago, Icon, IconBtn, askDelete } from '../../../Layouts/AdminLayout';

const size = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** The media library: every uploaded image / video, ready to be picked in the page editor. */
export default function MediaIndex({ media, filter, search }) {
    const [q, setQ] = useState(search);
    const [drag, setDrag] = useState(false);
    const [busy, setBusy] = useState(false);
    const [copied, setCopied] = useState(null);
    const go = (params) => router.get('/admin/media', { type: filter, search: q, ...params }, { preserveState: true, replace: true });
    const upload = (files) => {
        if (!files?.length) return;
        setBusy(true);
        router.post('/admin/media', { files: [...files] }, { forceFormData: true, preserveScroll: true, onFinish: () => setBusy(false) });
    };
    const copy = (m) => navigator.clipboard?.writeText(window.location.origin + m.url).then(() => { setCopied(m.id); setTimeout(() => setCopied(null), 1500); });

    return (
        <AdminLayout title="Media library" actions={<label className="a-btn primary"><Icon name="upload" /> Upload<input type="file" multiple hidden accept="image/*,video/mp4,video/webm" onChange={(e) => upload(e.target.files)} /></label>}>
            <div className={`a-drop ${drag ? 'is-drag' : ''}`} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}>
                <Icon name="upload" size={22} />
                <span>{busy ? 'Uploading…' : <>Drop images or videos here, or <label className="a-link">browse<input type="file" multiple hidden accept="image/*,video/mp4,video/webm" onChange={(e) => upload(e.target.files)} /></label></>}</span>
                <small className="a-muted">JPG, PNG, WEBP, GIF, SVG, AVIF, MP4, WEBM · up to 50 MB each. Tip: use WEBP photos about 2000px wide for heroes, and a separate portrait image for phones.</small>
            </div>

            <div className="a-toolbar">
                <div className="a-tabs">
                    {[['all', 'All'], ['image', 'Images'], ['video', 'Videos']].map(([k, l]) => <button key={k} className={filter === k ? 'is-active' : ''} onClick={() => go({ type: k, page: 1 })}>{l}</button>)}
                </div>
                <form className="a-search" onSubmit={(e) => { e.preventDefault(); go({ page: 1 }); }}><input type="search" placeholder="Search by file name" value={q} onChange={(e) => setQ(e.target.value)} /></form>
            </div>

            {media.data.length === 0 ? (
                <div className="a-card"><p className="a-empty">No files yet. Upload images here, or straight from any image field in the page editor.</p></div>
            ) : (
                <div className="a-media-grid">
                    {media.data.map((m) => (
                        <div className="a-media" key={m.id}>
                            <a className="a-media-thumb" href={m.url} target="_blank" rel="noopener">
                                {m.mime?.startsWith('video/') ? <video src={m.url} muted preload="metadata" /> : <img src={m.url} alt={m.alt || ''} loading="lazy" />}
                            </a>
                            <div className="a-media-meta">
                                <b title={m.name}>{m.name}</b>
                                <small className="a-muted">{size(m.size)}{m.width ? ` · ${m.width}×${m.height}` : ''} · {ago(m.created_at)}</small>
                            </div>
                            <div className="a-ibtns">
                                <IconBtn icon={copied === m.id ? 'check' : 'link'} label="Copy link" onClick={() => copy(m)} />
                                <IconBtn icon="edit" label="Description (alt text)" onClick={() => { const alt = prompt('Describe the image (for screen readers and Google):', m.alt || ''); if (alt !== null) router.patch(`/admin/media/${m.id}`, { alt }, { preserveScroll: true }); }} />
                                <IconBtn icon="trash" tone="danger" label="Delete" onClick={() => askDelete({ title: `Delete “${m.name}”?`, text: 'The file is deleted permanently.' }).then((ok) => ok && router.delete(`/admin/media/${m.id}`, { preserveScroll: true }))} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {media.last_page > 1 && (
                <div className="a-pager">
                    {media.links.map((l, k) => <Link key={k} href={l.url || '#'} preserveState className={`${l.active ? 'is-active' : ''} ${!l.url ? 'disabled' : ''}`} dangerouslySetInnerHTML={{ __html: l.label }} />)}
                </div>
            )}
        </AdminLayout>
    );
}
