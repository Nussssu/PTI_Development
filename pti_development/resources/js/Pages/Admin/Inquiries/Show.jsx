import { Link, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { when } from '../Dashboard';

export default function InquiryShow({ inquiry: i }) {
    const remove = () => confirm('Delete this inquiry?') && router.delete(`/admin/inquiries/${i.id}`);
    const tel = `tel:${i.phone.replace(/\s/g, '')}`;
    const wa = `https://wa.me/${i.phone.replace(/[^0-9]/g, '').replace(/^0/, '880')}`;

    return (
        <AdminLayout title={`${i.first_name} ${i.last_name || ''}`} actions={<Link className="a-btn ghost" href="/admin/inquiries">← All inquiries</Link>}>
            <div className="a-split">
                <div className="a-card">
                    <div className="a-card-head">
                        <h2>{i.source === 'site_visit' ? 'Site visit request' : 'Contact message'}</h2>
                        <span className="a-muted">{when(i.created_at)}</span>
                    </div>
                    {i.project && <p>Project: <a href={`/projects/${i.project.slug}`} target="_blank" rel="noopener" className="a-strong">{i.project.name}</a></p>}
                    <p className="a-message">{i.message || <span className="a-muted">No message. Call back to arrange the visit.</span>}</p>
                </div>
                <div className="a-card">
                    <dl className="a-dl">
                        <dt>Phone</dt><dd><a href={tel}>{i.phone}</a></dd>
                        {i.email && (<><dt>Email</dt><dd><a href={`mailto:${i.email}`}>{i.email}</a></dd></>)}
                        <dt>Status</dt><dd>{i.read_at ? `Read ${when(i.read_at)}` : 'Unread'}</dd>
                        {i.ip && (<><dt>IP</dt><dd className="a-muted">{i.ip}</dd></>)}
                    </dl>
                    <div className="a-stack">
                        <a className="a-btn primary" href={tel}>Call</a>
                        <a className="a-btn" href={wa} target="_blank" rel="noopener">WhatsApp</a>
                        {i.email && <a className="a-btn" href={`mailto:${i.email}?subject=${encodeURIComponent('Re: your enquiry to PTI Development')}`}>Reply by email</a>}
                        <button className="a-btn ghost" onClick={() => router.patch(`/admin/inquiries/${i.id}/toggle`)}>{i.read_at ? 'Mark as unread' : 'Mark as read'}</button>
                        <button className="a-btn danger" onClick={remove}>Delete</button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
