import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { Icon } from '../../Layouts/AdminLayout';
import { when } from '../../Pages/Admin/Dashboard';

/**
 * Everything about one lead: the message, the email reply box, replies sent, contact details, status and quick actions.
 * Used by the lead page and by the pop-up in the leads list. `onChanged` runs after any change (the pop-up reloads its data).
 */
export default function LeadDetail({ inquiry: i, statuses, replyTemplate, mailLive, onChanged, replyRef }) {
    const { site } = usePage().props;
    const tel = `tel:${i.phone.replace(/\s/g, '')}`;
    const wa = `https://wa.me/${i.phone.replace(/[^0-9]/g, '').replace(/^0/, '880')}`;
    const ownRef = useRef(null);
    const replyBox = replyRef || ownRef;
    const reply = useForm({ subject: replyTemplate.subject, body: replyTemplate.body });
    const opts = { preserveScroll: true, preserveState: true, onSuccess: () => onChanged?.() };

    useEffect(() => { reply.setData({ subject: replyTemplate.subject, body: replyTemplate.body }); }, [i.id]);
    useEffect(() => { if (window.location.hash === '#reply') setTimeout(() => replyBox.current?.querySelector('textarea')?.focus(), 200); }, []);

    const send = (e) => { e.preventDefault(); reply.post(`/admin/inquiries/${i.id}/reply`, { ...opts, onSuccess: () => { reply.reset('body'); onChanged?.(); } }); };
    // the bulk route returns to the current page, so this works on the lead page and inside the pop-up
    const setStatus = (status) => router.post('/admin/inquiries/bulk', { ids: [i.id], action: status }, opts);

    return (
        <div className="a-split">
            <div className="a-stack-lg">
                <div className="a-card">
                    <div className="a-card-head">
                        <h2>{i.source === 'site_visit' ? 'Site visit request' : 'Contact message'}</h2>
                        <span className="a-muted">{when(i.created_at)}</span>
                    </div>
                    {i.project && <p>Project: <a href={`/projects/${i.project.slug}`} target="_blank" rel="noopener" className="a-strong">{i.project.name}</a></p>}
                    <p className="a-message">{i.message || <span className="a-muted">No message. Call back to arrange the visit.</span>}</p>
                    {i.notes && <div className="a-note"><b>Internal note</b><p>{i.notes}</p></div>}
                </div>

                <form className="a-card" id="reply" ref={replyBox} onSubmit={send}>
                    <div className="a-card-head"><h2><Icon name="reply" /> Reply by email</h2>{i.email && <span className="a-muted sm">to {i.email}</span>}</div>
                    {i.email ? (
                        <>
                            <div className="a-form-grid">
                                <label className="a-field"><span>Subject</span><input value={reply.data.subject} onChange={(e) => reply.setData('subject', e.target.value)} />{reply.errors.subject && <small className="a-error">{reply.errors.subject}</small>}</label>
                                <label className="a-field"><span>Message</span><textarea rows={9} value={reply.data.body} onChange={(e) => reply.setData('body', e.target.value)} />{reply.errors.body && <small className="a-error">{reply.errors.body}</small>}</label>
                            </div>
                            {!mailLive && <Link href="/admin/email/smtp" className="a-alert sm"><Icon name="mail" /> <span>Email is not set up yet, so this reply will be saved but not delivered. Set up Email &amp; SMTP →</span></Link>}
                            <div className="a-form-foot"><span className="a-muted sm">The starting text comes from Email templates. Replies come back to {site.email}.</span><button className="a-btn primary" disabled={reply.processing}><Icon name="mail" /> {reply.processing ? 'Sending…' : 'Send reply'}</button></div>
                        </>
                    ) : <p className="a-muted" style={{ margin: 0 }}>No email address was given. Call or WhatsApp {i.first_name} instead.</p>}
                </form>

                {i.replies?.length > 0 && (
                    <div className="a-card">
                        <div className="a-card-head"><h2>Replies sent</h2><span className="a-muted sm">{i.replies.length}</span></div>
                        <div className="a-thread">
                            {i.replies.map((r) => (
                                <div key={r.id} className={`a-thread-item ${r.sent ? '' : 'failed'}`}>
                                    <div className="a-thread-head"><b>{r.subject}</b><small className="a-muted">{when(r.created_at)}{r.user ? ` · ${r.user.name}` : ''}</small></div>
                                    {!r.sent && <small className="a-error">Not delivered: {r.error}</small>}
                                    <p>{r.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="a-card">
                <dl className="a-dl">
                    <dt>Phone</dt><dd><a href={tel}>{i.phone}</a></dd>
                    {i.email && (<><dt>Email</dt><dd><a href={`mailto:${i.email}`}>{i.email}</a></dd></>)}
                    <dt>Received</dt><dd>{when(i.created_at)}</dd>
                    <dt>Read</dt><dd>{i.read_at ? when(i.read_at) : 'Unread'}</dd>
                    {i.replied_at && (<><dt>Replied</dt><dd>{when(i.replied_at)}</dd></>)}
                    {i.ip && (<><dt>IP</dt><dd className="a-muted">{i.ip}</dd></>)}
                </dl>
                <div className="a-field" style={{ marginBottom: 18 }}>
                    <span>Status</span>
                    <div className="a-tabs">{Object.entries(statuses).map(([k, l]) => <button key={k} type="button" className={i.status === k ? 'is-active' : ''} onClick={() => setStatus(k)}>{l}</button>)}</div>
                </div>
                <div className="a-stack">
                    <a className="a-btn primary" href={tel}><Icon name="phone" /> Call</a>
                    <a className="a-btn" href={wa} target="_blank" rel="noopener">WhatsApp</a>
                    <button className="a-btn ghost" onClick={() => router.patch(`/admin/inquiries/${i.id}/toggle`, {}, opts)}>{i.read_at ? 'Mark as unread' : 'Mark as read'}</button>
                </div>
            </div>
        </div>
    );
}
