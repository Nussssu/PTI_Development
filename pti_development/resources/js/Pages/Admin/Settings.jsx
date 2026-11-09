import { useForm } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';

export default function Settings({ fields, values }) {
    const form = useForm(values);
    const pw = useForm({ current_password: '', password: '', password_confirmation: '' });

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

                <form className="a-card a-form" onSubmit={(e) => { e.preventDefault(); pw.put('/admin/settings/password', { preserveScroll: true, onSuccess: () => pw.reset() }); }}>
                    <div className="a-card-head"><h2>Change password</h2></div>
                    {[['current_password', 'Current password', 'current-password'], ['password', 'New password', 'new-password'], ['password_confirmation', 'Confirm new password', 'new-password']].map(([k, label, ac]) => (
                        <label key={k} className="a-field">
                            <span>{label}</span>
                            <input type="password" autoComplete={ac} value={pw.data[k]} onChange={(e) => pw.setData(k, e.target.value)} />
                            {pw.errors[k] && <small className="a-error">{pw.errors[k]}</small>}
                        </label>
                    ))}
                    <div className="a-form-foot"><button className="a-btn primary" disabled={pw.processing}>Update password</button></div>
                </form>
            </div>
        </AdminLayout>
    );
}
