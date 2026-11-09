import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { when } from '../Dashboard';

const FILTERS = [['all', 'All'], ['unread', 'Unread'], ['contact', 'Contact form'], ['site_visit', 'Site visits']];

export default function InquiriesIndex({ inquiries, filter, search }) {
    const [q, setQ] = useState(search);
    const go = (params) => router.get('/admin/inquiries', { filter, search: q, ...params }, { preserveState: true, replace: true });

    return (
        <AdminLayout title="Inquiries">
            <div className="a-toolbar">
                <div className="a-tabs">
                    {FILTERS.map(([k, label]) => (
                        <button key={k} className={filter === k ? 'is-active' : ''} onClick={() => go({ filter: k, page: 1 })}>{label}</button>
                    ))}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); go({ page: 1 }); }} className="a-search">
                    <input type="search" placeholder="Search name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} />
                </form>
            </div>

            <div className="a-card flush">
                {inquiries.data.length === 0 ? (
                    <p className="a-empty">No inquiries match.</p>
                ) : (
                    <table className="a-table">
                        <thead><tr><th>Name</th><th>Type</th><th>Contact</th><th>Message</th><th>Received</th><th /></tr></thead>
                        <tbody>
                            {inquiries.data.map((i) => (
                                <tr key={i.id} className={i.read_at ? '' : 'unread'}>
                                    <td><Link className="a-strong" href={`/admin/inquiries/${i.id}`}>{i.first_name} {i.last_name}</Link></td>
                                    <td><span className={`a-pill ${i.source}`}>{i.source === 'site_visit' ? 'Site visit' : 'Contact'}</span>{i.project && <div className="a-muted sm">{i.project.name}</div>}</td>
                                    <td>{i.phone}{i.email && <div className="a-muted sm">{i.email}</div>}</td>
                                    <td><span className="a-clip">{i.message || '—'}</span></td>
                                    <td className="a-muted">{when(i.created_at)}</td>
                                    <td className="a-row-actions">
                                        <button className="a-btn ghost sm" onClick={() => router.patch(`/admin/inquiries/${i.id}/toggle`, {}, { preserveScroll: true })}>{i.read_at ? 'Mark unread' : 'Mark read'}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {inquiries.last_page > 1 && (
                <div className="a-pager">
                    {inquiries.links.map((l, k) => (
                        <Link key={k} href={l.url || '#'} preserveState className={`${l.active ? 'is-active' : ''} ${!l.url ? 'disabled' : ''}`} dangerouslySetInnerHTML={{ __html: l.label }} />
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
