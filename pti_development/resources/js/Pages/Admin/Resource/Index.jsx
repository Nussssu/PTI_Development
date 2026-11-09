import { Link, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';

function Cell({ field, value, item }) {
    if (!field) return value;
    if (field.type === 'image') {
        const url = item[`${field.name}_url`];
        return url ? <img className="a-thumb" src={url} alt="" /> : <span className="a-thumb empty" />;
    }
    if (field.type === 'boolean') return <span className={`a-pill ${value ? 'on' : 'off'}`}>{value ? 'Yes' : 'No'}</span>;
    if (field.type === 'textarea' || (typeof value === 'string' && value.length > 80)) return <span className="a-clip">{value}</span>;
    return value ?? '—';
}

export default function ResourceIndex({ resource, items }) {
    const fields = Object.fromEntries(resource.fields.map((f) => [f.name, f]));
    const base = `/admin/content/${resource.slug}`;
    const first = resource.columns.find((c) => fields[c]?.type !== 'image');

    const remove = (item) => {
        if (confirm(`Delete this ${resource.singular.toLowerCase()}? This cannot be undone.`)) {
            router.delete(`${base}/${item.id}`, { preserveScroll: true });
        }
    };

    return (
        <AdminLayout title={resource.label} actions={<Link className="a-btn primary" href={`${base}/create`}>+ Add {resource.singular.toLowerCase()}</Link>}>
            <div className="a-card flush">
                {items.length === 0 ? (
                    <p className="a-empty">Nothing here yet. <Link href={`${base}/create`}>Add the first {resource.singular.toLowerCase()}</Link>.</p>
                ) : (
                    <table className="a-table">
                        <thead>
                            <tr>
                                {resource.columns.map((c) => <th key={c}>{fields[c]?.type === 'image' ? '' : (fields[c]?.label || c)}</th>)}
                                <th style={{ width: 150 }} />
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id}>
                                    {resource.columns.map((c) => (
                                        <td key={c} className={fields[c]?.type === 'image' ? 'a-td-img' : ''}>
                                            {c === first ? <Link className="a-strong" href={`${base}/${item.id}/edit`}><Cell field={fields[c]} value={item[c]} item={item} /></Link> : <Cell field={fields[c]} value={item[c]} item={item} />}
                                        </td>
                                    ))}
                                    <td className="a-row-actions">
                                        {resource.slug === 'projects' && <a className="a-btn ghost sm" href={`/projects/${item.slug}`} target="_blank" rel="noopener">View</a>}
                                        <Link className="a-btn sm" href={`${base}/${item.id}/edit`}>Edit</Link>
                                        <button className="a-btn danger sm" onClick={() => remove(item)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </AdminLayout>
    );
}
