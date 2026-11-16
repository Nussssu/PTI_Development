import { Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';

/** Edit a message: correct the contact details, set its status, keep an internal note. */
export default function InquiryEdit({ inquiry: i, statuses, projects }) {
    const form = useForm({
        first_name: i.first_name || '', last_name: i.last_name || '', email: i.email || '', phone: i.phone || '',
        message: i.message || '', source: i.source, project_id: i.project_id || '', status: i.status || 'new', notes: i.notes || '',
    });
    const field = (k, label, props = {}, half = true) => (
        <label className={`a-field ${half ? 'half' : ''}`}>
            <span>{label}</span>
            {props.textarea ? <textarea rows={props.rows || 5} value={form.data[k]} onChange={(e) => form.setData(k, e.target.value)} /> : <input value={form.data[k]} onChange={(e) => form.setData(k, e.target.value)} {...props} />}
            {form.errors[k] && <small className="a-error">{form.errors[k]}</small>}
        </label>
    );
    return (
        <AdminLayout title="Edit message" actions={<Link className="a-btn ghost" href={`/admin/inquiries/${i.id}`}>← Back to the message</Link>}>
            <form className="a-card a-leads" onSubmit={(e) => { e.preventDefault(); form.put(`/admin/inquiries/${i.id}`); }}>
                <div className="a-form-grid">
                    {field('first_name', 'First name')}
                    {field('last_name', 'Last name')}
                    {field('email', 'Email', { type: 'email' })}
                    {field('phone', 'Phone')}
                    <label className="a-field half"><span>Type</span>
                        <select value={form.data.source} onChange={(e) => form.setData('source', e.target.value)}><option value="contact">Contact message</option><option value="site_visit">Site visit request</option></select>
                    </label>
                    <label className="a-field half"><span>Project</span>
                        <select value={form.data.project_id} onChange={(e) => form.setData('project_id', e.target.value)}><option value="">—</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                    </label>
                    <label className="a-field half"><span>Status</span>
                        <select value={form.data.status} onChange={(e) => form.setData('status', e.target.value)}>{Object.entries(statuses).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                    </label>
                    {field('message', 'Message', { textarea: true }, false)}
                    {field('notes', 'Internal note (never sent to the customer)', { textarea: true, rows: 4 }, false)}
                </div>
                <div className="a-form-foot"><Link className="a-btn ghost" href={`/admin/inquiries/${i.id}`}>Cancel</Link><button className="a-btn primary" disabled={form.processing}>{form.processing ? 'Saving…' : 'Save changes'}</button></div>
            </form>
        </AdminLayout>
    );
}
