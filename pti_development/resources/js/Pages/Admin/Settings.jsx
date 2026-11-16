import { Link, useForm } from '@inertiajs/react';
import AdminLayout, { Icon } from '../../Layouts/AdminLayout';

export default function Settings({ fields, values }) {
    const form = useForm(values);

    return (
        <AdminLayout title="Settings">
            <div className="a-split wide">
                <form className="a-card a-form" onSubmit={(e) => { e.preventDefault(); form.put('/admin/settings', { preserveScroll: true }); }}>
                    <div className="a-card-head"><h2>Website details</h2></div>
                    <p className="a-muted" style={{ marginTop: -8 }}>Shown in the header, footer, contact page and project pages.</p>
                    <div className="a-form-grid">
                        {fields.map((f) => (
                            <label key={f.name} className={`a-field ${['address_long', 'address'].includes(f.name) ? '' : 'half'}`}>
                                <span>{f.label}</span>
                                <input value={form.data[f.name] || ''} onChange={(e) => form.setData(f.name, e.target.value)} />
                                {form.errors[f.name] && <small className="a-error">{form.errors[f.name]}</small>}
                            </label>
                        ))}
                    </div>
                    <div className="a-form-foot"><button className="a-btn primary" disabled={form.processing}>{form.processing ? 'Saving…' : 'Save settings'}</button></div>
                </form>

                <div className="a-card">
                    <div className="a-card-head"><h2>More settings</h2></div>
                    <div className="a-recent">
                        <Link href="/admin/email/smtp" className="a-recent-item"><span className="a-stat-ico"><Icon name="mail" /></span><span><b>Email setup</b><small className="a-muted">SMTP and email templates</small></span></Link>
                        <Link href="/admin/security" className="a-recent-item"><span className="a-stat-ico"><Icon name="lock" /></span><span><b>My security</b><small className="a-muted">Your password and devices</small></span></Link>
                        <Link href="/admin/layout" className="a-recent-item"><span className="a-stat-ico"><Icon name="layout" /></span><span><b>Menus</b><small className="a-muted">Header and footer links</small></span></Link>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
