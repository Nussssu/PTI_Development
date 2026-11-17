import { Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AdminLayout, { Icon } from '../../../Layouts/AdminLayout';
import EmailTabs from './EmailTabs';

const filtersEmpty = { status: 'all', type: '', search: '', from: '', to: '' };
const clean = (data) => Object.fromEntries(Object.entries(data).filter(([, value]) => value !== '' && value != null && value !== 'all'));
const time = (value) => new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const statusLabel = { sent: 'Sent', failed: 'Failed', skipped: 'Skipped', activity: 'Activity' };

export default function Logs({ logs, filters, types, counts }) {
    const [form, setForm] = useState(filters);
    const [selected, setSelected] = useState(null);
    useEffect(() => setForm(filters), [filters]);
    const go = (next) => router.get('/admin/email/logs', clean({ ...form, ...next }), { preserveState: true, replace: true });
    const statuses = ['all', 'sent', 'failed', 'skipped', 'activity'];

    return (
        <AdminLayout title="Email & SMTP">
            <p className="a-muted" style={{ margin: '-10px 0 22px' }}>Every email the site sends, fails or skips, and changes to the email setup.</p>
            <EmailTabs />

            <div className="a-tabs a-tabs-lg a-email-log-status" aria-label="Filter email logs">
                {statuses.map((status) => (
                    <button type="button" key={status} className={filters.status === status ? 'is-active' : ''} onClick={() => { setForm({ ...form, status }); go({ status, page: undefined }); }}>
                        {status === 'all' ? 'All' : statusLabel[status]} <em>{counts[status] || 0}</em>
                    </button>
                ))}
            </div>

            <form className="a-card a-filters a-email-log-filters" onSubmit={(e) => { e.preventDefault(); go({ page: undefined }); }}>
                <input className="grow" type="search" placeholder="Search recipient or subject, then press Enter" value={form.search} onChange={(e) => setForm({ ...form, search: e.target.value })} />
                <select value={form.type} onChange={(e) => { const type = e.target.value; setForm({ ...form, type }); go({ type, page: undefined }); }}>
                    <option value="">All types</option>
                    {types.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <label className="a-date"><span>From</span><input type="date" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} /></label>
                <label className="a-date"><span>To</span><input type="date" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} /></label>
                <button className="a-btn">Search</button>
                {(filters.type || filters.search || filters.from || filters.to || filters.status !== 'all') && <button type="button" className="a-btn ghost" onClick={() => { setForm(filtersEmpty); router.get('/admin/email/logs'); }}>Clear</button>}
            </form>

            <div className="a-card flush a-email-log-table">
                {logs.data.length === 0 ? <p className="a-empty">No email activity matches these filters.</p> : (
                    <table className="a-table">
                        <thead><tr><th>Time</th><th>Status</th><th>Type</th><th>To</th><th>Subject / action</th><th>By</th><th>Action</th></tr></thead>
                        <tbody>
                            {logs.data.map((log) => (
                                <tr key={log.id}>
                                    <td className="a-muted sm" style={{ whiteSpace: 'nowrap' }}>{time(log.created_at)}</td>
                                    <td><span className={`a-pill ${log.status === 'sent' ? 'on' : log.status === 'failed' ? 'off' : log.status === 'activity' ? 'gold' : ''}`}>{statusLabel[log.status] || log.status}</span></td>
                                    <td>{log.type}</td>
                                    <td>{log.recipient || '—'}</td>
                                    <td>{log.subject || log.description || '—'}</td>
                                    <td>{log.actor || 'System'}</td>
                                    <td><button type="button" className="a-icon-btn" title="View details" aria-label="View details" onClick={() => setSelected(log)}><Icon name="eye" size={16} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {logs.last_page > 1 && <div className="a-pager">{logs.links.map((link, i) => <Link key={i} href={link.url || '#'} preserveState className={`${link.active ? 'is-active' : ''} ${!link.url ? 'disabled' : ''}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}</div>}

            {selected && <div className="a-modal" onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}>
                <div className="a-modal-box" role="dialog" aria-modal="true" aria-label="Email log details">
                    <div className="a-modal-head"><h2>Email activity</h2><button type="button" className="a-icon-btn" onClick={() => setSelected(null)} aria-label="Close"><Icon name="x" /></button></div>
                    <dl className="a-email-log-detail">
                        <dt>Time</dt><dd>{time(selected.created_at)}</dd>
                        <dt>Status</dt><dd>{statusLabel[selected.status] || selected.status}</dd>
                        <dt>Type</dt><dd>{selected.type}</dd>
                        <dt>To</dt><dd>{selected.recipient || '—'}</dd>
                        <dt>Subject / action</dt><dd>{selected.subject || '—'}</dd>
                        <dt>By</dt><dd>{selected.actor || 'System'}</dd>
                        <dt>Details</dt><dd>{selected.description || '—'}</dd>
                    </dl>
                    <div className="a-form-foot"><button type="button" className="a-btn" onClick={() => setSelected(null)}>Close</button></div>
                </div>
            </div>}
        </AdminLayout>
    );
}
