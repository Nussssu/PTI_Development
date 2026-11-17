import { Link, router } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import AdminLayout, { ago, Icon, Switch } from '../../../Layouts/AdminLayout';
import { useUnsavedWarning } from '../../../Components/Admin/Fields';
import EmailTabs from './EmailTabs';

/** Email templates: one expandable card per template (editor inside); "Preview template" opens the real email in a popup. */
export default function Templates({ templates, placeholders, live }) {
    const [key, setKey] = useState(() => new URLSearchParams(window.location.search).get('t') || templates[0].key);
    const t = templates.find((x) => x.key === key) || templates[0];
    const [data, setData] = useState({ subject: t.subject, body: t.body, is_enabled: t.is_enabled });
    const [saving, setSaving] = useState(false);
    const [html, setHtml] = useState('');
    const [env, setEnv] = useState(null);   // preview envelope: subject, from, to (from the server)
    const [previewMode, setPreviewMode] = useState('desktop');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [open, setOpen] = useState(true);   // the chosen template's card (the first one unless ?t= picks another) starts open
    const bodyRef = useRef(null);
    const subjectRef = useRef(null);
    const lastFocus = useRef('body');
    const dirty = data.subject !== t.subject || data.body !== t.body || data.is_enabled !== t.is_enabled;
    useUnsavedWarning(dirty);

    // reload the form when switching template or after a save
    useEffect(() => { setData({ subject: t.subject, body: t.body, is_enabled: t.is_enabled }); }, [t.key, t.updated_at]);

    // live preview, rendered by the server with the real layout (debounced)
    useEffect(() => {
        const id = setTimeout(() => {
            axios.post('/admin/email/preview', { subject: data.subject, body: data.body, key: t.key }, { responseType: 'text' })
                .then((r) => {
                    setHtml(r.data);
                    try { const b = atob(r.headers['x-preview-envelope'] || ''); setEnv(JSON.parse(new TextDecoder().decode(Uint8Array.from(b, (c) => c.charCodeAt(0))))); } catch { setEnv(null); }
                }).catch(() => {});
        }, 350);
        return () => clearTimeout(id);
    }, [data.subject, data.body, t.key]);

    const pick = (k) => {
        if (dirty && !confirm('Discard your unsaved changes to this template?')) return false;
        setKey(k);
        window.history.replaceState({}, '', `?t=${k}`);
        return true;
    };
    const insert = (ph) => {
        const el = lastFocus.current === 'subject' ? subjectRef.current : bodyRef.current;
        const field = lastFocus.current;
        const v = data[field];
        const s = el?.selectionStart ?? v.length;
        const e = el?.selectionEnd ?? v.length;
        setData((d) => ({ ...d, [field]: v.slice(0, s) + ph + v.slice(e) }));
        requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(s + ph.length, s + ph.length); });
    };
    const save = (reset = false) => {
        if (reset && !confirm(`Put "${t.name}" back to the original text?`)) return;
        setSaving(true);
        router.put(`/admin/email/templates/${t.key}`, { ...data, reset }, { preserveScroll: true, preserveState: true, onFinish: () => setSaving(false) });
    };

    return (
        <AdminLayout title="Email templates">
            <EmailTabs />
            {!live && <Link href="/admin/email/smtp" className="a-alert"><Icon name="mail" /> <span><b>Email is not set up yet.</b> You can edit the templates now; they will be sent once Email &amp; SMTP is connected.</span></Link>}

            {/* one expandable card per template (closed by default); the open card holds the editor */}
            <div className="a-set-list a-tpl-acc">
                {templates.map((x) => {
                    const isOpen = open && x.key === t.key;
                    return (
                        <section key={x.key} className={`a-set ${isOpen ? 'is-open' : ''}`}>
                            <button type="button" className="a-set-head" aria-expanded={isOpen}
                                onClick={() => (x.key === t.key ? setOpen((o) => !o) : pick(x.key) && setOpen(true))}>
                                <span className="a-set-ico"><Icon name="mail" size={18} /></span>
                                <span className="a-set-titles">
                                    <span className="a-set-title">{x.name}<span className={`a-pill ${x.is_enabled ? 'on' : 'off'}`}>{x.is_enabled ? 'On' : 'Off'}</span></span>
                                    <span className="a-set-text">{x.subject}</span>
                                    <span className="a-tpl-meta">To: {x.to} · {x.is_default ? 'Original text' : `Edited ${ago(x.updated_at)}${x.editor ? ` by ${x.editor}` : ''}`}</span>
                                </span>
                                <span className="a-set-toggle">{isOpen ? 'Collapse' : 'Expand'}<i><Icon name="down" size={15} /></i></span>
                            </button>
                            {isOpen && (
                                <div className="a-set-body a-tpl-body">
                                    <div className="a-tpl-bar">
                                        <p className="a-muted sm">{t.about}</p>
                                        {t.can_disable && <label className="a-switch-cell"><Switch on={data.is_enabled} label="Send this email" onClick={() => setData((d) => ({ ...d, is_enabled: !d.is_enabled }))} /><small>{data.is_enabled ? 'On' : 'Off'}</small></label>}
                                    </div>
                                    <div className="a-tpl-ph">
                                        <span className="a-muted sm">Placeholders: click to insert where the cursor is. They are filled in for each lead.</span>
                                        <div className="a-placeholders">
                                            {Object.entries(placeholders).map(([ph, label]) => <button key={ph} type="button" title={label} onClick={() => insert(ph)}>{ph}</button>)}
                                        </div>
                                    </div>
                                    <div className="a-form-grid">
                                        <label className="a-field"><span>Subject</span><input ref={subjectRef} value={data.subject} onFocus={() => { lastFocus.current = 'subject'; }} onChange={(e) => setData((d) => ({ ...d, subject: e.target.value }))} /></label>
                                        <label className="a-field"><span>Text</span><textarea ref={bodyRef} value={data.body} onFocus={() => { lastFocus.current = 'body'; }} onChange={(e) => setData((d) => ({ ...d, body: e.target.value }))} />
                                            <small className="a-muted">Plain text. Line breaks are kept and links become clickable. Your logo bar and contact details are added automatically.</small>
                                        </label>
                                    </div>
                                    <div className="a-form-foot" style={{ justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <button className="a-btn ghost sm" disabled={saving || t.is_default} onClick={() => save(true)}><Icon name="reset" size={15} /> Original</button>
                                            <button className="a-btn ghost sm" disabled={saving || dirty} title={dirty ? 'Save first' : 'Send this template to your own email'} onClick={() => router.post(`/admin/email/templates/${t.key}/test`, {}, { preserveScroll: true })}><Icon name="send" size={15} /> Send me a test</button>
                                            <button type="button" className="a-btn sm" onClick={() => setPreviewOpen(true)}><Icon name="eye" size={15} /> Preview template</button>
                                        </div>
                                        <button className="a-btn primary" disabled={!dirty || saving} onClick={() => save(false)}>{saving ? 'Saving…' : dirty ? 'Save template' : 'Saved'}</button>
                                    </div>
                                </div>
                            )}
                        </section>
                    );
                })}
            </div>

            {previewOpen && (
                <div className="a-modal" onMouseDown={(e) => e.target === e.currentTarget && setPreviewOpen(false)}>
                    {/* the email as it lands in an inbox: a mail-client window around the real rendered email */}
                    <div className="a-mailwin" role="dialog" aria-label={`Preview: ${t.name}`}>
                        <div className="a-mailwin-bar">
                            <span className="a-mailwin-dots" aria-hidden="true"><i /><i /><i /></span>
                            <span className="a-mailwin-label">Mail client · {t.name}</span>
                            <div className="a-mailwin-modes" role="group" aria-label="Preview size">
                                <button type="button" className={previewMode === 'desktop' ? 'is-active' : ''} aria-pressed={previewMode === 'desktop'} onClick={() => setPreviewMode('desktop')}>Desktop</button>
                                <button type="button" className={previewMode === 'mobile' ? 'is-active' : ''} aria-pressed={previewMode === 'mobile'} onClick={() => setPreviewMode('mobile')}>Mobile</button>
                            </div>
                            <button type="button" className="a-mailwin-x" onClick={() => setPreviewOpen(false)} aria-label="Close"><Icon name="x" size={18} /></button>
                        </div>
                        <div className="a-mailwin-head">
                            <div className="a-mailwin-subject">
                                <h2>{env?.subject || data.subject}</h2>
                                <time>{new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</time>
                            </div>
                            <dl>
                                <dt>From:</dt><dd>{env?.from || '—'}</dd>
                                <dt>To:</dt><dd>{env?.to || t.to}</dd>
                            </dl>
                        </div>
                        <div className={`a-mailwin-body a-preview-viewport ${previewMode}`}><iframe className="a-preview-frame" title={`${previewMode} email preview`} srcDoc={html} sandbox="" /></div>
                        <div className="a-mailwin-foot">
                            <span>Rendered by the server with your latest lead's details for every placeholder{dirty ? ' (includes your unsaved changes)' : ''}.</span>
                            <button type="button" className="a-mailwin-close" onClick={() => setPreviewOpen(false)}>Close preview</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
