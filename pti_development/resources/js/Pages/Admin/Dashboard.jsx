import { Link } from '@inertiajs/react';
import AdminLayout, { Icon } from '../../Layouts/AdminLayout';

export const when = (d) => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function Dashboard({ counts, latest, visits }) {
    const cards = [
        ['Unread leads', counts.unread, 'inbox', '/admin/inquiries?status=unread', true],
        ['New leads', counts.open, 'mail', '/admin/inquiries?status=new'],
        ['Site visit requests', counts.siteVisits, 'building', '/admin/inquiries?type=site_visit'],
    ];
    return (
        <AdminLayout title="Dashboard" actions={<a className="a-btn ghost" href="/" target="_blank" rel="noopener"><Icon name="eye" /> View website</a>}>
            <div className="a-stats">
                {cards.map(([label, value, icon, href, hot]) => (
                    <Link key={label} href={href} className={`a-stat ${hot && value ? 'hot' : ''}`}>
                        <span className="a-stat-ico"><Icon name={icon} /></span>
                        <b>{value}</b>
                        <small>{label}</small>
                    </Link>
                ))}
            </div>

            <div className="a-card">
                    <div className="a-card-head"><h2>Latest leads</h2><Link href="/admin/inquiries">View all →</Link></div>
                    {latest.length === 0 ? (
                        <p className="a-empty">No messages yet. Messages from the contact form and site-visit requests will appear here.</p>
                    ) : (
                        <table className="a-table">
                            <thead><tr><th>Name</th><th>Type</th><th>Phone</th><th>Received</th></tr></thead>
                            <tbody>
                                {latest.map((q) => (
                                    <tr key={q.id} className={q.read_at ? '' : 'unread'}>
                                        <td>{q.first_name} {q.last_name}</td>
                                        <td><span className={`a-pill ${q.source}`}>{q.source === 'site_visit' ? `Site visit${q.project ? ' · ' + q.project.name : ''}` : 'Contact'}</span></td>
                                        <td>{q.phone}</td>
                                        <td className="a-muted">{when(q.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
            </div>
        </AdminLayout>
    );
}
