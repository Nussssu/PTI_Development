import { Link, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AdminLayout, { Icon, IconBtn, askDelete } from '../../../Layouts/AdminLayout';
import { when } from '../Dashboard';
import axios from 'axios';
import LeadDetail from '../../../Components/Admin/LeadDetail';

const TONES = { all: 'ink', new: 'violet', in_progress: 'blue', replied: 'teal', archived: 'grey' };
const messagePreview = (message, max = 120) => {
    const text = String(message || '').trim();
    return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text || '—';
};

/** Leads inbox: status tabs with counts, search + type + date filters, bulk actions, CSV import / export. */
export default function InquiriesIndex({ inquiries, filters, counts, unread, statuses, types }) {
    const [f, setF] = useState(filters);
    const [picked, setPicked] = useState([]);
    const [importing, setImporting] = useState(false);
    const [viewing, setViewing] = useState(null);
    const [editing, setEditing] = useState(null);
    const openView = (i) => setViewing(i.id);
    const go = (params = {}) => router.get('/admin/inquiries', clean({ ...f, ...params }), { preserveState: true, replace: true, onSuccess: () => setPicked([]) });
    const setTab = (status) => { setF((x) => ({ ...x, status })); go({ status, page: undefined }); };
    const remove = (i) => askDelete({ title: `Delete the lead from “${i.first_name}”?`, text: 'The lead, its message and its replies are deleted permanently.' }).then((ok) => ok && router.delete(`/admin/inquiries/${i.id}`, { preserveScroll: true }));
    const ids = inquiries.data.map((i) => i.id);
    const allPicked = ids.length > 0 && ids.every((id) => picked.includes(id));
    const bulk = async (action) => {
        if (!picked.length) return;
        if (action === 'delete' && !(await askDelete({ title: `Delete ${picked.length} lead${picked.length > 1 ? 's' : ''}?`, text: 'The selected leads, their messages and replies are deleted permanently.' }))) return;
        router.post('/admin/inquiries/bulk', { ids: picked, action }, { preserveScroll: true, onSuccess: () => setPicked([]) });
    };
    const exportUrl = `/admin/inquiries/export?${new URLSearchParams(clean(filters)).toString()}`;
    const filtered = filters.search || filters.type || filters.from || filters.to;

    return (
        <AdminLayout title="Leads" actions={<>
            <button className="a-btn" onClick={() => setImporting(true)}><Icon name="upload" /> Import CSV</button>
            <a className="a-btn" href={exportUrl}><Icon name="download" /> Export CSV</a>
        </>}>
            <div className="a-leads">

            <div className="a-chips">
                {[['', 'Total', 'all'], ...Object.entries(statuses).map(([k, l]) => [k, l, k]), ['unread', 'Unread', 'new']].map(([k, label, tone]) => (
                    <button key={label} className={`a-chip tone-${TONES[tone] || 'ink'} ${f.status === k ? 'is-active' : ''}`} onClick={() => setTab(k)}>
                        <i /> {label} <b>{k === '' ? counts.all : k === 'unread' ? unread : counts[k]}</b>
                    </button>
                ))}
            </div>

            <form className="a-card a-filters" onSubmit={(e) => { e.preventDefault(); go({ page: undefined }); }}>
                <input className="grow" type="search" placeholder="Search name, email, phone, project or text…" value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} />
                <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
                    <option value="">All statuses</option>
                    {Object.entries(statuses).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    <option value="unread">Unread</option>
                </select>
                <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
                    <option value="">All types</option>
                    {Object.entries(types).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
                <label className="a-date"><span>From</span><input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></label>
                <label className="a-date"><span>To</span><input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></label>
                <button className="a-btn">Search</button>
                {(filtered || f.status) && <button type="button" className="a-btn ghost" onClick={() => { const e = { status: '', type: '', search: '', from: '', to: '' }; setF(e); go(e); }}>Clear</button>}
            </form>

            {picked.length > 0 && (
                <div className="a-bulk">
                    <b>{picked.length} selected</b>
                    <button className="a-btn sm" onClick={() => bulk('read')}>Mark read</button>
                    <button className="a-btn sm" onClick={() => bulk('unread')}>Mark unread</button>
                    <select className="a-btn sm" value="" onChange={(e) => e.target.value && bulk(e.target.value)}>
                        <option value="">Set status…</option>
                        {Object.entries(statuses).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                    <button className="a-btn sm danger" onClick={() => bulk('delete')}>Delete</button>
                    <button className="a-btn sm ghost" onClick={() => setPicked([])}>Cancel</button>
                </div>
            )}

            <div className="a-card flush">
                {inquiries.data.length === 0 ? (
                    <p className="a-empty">{counts.all === 0 && !filtered && !f.status ? 'No leads yet. Messages from the contact form and site-visit requests will appear here.' : 'No leads match these filters.'}</p>
                ) : (
                    <table className="a-table">
                        <thead><tr>
                            <th className="a-td-check"><input type="checkbox" checked={allPicked} onChange={() => setPicked(allPicked ? [] : ids)} aria-label="Select all" /></th>
                            <th>From</th><th>Type</th><th>Message</th><th>Status</th><th>Received</th><th style={{ width: 190 }}>Action</th>
                        </tr></thead>
                        <tbody>
                            {inquiries.data.map((i) => (
                                <tr key={i.id} className={`${i.read_at ? '' : 'unread'} ${picked.includes(i.id) ? 'picked' : ''}`}>
                                    <td className="a-td-check"><input type="checkbox" checked={picked.includes(i.id)} onChange={() => setPicked((p) => (p.includes(i.id) ? p.filter((x) => x !== i.id) : [...p, i.id]))} aria-label={`Select ${i.first_name}`} /></td>
                                    <td>
                                        <Link className="a-strong" href={`/admin/inquiries/${i.id}`} onClick={(e) => { e.preventDefault(); openView(i); }}>{i.first_name} {i.last_name}</Link>
                                        <div className="a-muted sm">{i.phone}{i.email ? ` · ${i.email}` : ''}</div>
                                    </td>
                                    <td><span className={`a-pill ${i.source}`}>{types[i.source] || i.source}</span>{i.project && <div className="a-muted sm">{i.project.name}</div>}</td>
                                    <td><span className="a-clip">{messagePreview(i.message)}</span></td>
                                    <td>
                                        <span className={`a-pill st-${i.status}`}>{statuses[i.status] || i.status}</span>
                                        {i.replies_count > 0 && <div className="a-muted sm">↩ {i.replies_count} repl{i.replies_count > 1 ? 'ies' : 'y'}</div>}
                                    </td>
                                    <td className="a-muted sm">{when(i.created_at)}</td>
                                    <td className="a-row-actions">
                                        <div className="a-ibtns">
                                            <IconBtn icon="eye" label="View message" onClick={() => openView(i)} />
                                            <IconBtn icon="reply" label={i.email ? 'Reply by email' : 'No email address (call instead)'} onClick={() => openView(i)} disabled={!i.email} />
                                            <IconBtn icon="trash" tone="danger" label="Delete" onClick={() => remove(i)} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {inquiries.last_page > 1 && (
                <div className="a-pager">
                    {inquiries.links.map((l, k) => <Link key={k} href={l.url || '#'} preserveState className={`${l.active ? 'is-active' : ''} ${!l.url ? 'disabled' : ''}`} dangerouslySetInnerHTML={{ __html: l.label }} />)}
                </div>
            )}

            {importing && <ImportModal onClose={() => setImporting(false)} />}
            {viewing && <ViewModal id={viewing} types={types} onClose={() => setViewing(null)} onEdit={() => { const id = viewing; setViewing(null); setEditing(id); }} />}
            {editing && <EditModal id={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); router.reload({ only: ['inquiries', 'counts', 'unread', 'admin'] }); }} />}
            </div>
        </AdminLayout>
    );
}

/** The whole lead (message, reply box, replies sent, details, status) in a pop-up over the list. */
function ViewModal({ id, types, onClose, onEdit }) {
    const [data, setData] = useState(null);
    const [err, setErr] = useState('');
    const load = (refresh = true) => axios.get(`/admin/inquiries/${id}`, { params: refresh ? { refresh: 1 } : {}, headers: { Accept: 'application/json' } })
        .then((r) => setData(r.data)).catch(() => setErr('Could not load this lead.'));
    // opening it marks it read (like the full page), so refresh the list behind the pop-up too
    useEffect(() => { load(false).then(() => router.reload({ only: ['inquiries', 'counts', 'unread', 'admin'] })); }, [id]);
    useEffect(() => {
        const esc = (e) => e.key === 'Escape' && onClose();
        addEventListener('keydown', esc);
        return () => removeEventListener('keydown', esc);
    }, []);
    const i = data?.inquiry;
    const remove = () => askDelete({ title: `Delete the lead from “${i?.first_name || 'this person'}”?`, text: 'The lead, its message and its replies are deleted permanently.' }).then((ok) => ok && router.delete(`/admin/inquiries/${id}`, { preserveScroll: true, onSuccess: onClose }));

    return (
        <div className="a-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="a-modal-box a-leads a-view" role="dialog" aria-modal="true" aria-label={i ? `Lead from ${i.first_name}` : 'Lead'}>
                <div className="a-modal-head">
                    <div>
                        <h2>{i ? `${i.first_name} ${i.last_name || ''}` : 'Loading…'}</h2>
                        {i && (
                            <div className="a-view-tags">
                                <span className={`a-pill ${i.source}`}>{types[i.source] || i.source}</span>
                                <span className={`a-pill st-${i.status}`}>{data.statuses[i.status] || i.status}</span>
                            </div>
                        )}
                    </div>
                    <div className="a-ibtns">
                        {i && <IconBtn icon="edit" label="Edit" onClick={onEdit} />}
                        {i && <IconBtn icon="trash" tone="danger" label="Delete" onClick={remove} />}
                        <button type="button" className="a-icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
                    </div>
                </div>
                {err && <p className="a-error">{err}</p>}
                {!data && !err && <p className="a-muted" style={{ padding: '40px 0', textAlign: 'center' }}>Loading…</p>}
                {data && <LeadDetail inquiry={i} statuses={data.statuses} replyTemplate={data.replyTemplate} mailLive={data.mailLive} onChanged={() => load(true)} />}
            </div>
        </div>
    );
}

function EditModal({ id, onClose, onSaved }) {
    const [data, setData] = useState(null);
    const [err, setErr] = useState('');
    const form = useForm({ first_name: '', last_name: '', email: '', phone: '', message: '', source: 'contact', project_id: '', status: 'new', notes: '' });
    useEffect(() => {
        axios.get(`/admin/inquiries/${id}/edit`, { headers: { Accept: 'application/json' } })
            .then(({ data: result }) => {
                setData(result);
                const i = result.inquiry;
                form.setData({ first_name: i.first_name || '', last_name: i.last_name || '', email: i.email || '', phone: i.phone || '', message: i.message || '', source: i.source, project_id: i.project_id || '', status: i.status || 'new', notes: i.notes || '' });
            }).catch(() => setErr('Could not load this lead for editing.'));
        const esc = (e) => e.key === 'Escape' && onClose();
        addEventListener('keydown', esc);
        return () => removeEventListener('keydown', esc);
    }, [id]);
    const submit = async (e) => {
        e.preventDefault();
        form.clearErrors();
        form.setProcessing(true);
        try {
            await axios.put(`/admin/inquiries/${id}`, form.data, { headers: { Accept: 'application/json' } });
            onSaved();
        } catch (error) {
            if (error.response?.status === 422) form.setError(error.response.data.errors || {});
            else setErr('Could not save these changes.');
        } finally { form.setProcessing(false); }
    };
    const field = (key, label, type = 'text', half = true) => <label className={`a-field ${half ? 'half' : ''}`}><span>{label}</span><input type={type} value={form.data[key]} onChange={(e) => form.setData(key, e.target.value)} />{form.errors[key] && <small className="a-error">{form.errors[key]}</small>}</label>;
    return <div className="a-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><form className="a-modal-box a-leads" onSubmit={submit}>
        <div className="a-modal-head"><h2>Edit message</h2><button type="button" className="a-icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button></div>
        {err && <p className="a-error">{err}</p>}
        {!data && !err ? <p className="a-muted">Loading…</p> : data && <>
            <div className="a-form-grid">
                {field('first_name', 'First name')}{field('last_name', 'Last name')}{field('email', 'Email', 'email')}{field('phone', 'Phone')}
                <label className="a-field half"><span>Type</span><select value={form.data.source} onChange={(e) => form.setData('source', e.target.value)}><option value="contact">Contact message</option><option value="site_visit">Site visit request</option></select></label>
                <label className="a-field half"><span>Project</span><select value={form.data.project_id} onChange={(e) => form.setData('project_id', e.target.value)}><option value="">—</option>{data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
                <label className="a-field half"><span>Status</span><select value={form.data.status} onChange={(e) => form.setData('status', e.target.value)}>{Object.entries(data.statuses).map(([k, label]) => <option key={k} value={k}>{label}</option>)}</select></label>
                <label className="a-field"><span>Message</span><textarea rows={5} value={form.data.message} onChange={(e) => form.setData('message', e.target.value)} />{form.errors.message && <small className="a-error">{form.errors.message}</small>}</label>
                <label className="a-field"><span>Internal note</span><textarea rows={4} value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} />{form.errors.notes && <small className="a-error">{form.errors.notes}</small>}</label>
            </div>
            <div className="a-form-foot"><button type="button" className="a-btn ghost" onClick={onClose}>Cancel</button><button className="a-btn primary" disabled={form.processing}>{form.processing ? 'Saving…' : 'Save changes'}</button></div>
        </>}
    </form></div>;
}

function ImportModal({ onClose }) {
    const form = useForm({ file: null });
    const input = useRef(null);
    const submit = (e) => { e.preventDefault(); form.post('/admin/inquiries/import', { forceFormData: true, onSuccess: onClose }); };

    return (
        <div className="a-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <form className="a-modal-box" onSubmit={submit}>
                <div className="a-modal-head"><h2>Import leads from CSV</h2><button type="button" className="a-icon-btn" onClick={onClose}><Icon name="x" /></button></div>
                <p className="a-muted" style={{ marginTop: 0 }}>
                    A CSV with a header row (from Excel / Google Sheets: <em>File → Download → CSV</em>). Needed: <b>Name</b> (or First name) and <b>Phone</b>.
                    Also read if present: Last name, Email, Type, Project, Message, Status, Notes, Received. Rows already imported are skipped.
                </p>
                <p className="a-muted sm">Tip: export first to get a file with the right columns.</p>
                <label className="a-drop" onClick={() => input.current?.click()}>
                    <Icon name="upload" size={22} />
                    <span>{form.data.file ? form.data.file.name : 'Choose a .csv file'}</span>
                    <input ref={input} type="file" accept=".csv,text/csv" hidden onChange={(e) => form.setData('file', e.target.files[0] || null)} />
                </label>
                {form.errors.file && <small className="a-error">{form.errors.file}</small>}
                <div className="a-form-foot"><button type="button" className="a-btn ghost" onClick={onClose}>Cancel</button><button className="a-btn primary" disabled={!form.data.file || form.processing}>{form.processing ? 'Importing…' : 'Import'}</button></div>
            </form>
        </div>
    );
}

const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v != null));
