import { useForm } from '@inertiajs/react';
import AdminLayout, { ago, Icon } from '../../Layouts/AdminLayout';
import { when } from './Dashboard';

/** My security: profile, password, signed-in devices and recent sign-ins. */
export default function Security({ profile, sessions, logins }) {
    const me = useForm({ name: profile.name, email: profile.email, current_password: '' });
    const pw = useForm({ current_password: '', password: '', password_confirmation: '' });
    const others = useForm({ current_password: '' });
    const emailChanged = me.data.email !== profile.email;
    const err = (f, k) => f.errors[k] && <small className="a-error">{f.errors[k]}</small>;

    return (
        <AdminLayout title="My security">
            <div className="a-split">
                <div className="a-stack-lg">
                    <form className="a-card" onSubmit={(e) => { e.preventDefault(); me.put('/admin/security/profile', { preserveScroll: true, onSuccess: () => me.setData('current_password', '') }); }}>
                        <div className="a-card-head"><h2>Profile</h2></div>
                        <div className="a-form-grid">
                            <label className="a-field half"><span>Name</span><input value={me.data.name} onChange={(e) => me.setData('name', e.target.value)} />{err(me, 'name')}</label>
                            <label className="a-field half"><span>Email (sign-in)</span><input type="email" value={me.data.email} onChange={(e) => me.setData('email', e.target.value)} />{err(me, 'email')}</label>
                            {emailChanged && <label className="a-field"><span>Current password</span><input type="password" value={me.data.current_password} onChange={(e) => me.setData('current_password', e.target.value)} autoComplete="current-password" />{err(me, 'current_password')}<small className="a-muted">Needed to change the email you sign in with.</small></label>}
                        </div>
                        <div className="a-form-foot"><button className="a-btn primary" disabled={me.processing}>Save profile</button></div>
                    </form>

                    <form className="a-card" onSubmit={(e) => { e.preventDefault(); pw.put('/admin/security/password', { preserveScroll: true, onSuccess: () => pw.reset() }); }}>
                        <div className="a-card-head"><h2><Icon name="lock" /> Change password</h2></div>
                        <div className="a-form-grid">
                            {[['current_password', 'Current password', 'current-password'], ['password', 'New password', 'new-password'], ['password_confirmation', 'Repeat new password', 'new-password']].map(([k, l, ac]) => (
                                <label key={k} className={`a-field ${k === 'current_password' ? '' : 'half'}`}><span>{l}</span><input type="password" autoComplete={ac} value={pw.data[k]} onChange={(e) => pw.setData(k, e.target.value)} />{err(pw, k)}</label>
                            ))}
                        </div>
                        <p className="a-muted sm">At least 8 characters with letters and numbers. A longer phrase is safer than a short complex one.</p>
                        <div className="a-form-foot"><button className="a-btn primary" disabled={pw.processing}>Update password</button></div>
                    </form>
                </div>

                <div className="a-stack-lg">
                    <div className="a-card">
                        <div className="a-card-head"><h2>Signed-in devices</h2></div>
                        {sessions.length === 0 ? <p className="a-muted">No device list for this session driver.</p> : (
                            <div className="a-activity">
                                {sessions.map((s, i) => (
                                    <div key={i} className="a-activity-item"><span className={`a-dot ${s.current ? 'act-created' : ''}`} /><span>{s.agent}{s.current && <span className="a-pill on" style={{ marginLeft: 8 }}>This device</span>}<div className="a-muted sm">{s.ip}</div></span><small className="a-muted">{ago(s.last)}</small></div>
                                ))}
                            </div>
                        )}
                        <form onSubmit={(e) => { e.preventDefault(); others.post('/admin/security/logout-others', { preserveScroll: true, onSuccess: () => others.reset() }); }} style={{ marginTop: 16 }}>
                            <div className="a-inline">
                                <input type="password" placeholder="Your password" value={others.data.current_password} onChange={(e) => others.setData('current_password', e.target.value)} autoComplete="current-password" />
                                <button className="a-btn" disabled={others.processing || !others.data.current_password}>Sign out other devices</button>
                            </div>
                            {err(others, 'current_password')}
                        </form>
                    </div>

                    <div className="a-card">
                        <div className="a-card-head"><h2>Recent sign-ins</h2></div>
                        {logins.length === 0 ? <p className="a-muted">Nothing yet.</p> : (
                            <div className="a-activity">
                                {logins.map((l) => (
                                    <div key={l.id} className="a-activity-item">
                                        <span className={`a-dot ${l.action === 'login_failed' ? 'act-deleted' : l.action === 'login' ? 'act-created' : ''}`} />
                                        <span>{{ login: 'Signed in', logout: 'Signed out', login_failed: 'Failed attempt', password_changed: 'Password changed' }[l.action]}<div className="a-muted sm">{l.agent} · {l.ip}</div></span>
                                        <small className="a-muted">{when(l.created_at)}</small>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
