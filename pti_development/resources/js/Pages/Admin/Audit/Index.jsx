import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout, { Icon, askDelete } from '../../../Layouts/AdminLayout';
import { when } from '../Dashboard';

const LABELS = {
    created: 'Created', updated: 'Updated', deleted: 'Deleted', login: 'Signed in', logout: 'Signed out', login_failed: 'Failed sign-in',
    password_changed: 'Password changed', logout_others: 'Signed out devices', reordered: 'Reordered', imported: 'Imported', exported: 'Exported',
    bulk_status: 'Bulk status', settings: 'Settings', mail_settings: 'Email settings', mail_test: 'Test email', mail_test_failed: 'Test email failed',
    mail_reply: 'Email reply', mail_reply_failed: 'Reply failed', custom_code: 'Custom code', purged: 'Log cleared',
};
const label = (a) => LABELS[a] || a.replace(/_/g, ' ');
const tone = (a) => (a.includes('failed') || a === 'deleted' || a === 'purged' ? 'off' : a === 'created' || a === 'login' || a === 'mail_reply' || a === 'imported' ? 'on' : '');
const show = (v) => (v === null || v === undefined || v === '' ? '(empty)' : v === true ? 'yes' : v === false ? 'no' : String(v));

/** Audit log: every change, sign-in and email, filterable, exportable. */
export default function AuditIndex({ logs, filters, users, actions, subjects, total }) {
    const { auth } = usePage().props;
    const [f, setF] = useState(filters);
    const [open, setOpen] = useState([]);
    const go = (params = {}) => router.get('/admin/audit', clean({ ...f, ...params }), { preserveState: true, replace: true });
    const purge = (e) => {
        const days = e.target.value;
        e.target.value = '';
        if (days) askDelete({ title: `Delete entries older than ${days} days?`, text: 'Those audit log entries are deleted permanently.' }).then((ok) => ok && router.delete('/admin/audit', { data: { days }, preserveScroll: true }));
    };

    return (
        <AdminLayout title="Audit log" actions={<>
            {auth.user.can.users && (
                <select className="a-btn" defaultValue="" onChange={purge} title="Remove old entries">
                    <option value="">Clear old entries…</option>
                    {[30, 90, 180, 365].map((d) => <option key={d} value={d}>Older than {d} days</option>)}
                </select>
            )}
            <a className="a-btn" href={`/admin/audit/export?${new URLSearchParams(clean(filters))}`}><Icon name="download" /> Export CSV</a>
        </>}>

            <form className="a-card a-filters" onSubmit={(e) => { e.preventDefault(); go({ page: undefined }); }}>
                <input className="grow" type="search" placeholder="Search description, item, user or IP…" value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} />
                <select value={f.user} onChange={(e) => setF({ ...f, user: e.target.value })}>
                    <option value="">All users</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <select value={f.action} onChange={(e) => setF({ ...f, action: e.target.value })}>
                    <option value="">All actions</option>
                    {actions.map((a) => <option key={a} value={a}>{label(a)}</option>)}
                </select>
                <select value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })}>
                    <option value="">All types</option>
                    {subjects.map((s) => <option key={s} value={s}>{s.replace(/([a-z])([A-Z])/g, '$1 $2')}</option>)}
                </select>
                <label className="a-date"><span>From</span><input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></label>
                <label className="a-date"><span>To</span><input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></label>
                <button className="a-btn">Search</button>
                {Object.values(filters).some(Boolean) && <button type="button" className="a-btn ghost" onClick={() => { const e = { search: '', user: '', action: '', subject: '', from: '', to: '' }; setF(e); go(e); }}>Clear</button>}
            </form>

            <div className="a-card flush">
                {logs.data.length === 0 ? <p className="a-empty">No entries match.</p> : (
                    <table className="a-table">
                        <thead><tr><th>When</th><th>User</th><th>Action</th><th>What happened</th><th>IP</th></tr></thead>
                        <tbody>
                            {logs.data.map((l) => {
                                const ch = l.changes ? Object.entries(l.changes) : [];
                                const isOpen = open.includes(l.id);
                                return (
                                    <tr key={l.id}>
                                        <td className="a-muted sm" style={{ whiteSpace: 'nowrap' }}>{when(l.created_at)}</td>
                                        <td><b>{l.user_name || 'System'}</b></td>
                                        <td><span className={`a-pill ${tone(l.action)}`}>{label(l.action)}</span></td>
                                        <td className="a-audit-desc">
                                            {l.subject_type === 'Inquiry' && l.subject_id ? <Link className="a-strong" href={`/admin/inquiries/${l.subject_id}`}>{l.description}</Link> : l.description}
                                            {ch.length > 0 && (
                                                <>
                                                    <div><button type="button" className="a-more" onClick={() => setOpen((o) => (isOpen ? o.filter((x) => x !== l.id) : [...o, l.id]))}>{isOpen ? 'Hide changes' : `Show ${ch.length} change${ch.length > 1 ? 's' : ''}`}</button></div>
                                                    {isOpen && (
                                                        <div className="a-changes">
                                                            {ch.map(([k, [o, n]]) => <div key={k}><code>{k}</code><span><del>{show(o)}</del> → <ins>{show(n)}</ins></span></div>)}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                        <td className="a-muted sm a-mono">{l.ip}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {logs.last_page > 1 && (
                <div className="a-pager">
                    {logs.links.map((x, k) => <Link key={k} href={x.url || '#'} preserveState className={`${x.active ? 'is-active' : ''} ${!x.url ? 'disabled' : ''}`} dangerouslySetInnerHTML={{ __html: x.label }} />)}
                </div>
            )}
        </AdminLayout>
    );
}

const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v != null));
