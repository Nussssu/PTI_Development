/* Field editors for the CMS (page sections, SEO, header & footer). One component per field type of App\Cms\F:
   text, textarea, rich, number, toggle, select, link, image (desktop + optional mobile), video, list, repeater.
   Images / videos are uploaded to the media library (or picked from it); the field stores the file's path. */
import axios from 'axios';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Icon } from '../../Layouts/AdminLayout';

export const mediaUrl = (p) => (!p ? null : /^https?:\/\//.test(p) || p.startsWith('/') ? p : `/storage/${p}`);
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const fileName = (p) => (p ? decodeURIComponent(String(p).split('/').pop()) : '');
const isVideo = (p) => /\.(mp4|webm)(\?|$)/i.test(p || '');

/* ---------------------------------------------------------------- uploads + library picker */

export async function uploadFiles(files) {
    const fd = new FormData();
    [...files].forEach((f) => fd.append('files[]', f));
    const { data } = await axios.post('/admin/media', fd, { headers: { Accept: 'application/json' } });
    return data.files;
}

const errorText = (e) => e?.response?.data?.message || Object.values(e?.response?.data?.errors || {})[0]?.[0] || 'Upload failed.';

export function MediaPicker({ open, type = 'image', onClose, onPick }) {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [last, setLast] = useState(1);
    const [search, setSearch] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    const load = (p = 1, q = search) => {
        setBusy(true);
        axios.get('/admin/media/list', { params: { type, page: p, search: q } })
            .then(({ data }) => { setItems(p === 1 ? data.data : (prev) => [...prev, ...data.data]); setPage(data.current_page); setLast(data.last_page); })
            .finally(() => setBusy(false));
    };
    useEffect(() => { if (open) { setErr(''); load(1, ''); setSearch(''); } }, [open, type]);
    useEffect(() => {
        if (!open) return undefined;
        const esc = (e) => e.key === 'Escape' && onClose();
        addEventListener('keydown', esc);
        return () => removeEventListener('keydown', esc);
    }, [open]);
    if (!open) return null;

    const upload = async (files) => {
        if (!files.length) return;
        setBusy(true); setErr('');
        try { const saved = await uploadFiles(files); onPick(saved[0]); onClose(); } catch (e) { setErr(errorText(e)); setBusy(false); }
    };

    return (
        <div className="a-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="a-modal-box wide" role="dialog" aria-label="Media library">
                <div className="a-modal-head">
                    <h2>Choose {type === 'video' ? 'a video' : 'an image'}</h2>
                    <button type="button" className="a-icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
                </div>
                <div className="a-modal-tools">
                    <form onSubmit={(e) => { e.preventDefault(); load(1); }} className="a-search"><input type="search" placeholder="Search by file name" value={search} onChange={(e) => setSearch(e.target.value)} /></form>
                    <label className="a-btn primary"><Icon name="upload" /> Upload new
                        <input type="file" hidden accept={type === 'video' ? 'video/mp4,video/webm' : 'image/*'} onChange={(e) => upload(e.target.files)} />
                    </label>
                </div>
                {err && <p className="a-error" style={{ margin: '0 0 12px' }}>{err}</p>}
                <div className="a-picker-grid">
                    {items.map((m) => (
                        <button type="button" key={m.id} className="a-picker-item" onClick={() => { onPick(m); onClose(); }} title={m.name}>
                            {m.mime?.startsWith('video/') ? <video src={m.url} muted preload="metadata" /> : <img src={m.url} alt="" loading="lazy" />}
                            <span>{m.name}</span>
                        </button>
                    ))}
                    {!busy && items.length === 0 && <p className="a-empty" style={{ gridColumn: '1 / -1' }}>Nothing here yet. Upload {type === 'video' ? 'a video' : 'an image'} to start your library.</p>}
                </div>
                {page < last && <div style={{ textAlign: 'center', marginTop: 14 }}><button type="button" className="a-btn" disabled={busy} onClick={() => load(page + 1)}>Load more</button></div>}
                {busy && <p className="a-muted" style={{ textAlign: 'center' }}>Loading…</p>}
            </div>
        </div>
    );
}

/** One image / video slot: preview, upload, pick from library, remove, back to the default. */
function MediaSlot({ value, def, onChange, type = 'image', label, optional }) {
    const [picker, setPicker] = useState(false);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const url = mediaUrl(value);
    const upload = async (files) => {
        if (!files.length) return;
        setBusy(true); setErr('');
        try { const [m] = await uploadFiles(files); onChange(m.path); } catch (e) { setErr(errorText(e)); }
        setBusy(false);
    };
    return (
        <div className="a-slot">
            {label && <div className="a-slot-label">{label}</div>}
            <div className={`a-slot-preview ${url ? '' : 'empty'}`}>
                {url ? (type === 'video' || isVideo(value) ? <video src={url} muted loop autoPlay playsInline /> : <img src={url} alt="" />)
                    : <span>{optional ? 'Same as desktop' : 'No file'}</span>}
                {busy && <div className="a-slot-busy">Uploading…</div>}
            </div>
            <div className="a-slot-name" title={value || ''}>{value ? fileName(value) : ' '}</div>
            <div className="a-slot-actions">
                <label className="a-btn sm"><Icon name="upload" size={15} /> Upload
                    <input type="file" hidden accept={type === 'video' ? 'video/mp4,video/webm' : 'image/*'} onChange={(e) => upload(e.target.files)} />
                </label>
                <button type="button" className="a-btn sm ghost" onClick={() => setPicker(true)}>Library</button>
                {value && <button type="button" className="a-btn sm ghost danger" onClick={() => onChange(null)} title="Remove">Remove</button>}
                {def && !same(value, def) && <button type="button" className="a-btn sm ghost" onClick={() => onChange(def)} title="Back to the original file">Default</button>}
            </div>
            {err && <small className="a-error">{err}</small>}
            <MediaPicker open={picker} type={type} onClose={() => setPicker(false)} onPick={(m) => onChange(m.path)} />
        </div>
    );
}

function ImageInput({ field, value, def, onChange }) {
    if (!field.responsive) return <MediaSlot value={value} def={def} onChange={onChange} />;
    const v = value || {};
    const d = def || {};
    return (
        <div className="a-slots">
            <MediaSlot label={<><Icon name="monitor" size={15} /> Desktop</>} value={v.desktop} def={d.desktop} onChange={(x) => onChange({ ...v, desktop: x })} />
            <MediaSlot label={<><Icon name="mobile" size={15} /> Mobile <em>optional</em></>} optional value={v.mobile} def={d.mobile} onChange={(x) => onChange({ ...v, mobile: x })} />
        </div>
    );
}

/* ---------------------------------------------------------------- simple inputs */

function RichPreview({ text }) {
    if (!text || !/\*|\n/.test(text)) return null;
    return (
        <div className="a-rich-preview" aria-hidden="true">
            {String(text).split(/\r?\n/).map((line, i) => (
                <div key={i}>{line.split(/(\*[^*]+\*)/g).map((p, k) => (/^\*[^*]+\*$/.test(p) ? <em key={k}>{p.slice(1, -1)}</em> : <Fragment key={k}>{p}</Fragment>))}</div>
            ))}
        </div>
    );
}

function ListInput({ value, onChange }) {
    const list = value?.length ? value : [''];
    const set = (v) => onChange(v);
    return (
        <div className="a-list">
            {list.map((v, i) => (
                <div className="a-list-row" key={i}>
                    <input value={v} onChange={(e) => set(list.map((x, k) => (k === i ? e.target.value : x)))} placeholder={`Line ${i + 1}`} />
                    <button type="button" className="a-icon-btn" aria-label="Remove" onClick={() => set(list.length > 1 ? list.filter((_, k) => k !== i) : [''])}><Icon name="x" size={15} /></button>
                </div>
            ))}
            <button type="button" className="a-btn ghost sm" onClick={() => set([...list, ''])}><Icon name="plus" size={15} /> Add line</button>
        </div>
    );
}

function RepeaterInput({ field, value, onChange }) {
    const rows = value || [];
    const [open, setOpen] = useState(() => (rows.length <= 4 ? rows.map((_, i) => i) : []));
    const blank = () => Object.fromEntries(field.fields.map((f) => [f.name, f.type === 'link' ? { label: '', href: '' } : f.type === 'toggle' ? true : f.type === 'list' ? [] : f.type === 'select' ? f.default : null]));
    const set = (next) => onChange(next);
    const move = (i, d) => { const j = i + d; if (j < 0 || j >= rows.length) return; const n = [...rows]; [n[i], n[j]] = [n[j], n[i]]; set(n); };
    const toggle = (i) => setOpen((o) => (o.includes(i) ? o.filter((x) => x !== i) : [...o, i]));
    const titleOf = (r, i) => {
        const t = field.title ? r?.[field.title] : null;
        const shown = field.fields.find((f) => f.name === field.title)?.type === 'select' ? field.fields.find((f) => f.name === field.title).options[t] : t;
        return (typeof shown === 'string' && shown.replace(/\*/g, '').trim()) || `Item ${i + 1}`;
    };
    return (
        <div className="a-rep">
            {rows.map((r, i) => (
                <div className={`a-rep-row ${open.includes(i) ? 'is-open' : ''}`} key={i}>
                    <div className="a-rep-head" onClick={() => toggle(i)}>
                        <span className="a-rep-n">{String(i + 1).padStart(2, '0')}</span>
                        <b>{titleOf(r, i)}</b>
                        <span className="a-rep-tools" onClick={(e) => e.stopPropagation()}>
                            <button type="button" className="a-icon-btn" disabled={i === 0} onClick={() => move(i, -1)} title="Move up"><Icon name="up" size={15} /></button>
                            <button type="button" className="a-icon-btn" disabled={i === rows.length - 1} onClick={() => move(i, 1)} title="Move down"><Icon name="down" size={15} /></button>
                            <button type="button" className="a-icon-btn danger" onClick={() => set(rows.filter((_, k) => k !== i))} title="Remove"><Icon name="trash" size={15} /></button>
                        </span>
                        <Icon name="chevron" size={16} />
                    </div>
                    {open.includes(i) && (
                        <div className="a-rep-body">
                            <FieldList fields={field.fields} values={r || {}} onChange={(k, v) => set(rows.map((x, j) => (j === i ? { ...x, [k]: v } : x)))} />
                        </div>
                    )}
                </div>
            ))}
            <button type="button" className="a-btn ghost sm" onClick={() => { set([...rows, blank()]); setOpen((o) => [...o, rows.length]); }}><Icon name="plus" size={15} /> Add {field.label?.replace(/s$/, '').toLowerCase() || 'item'}</button>
        </div>
    );
}

function Input({ field, value, def, onChange }) {
    switch (field.type) {
        case 'textarea': return <textarea rows={4} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
        case 'rich': return (
            <>
                <textarea rows={Math.min(5, Math.max(2, String(value ?? '').split('\n').length + 1))} className="a-rich" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
                <RichPreview text={value} />
            </>
        );
        case 'number': return <input type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />;
        case 'toggle': return <button type="button" role="switch" aria-checked={!!value} className={`a-switch ${value ? 'on' : ''}`} onClick={() => onChange(!value)}><i /></button>;
        case 'select': return <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>{Object.entries(field.options || {}).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>;
        case 'link': return (
            <div className="a-link-row">
                <input placeholder="Button text" value={value?.label ?? ''} onChange={(e) => onChange({ ...(value || {}), label: e.target.value })} />
                <input placeholder="Link, e.g. /contact" value={value?.href ?? ''} onChange={(e) => onChange({ ...(value || {}), href: e.target.value })} />
            </div>
        );
        case 'image': return <ImageInput field={field} value={value} def={def} onChange={onChange} />;
        case 'video': return <MediaSlot type="video" value={value} def={def} onChange={onChange} />;
        case 'list': return <ListInput value={value} onChange={onChange} />;
        case 'repeater': return <RepeaterInput field={field} value={value} onChange={onChange} />;
        default: return <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    }
}

export function FieldRow({ field, value, def, onChange }) {
    const changed = def !== undefined && !same(value, def) && !['image', 'video'].includes(field.type);
    const wide = ['repeater', 'image', 'list', 'rich', 'textarea'].includes(field.type) || (field.type === 'image' && field.responsive);
    return (
        <div className={`a-field ${field.half && !wide ? 'half' : ''} ${field.type === 'toggle' ? 'inline' : ''}`}>
            <span className="a-field-label">
                {field.label}
                {changed && <button type="button" className="a-field-reset" onClick={() => onChange(def)} title="Back to the original">↺ default</button>}
            </span>
            <Input field={field} value={value} def={def} onChange={onChange} />
            {field.help && <small className="a-muted">{field.help}</small>}
        </div>
    );
}

/** A grid of fields. `defaults` (optional) enables the per-field "↺ default" buttons. */
export function FieldList({ fields, values, defaults, onChange }) {
    return (
        <div className="a-form-grid">
            {fields.map((f) => <FieldRow key={f.name} field={f} value={values?.[f.name]} def={defaults?.[f.name]} onChange={(v) => onChange(f.name, v)} />)}
        </div>
    );
}

/** Warn before leaving a page with unsaved edits (browser close / reload). */
export function useUnsavedWarning(dirty) {
    const ref = useRef(dirty);
    ref.current = dirty;
    useEffect(() => {
        const h = (e) => { if (ref.current) { e.preventDefault(); e.returnValue = ''; } };
        addEventListener('beforeunload', h);
        return () => removeEventListener('beforeunload', h);
    }, []);
}
