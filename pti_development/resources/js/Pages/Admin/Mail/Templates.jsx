import { Link, router } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import AdminLayout, { ago, Icon, Switch } from '../../../Layouts/AdminLayout';
import { useUnsavedWarning } from '../../../Components/Admin/Fields';
import EmailTabs from './EmailTabs';

/** Email templates: pick one, edit subject + text with {placeholders}, see the real email beside it. */
export default function Templates({ templates, placeholders, live }) {
    const [key, setKey] = useState(() => new URLSearchParams(window.location.search).get('t') || templates[0].key);
    const t = templates.find((x) => x.key === key) || templates[0];
    const [data, setData] = useState({ subject: t.subject, body: t.body, is_enabled: t.is_enabled });
    const [saving, setSaving] = useState(false);
    const [html, setHtml] = useState('');
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
                .then((r) => setHtml(r.data)).catch(() => {});
        }, 350);
        return () => clearTimeout(id);
    }, [data.subject, data.body, t.key]);

    const pick = (k) => {
        if (dirty && !confirm('Discard your unsaved changes to this template?')) return;
        setKey(k);
        window.history.replaceState({}, '', `?t=${k}`);
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

            <div className="a-tpl-grid">
                <div className="a-tpl-list">
                    {templates.map((x) => (
                        <button key={x.key} className={`a-tpl ${x.key === t.key ? 'is-active' : ''}`} onClick={() => pick(x.key)}>
                            <b>{x.name}</b>
                            <span className={`a-pill ${x.is_enabled ? 'on' : 'off'}`}>{x.is_enabled ? 'On' : 'Off'}</span>
                            <small>To: {x.to}</small>
                            <small>{x.is_default ? 'Original text' : `Edited ${ago(x.updated_at)}${x.editor ? ` by ${x.editor}` : ''}`}</small>
                        </button>
                    ))}
                    <div className="a-card" style={{ padding: 18 }}>
                        <div className="a-card-head" style={{ marginBottom: 10 }}><h2 style={{ fontSize: 15 }}>Placeholders</h2></div>
                        <p className="a-muted sm" style={{ marginTop: 0 }}>Click to insert where the cursor is. They are filled in for each lead.</p>
                        <div className="a-placeholders">
                            {Object.entries(placeholders).map(([ph, label]) => <button key={ph} type="button" title={label} onClick={() => insert(ph)}>{ph}</button>)}
                        </div>
                    </div>
                </div>

                <div className="a-tpl-edit">
                    <div className="a-card">
                        <div className="a-card-head">
                            <div><h2>{t.name}</h2><p className="a-muted sm" style={{ margin: '4px 0 0' }}>{t.about}</p></div>
                            {t.can_disable && <label className="a-switch-cell"><Switch on={data.is_enabled} label="Send this email" onClick={() => setData((d) => ({ ...d, is_enabled: !d.is_enabled }))} /><small>{data.is_enabled ? 'On' : 'Off'}</small></label>}
                        </div>
                        <div className="a-form-grid">
                            <label className="a-field"><span>Subject</span><input ref={subjectRef} value={data.subject} onFocus={() => { lastFocus.current = 'subject'; }} onChange={(e) => setData((d) => ({ ...d, subject: e.target.value }))} /></label>
                            <label className="a-field"><span>Text</span><textarea ref={bodyRef} value={data.body} onFocus={() => { lastFocus.current = 'body'; }} onChange={(e) => setData((d) => ({ ...d, body: e.target.value }))} />
                                <small className="a-muted">Plain text. Line breaks are kept and links become clickable. Your logo bar, contact details and (for replies) the lead's message are added automatically.</small>
                            </label>
                        </div>
                        <div className="a-form-foot" style={{ justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="a-btn ghost sm" disabled={saving || t.is_default} onClick={() => save(true)}><Icon name="reset" size={15} /> Original</button>
                                <button className="a-btn ghost sm" disabled={saving || dirty} title={dirty ? 'Save first' : 'Send this template to your own email'} onClick={() => router.post(`/admin/email/templates/${t.key}/test`, {}, { preserveScroll: true })}><Icon name="send" size={15} /> Send me a test</button>
                            </div>
                            <button className="a-btn primary" disabled={!dirty || saving} onClick={() => save(false)}>{saving ? 'Saving…' : dirty ? 'Save template' : 'Saved'}</button>
                        </div>
                    </div>
                    <div className="a-card" style={{ padding: 14 }}>
                        <div className="a-card-head" style={{ marginBottom: 10, padding: '4px 6px 0' }}><h2 style={{ fontSize: 15 }}>Preview</h2><span className="a-muted sm">with your latest lead's details</span></div>
                        <iframe className="a-preview-frame" title="Email preview" srcDoc={html} sandbox="" />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
