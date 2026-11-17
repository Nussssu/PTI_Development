import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout, { Icon, IconBtn, Switch, askDelete } from '../../../Layouts/AdminLayout';
import ResourceForm from './Form';

function Cell({ field, value, item }) {
    if (!field) return value;
    if (field.type === 'image') {
        const url = item[`${field.name}_url`];
        return url ? <img className="a-thumb" src={url} alt="" /> : <span className="a-thumb empty" />;
    }
    if (field.type === 'textarea' || (typeof value === 'string' && value.length > 80)) return <span className="a-clip">{value}</span>;
    return value ?? '—';
}

/**
 * A collection (projects, services, team, ...): stat cards, tabs, order arrows (= order on the site),
 * on / off switches for yes/no fields, and Edit / View / Duplicate / Delete.
 */
export default function ResourceIndex({ resource, items, stats = [], tabs }) {
    const fields = Object.fromEntries(resource.fields.map((f) => [f.name, f]));
    const base = `/admin/content/${resource.slug}`;
    const [tab, setTab] = useState('');
    const [busy, setBusy] = useState(null);
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState(null);   // team: Edit opens in a popup
    const popupEdit = resource.slug === 'team';
    const edit = (item) => (e) => { if (popupEdit) { e?.preventDefault?.(); setEditing(item); } };
    const columns = resource.columns.filter((c) => fields[c]?.type !== 'image' && fields[c]?.type !== 'boolean');
    const switches = resource.columns.filter((c) => fields[c]?.type === 'boolean');
    const img = resource.columns.find((c) => fields[c]?.type === 'image');
    const first = columns[0];
    const shown = tab ? items.filter((i) => String(i[resource.tabs]) === tab) : items;
    const single = resource.singular.toLowerCase();
    const viewUrl = (item) => resource.view?.replace(/\{(\w+)\}/g, (_, k) => item[k]);

    const opts = (id) => ({ preserveScroll: true, onStart: () => setBusy(id), onFinish: () => setBusy(null) });
    const remove = (item) => askDelete({ title: `Delete “${item.name || item.title || item.question || single}”?`, text: `The ${single} and its images are deleted permanently.` }).then((ok) => ok && router.delete(`${base}/${item.id}`, { preserveScroll: true }));
    const toggle = (item, f) => router.patch(`${base}/${item.id}/toggle/${f}`, {}, opts(item.id));
    const move = (item, dir) => router.patch(`${base}/${item.id}/move`, { dir }, opts(item.id));
    const duplicate = (item) => router.post(`${base}/${item.id}/duplicate`);

    return (
        <AdminLayout title={resource.label} actions={['team', 'services'].includes(resource.slug) ? <button type="button" className="a-btn primary" onClick={() => setAdding(true)}><Icon name="plus" /> Add {single}</button> : <Link className="a-btn primary" href={`${base}/create`}><Icon name="plus" /> New {single}</Link>}>

            {tabs && Object.keys(tabs).length > 1 && (
                <div className="a-chips">
                    <button className={`a-chip ${tab === '' ? 'is-active' : ''}`} onClick={() => setTab('')}>All <b>{items.length}</b></button>
                    {Object.entries(tabs).map(([k, n]) => <button key={k} className={`a-chip ${tab === k ? 'is-active' : ''}`} onClick={() => setTab(k)}>{k} <b>{n}</b></button>)}
                </div>
            )}

            {stats.length > 1 && (
                <div className="a-kpis">
                    {stats.map((s) => <div key={s.label} className="a-kpi"><small>{s.label}</small><b>{s.value}</b></div>)}
                </div>
            )}

            <div className="a-card flush">
                {items.length === 0 ? (
                    <p className="a-empty">Nothing here yet. <Link href={`${base}/create`}>Add the first {single}</Link>.</p>
                ) : (
                    <table className="a-table">
                        <thead>
                            <tr>
                                <th style={{ width: 70 }}>Order</th>
                                {columns.map((c) => <th key={c}>{c === first && img ? resource.singular : (fields[c]?.label || c)}</th>)}
                                {switches.map((c) => <th key={c}>{fields[c].label.replace('Show on home page', 'Featured')}</th>)}
                                <th style={{ width: 190 }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shown.map((item) => {
                                const pos = items.indexOf(item);
                                return (
                                    <tr key={item.id} className={busy === item.id ? 'is-busy' : ''}>
                                        <td>
                                            <div className="a-order">
                                                <button type="button" onClick={() => move(item, 'up')} disabled={pos === 0} aria-label="Move up" title="Move up"><Icon name="up" size={15} /></button>
                                                <button type="button" onClick={() => move(item, 'down')} disabled={pos === items.length - 1} aria-label="Move down" title="Move down"><Icon name="down" size={15} /></button>
                                            </div>
                                        </td>
                                        {columns.map((c) => (
                                            <td key={c}>
                                                {c === first ? (
                                                    <Link className="a-name-cell" href={`${base}/${item.id}/edit`} onClick={edit(item)}>
                                                        {img && <Cell field={fields[img]} item={item} />}
                                                        <span className="a-strong">{item[c] ?? '—'}</span>
                                                    </Link>
                                                ) : <Cell field={fields[c]} value={item[c]} item={item} />}
                                            </td>
                                        ))}
                                        {switches.map((c) => (
                                            <td key={c}>
                                                <span className="a-switch-cell">
                                                    <Switch on={item[c]} label={`${fields[c].label}: ${item[c] ? 'on' : 'off'}`} onClick={() => toggle(item, c)} disabled={busy === item.id} />
                                                    {c === 'is_published' && <small className="a-muted">{item[c] ? 'Show' : 'Hidden'}</small>}
                                                </span>
                                            </td>
                                        ))}
                                        <td className="a-row-actions">
                                            <div className="a-ibtns">
                                                {popupEdit ? <IconBtn icon="edit" label="Edit" onClick={edit(item)} /> : <IconBtn icon="edit" label="Edit" href={`${base}/${item.id}/edit`} />}
                                                {resource.view && <IconBtn icon="eye" label={item.is_published === false ? 'Hidden: publish it to view on the site' : 'View on the website'} href={viewUrl(item)} external disabled={item.is_published === false} />}
                                                <IconBtn icon="copy" label="Duplicate" onClick={() => duplicate(item)} />
                                                <IconBtn icon="trash" tone="danger" label="Delete" onClick={() => remove(item)} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
            {adding && <ResourceForm resource={resource} modal onCancel={() => setAdding(false)} />}
            {editing && <ResourceForm key={editing.id} resource={resource} item={editing} modal onCancel={() => setEditing(null)} />}
        </AdminLayout>
    );
}
