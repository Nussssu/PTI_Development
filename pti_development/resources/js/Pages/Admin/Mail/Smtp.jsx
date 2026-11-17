import { useForm, usePage } from '@inertiajs/react';
import AdminLayout, { Icon, Switch } from '../../../Layouts/AdminLayout';
import EmailTabs from './EmailTabs';

/** Email & SMTP: connect Gmail (or any SMTP server), who gets lead alerts, and a test button. */
export default function Smtp({ settings, presets }) {
    const { auth } = usePage().props;
    const form = useForm({ ...settings, password: '' });
    const test = useForm({ to: auth.user.email });
    const d = form.data;
    const set = (k, v) => form.setData(k, v);
    const pickPreset = (key) => {
        const p = presets[key];
        form.setData({ ...d, preset: key, host: p.host || d.host, port: p.port, encryption: p.encryption });
    };
    const err = (k) => form.errors[k] && <small className="a-error">{form.errors[k]}</small>;
    const save = (e) => { e.preventDefault(); form.put('/admin/email/smtp', { preserveScroll: true, onSuccess: () => form.setData('password', '') }); };

    return (
        <AdminLayout title="Email & SMTP">
            <EmailTabs />

            <div className="a-split wide">
                <form className="a-card a-form" onSubmit={save}>
                    <div className="a-card-head">
                        <h2>Outgoing mail (SMTP)</h2>
                        <label className="a-switch-cell"><Switch on={d.enabled} onClick={() => set('enabled', !d.enabled)} label="Use this SMTP account" /> <small>{d.enabled ? 'On' : 'Off'}</small></label>
                    </div>

                    <div className="a-presets">
                        {Object.entries(presets).map(([k, p]) => (
                            <button type="button" key={k} className={`a-preset ${d.preset === k ? 'is-active' : ''}`} onClick={() => pickPreset(k)}>
                                <b>{p.label.split(' / ')[0].split(' (')[0]}</b><small>{p.host || 'your server'}</small>
                            </button>
                        ))}
                    </div>

                    <div className="a-form-grid">
                        <label className="a-field half"><span>SMTP server</span><input value={d.host} onChange={(e) => set('host', e.target.value)} placeholder="smtp.gmail.com" readOnly={d.preset !== 'custom' && !!presets[d.preset]?.host} />{err('host')}</label>
                        <div className="a-field half a-form-grid" style={{ gap: 12 }}>
                            <label className="a-field half"><span>Port</span><input type="number" value={d.port} onChange={(e) => set('port', e.target.value)} />{err('port')}</label>
                            <label className="a-field half"><span>Security</span>
                                <select value={d.encryption} onChange={(e) => set('encryption', e.target.value)}><option value="tls">TLS (587)</option><option value="ssl">SSL (465)</option><option value="none">None</option></select>
                            </label>
                        </div>
                        <label className="a-field half"><span>{d.preset === 'gmail' ? 'Gmail address' : 'Username'}</span><input value={d.username} onChange={(e) => set('username', e.target.value)} placeholder={d.preset === 'gmail' ? 'yourname@gmail.com' : ''} autoComplete="off" />{err('username')}</label>
                        <label className="a-field half"><span>{d.preset === 'gmail' ? 'App password' : 'Password'}</span>
                            <input type="password" value={d.password} onChange={(e) => set('password', e.target.value)} placeholder={settings.has_password ? '•••••••• saved (leave empty to keep)' : d.preset === 'gmail' ? '16 letters, e.g. abcd efgh ijkl mnop' : ''} autoComplete="new-password" />
                            {err('password')}
                        </label>

                        <div className="a-field a-subhead"><span>Sender &amp; alerts</span></div>
                        <label className="a-field half"><span>From address</span><input value={d.from_address} onChange={(e) => set('from_address', e.target.value)} />{err('from_address')}<small className="a-muted">{d.preset === 'gmail' ? 'Use the same Gmail address (or a "Send mail as" alias).' : 'Usually the same as the username.'}</small></label>
                        <label className="a-field half"><span>From name</span><input value={d.from_name} onChange={(e) => set('from_name', e.target.value)} />{err('from_name')}</label>
                        <label className="a-field half"><span>Replies go to</span><input value={d.reply_to} onChange={(e) => set('reply_to', e.target.value)} placeholder="info@yourcompany.com" />{err('reply_to')}<small className="a-muted">When a lead answers your email.</small></label>
                        <label className="a-field half"><span>Send new-lead alerts to</span><input value={d.notify_to} onChange={(e) => set('notify_to', e.target.value)} placeholder="sales@…, manager@…" />{err('notify_to')}<small className="a-muted">One or more addresses, separated by commas.</small></label>
                    </div>
                    <div className="a-form-foot"><button className="a-btn primary" disabled={form.processing}>{form.processing ? 'Saving…' : 'Save email settings'}</button></div>
                </form>

                <div className="a-stack-lg">
                    <form className="a-card" onSubmit={(e) => { e.preventDefault(); test.post('/admin/email/smtp/test', { preserveScroll: true }); }}>
                        <div className="a-card-head"><h2><Icon name="send" /> Send a test email</h2></div>
                        <p className="a-muted" style={{ marginTop: -6 }}>Save first, then send a test to check the settings work.</p>
                        <div className="a-inline">
                            <input type="email" value={test.data.to} onChange={(e) => test.setData('to', e.target.value)} />
                            <button className="a-btn primary" disabled={test.processing}>{test.processing ? 'Sending…' : 'Send test'}</button>
                        </div>
                        {test.errors.to && <small className="a-error">{test.errors.to}</small>}
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
