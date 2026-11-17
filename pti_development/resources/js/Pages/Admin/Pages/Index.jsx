import { Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Icon, IconBtn, Switch, ago, askDelete } from '../../../Layouts/AdminLayout';
import AdminLayout from '../../../Layouts/AdminLayout';

const fullDate = (d) => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Pages: every page of the website with stats, a visibility switch and Edit / View / Duplicate / Delete. */
export default function PagesIndex({ pages, templates }) {
    const [creating, setCreating] = useState(false);
    const [busy, setBusy] = useState(null);
    const form = useForm({ title: '', template: templates[0]?.key || '', slug: '' });

    const duplicate = (p) => router.post(`/admin/pages/${p.id}/duplicate`);
    const remove = (p) => askDelete({ title: `Delete “${p.title}”?`, text: `The page and its sections are deleted permanently. Its URL ${p.path} will stop working.` }).then((ok) => ok && router.delete(`/admin/pages/${p.id}`, { preserveScroll: true }));
    const toggle = (p) => router.patch(`/admin/pages/${p.id}/toggle`, {}, { preserveScroll: true, onStart: () => setBusy(p.id), onFinish: () => setBusy(null) });
    const create = (e) => { e.preventDefault(); form.post('/admin/pages', { onSuccess: () => setCreating(false) }); };

    const published = pages.filter((p) => p.is_published).length;
    const last = [...pages].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];

    return (
        <AdminLayout title="Pages" actions={<button className="a-btn primary" onClick={() => setCreating(true)}><Icon name="plus" /> New page</button>}>
            <div className="a-pages-lux">

                <div className="a-kpis">
                    <div className="a-kpi"><small>Total pages</small><b>{pages.length}</b></div>
                    <div className="a-kpi"><small>Published</small><b>{published}</b></div>
                    <div className="a-kpi"><small>Hidden</small><b>{pages.length - published}</b></div>
                    <div className="a-kpi">
                        <small>Last edited</small>
                        <b className="a-kpi-text">{last ? ago(last.updated_at) : '—'}</b>
                        {last && <em>{last.title} · {fullDate(last.updated_at)}{last.editor ? ` · ${last.editor}` : ''}</em>}
                    </div>
                </div>

                <div className="a-card flush">
                    <table className="a-table a-pages">
                        <thead><tr><th>Page</th><th>URL</th><th>Sections</th><th>Status</th><th>Visibility</th><th style={{ width: 200 }}>Action</th></tr></thead>
                        <tbody>
                            {pages.map((p) => {
                                const home = p.slug === 'home';
                                return (
                                    <tr key={p.id} className={`a-row-link ${busy === p.id ? 'is-busy' : ''}`}
                                        // a click anywhere on the row opens the page; the switch and action buttons keep their own job
                                        onClick={(e) => { if (!e.target.closest('a, button, input, select, label')) router.visit(`/admin/pages/${p.id}/edit`); }}>
                                        <td>
                                            <Link className="a-strong" href={`/admin/pages/${p.id}/edit`}>{p.title}</Link>
                                            {!p.is_system && <div className="a-muted sm">Copy of the {p.template_label} design</div>}
                                        </td>
                                        <td><span className="a-mono a-url">{p.template === 'project' ? '/projects/{project}' : p.path}</span></td>
                                        <td><span className="a-sec-count" title={`${p.enabled} of ${p.sections} sections switched on`}>{p.enabled}{p.enabled !== p.sections && <em> / {p.sections}</em>}</span></td>
                                        <td><span className={`a-status ${p.is_published ? 'pub' : 'hid'}`}>{p.is_published ? 'Published' : 'Hidden'}</span></td>
                                        <td>
                                            <Switch on={p.is_published} disabled={home || busy === p.id}
                                                label={home ? 'The home page is always published' : p.is_published ? 'Published (click to hide)' : 'Hidden (click to publish)'}
                                                onClick={() => toggle(p)} />
                                        </td>
                                        <td className="a-row-actions">
                                            <div className="a-ibtns">
                                                <IconBtn icon="edit" label="Edit sections & SEO" href={`/admin/pages/${p.id}/edit`} />
                                                <IconBtn icon="eye" label={p.is_published ? 'View on the website' : 'Hidden: publish it to view'} href={p.path} external disabled={!p.is_published && !p.is_system} />
                                                <IconBtn icon="copy" label={p.duplicable ? 'Duplicate' : 'This design cannot be copied'} onClick={() => duplicate(p)} disabled={!p.duplicable} />
                                                {!p.is_system && <IconBtn icon="trash" tone="danger" label="Delete" onClick={() => remove(p)} />}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {creating && (
                    <div className="a-modal" onMouseDown={(e) => e.target === e.currentTarget && setCreating(false)}>
                        <form className="a-modal-box" onSubmit={create}>
                            <div className="a-modal-head"><h2>New page</h2><button type="button" className="a-icon-btn" onClick={() => setCreating(false)}><Icon name="x" /></button></div>
                            <p className="a-muted" style={{ marginTop: 0 }}>The new page starts as a copy of a design with its original content, hidden until you publish it.</p>
                            <div className="a-form-grid">
                                <label className="a-field"><span>Title</span><input autoFocus value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} placeholder="e.g. Winter offers" />{form.errors.title && <small className="a-error">{form.errors.title}</small>}</label>
                                <label className="a-field half"><span>Design</span>
                                    <select value={form.data.template} onChange={(e) => form.setData('template', e.target.value)}>{templates.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</select>
                                </label>
                                <label className="a-field half"><span>URL</span>
                                    <div className="a-prefix"><em>/</em><input value={form.data.slug} onChange={(e) => form.setData('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} placeholder="from the title" /></div>
                                    {form.errors.slug && <small className="a-error">{form.errors.slug}</small>}
                                </label>
                            </div>
                            <div className="a-form-foot"><button type="button" className="a-btn ghost" onClick={() => setCreating(false)}>Cancel</button><button className="a-btn primary" disabled={form.processing}>Create page</button></div>
                        </form>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
