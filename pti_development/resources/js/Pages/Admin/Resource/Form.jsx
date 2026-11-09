import { Link, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';

function initialData(fields, item) {
    const data = {};
    fields.forEach((f) => {
        const v = item ? item[f.name] : undefined;
        switch (f.type) {
            case 'image': data[f.name] = null; data[`${f.name}_remove`] = false; break;
            case 'gallery': data[f.name] = v || []; data[`${f.name}_new`] = []; break;
            case 'list': data[f.name] = v && v.length ? v : ['']; break;
            case 'features': data[f.name] = v && v.length ? v : [{ label: '', value: '' }]; break;
            case 'boolean': data[f.name] = item ? !!v : true; break;
            case 'select': data[f.name] = v ?? f.options[0]; break;
            case 'number': data[f.name] = v ?? (f.name === 'sort_order' ? 0 : ''); break;
            default: data[f.name] = v ?? '';
        }
    });
    return data;
}

function ImageInput({ field, form, item }) {
    const file = form.data[field.name];
    const removed = form.data[`${field.name}_remove`];
    const existing = item?.[`${field.name}_url`];
    const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
    useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);
    const shown = preview || (!removed && existing);

    return (
        <div className="a-image">
            <div className="a-image-preview">{shown ? <img src={shown} alt="" /> : <span>No image</span>}</div>
            <div className="a-image-actions">
                <label className="a-btn sm">
                    {shown ? 'Replace' : 'Upload'}
                    <input type="file" accept="image/*" hidden onChange={(e) => { form.setData((d) => ({ ...d, [field.name]: e.target.files[0] || null, [`${field.name}_remove`]: false })); }} />
                </label>
                {shown && (
                    <button type="button" className="a-btn ghost sm" onClick={() => form.setData((d) => ({ ...d, [field.name]: null, [`${field.name}_remove`]: true }))}>Remove</button>
                )}
                <small className="a-muted">JPG, PNG, WEBP or SVG · max 5 MB</small>
            </div>
        </div>
    );
}

function GalleryInput({ field, form, item }) {
    const kept = form.data[field.name];
    const added = form.data[`${field.name}_new`];
    const urlFor = (path) => {
        const i = (item?.[field.name] || []).indexOf(path);
        return i >= 0 ? item.gallery_urls[i] : null;
    };
    const previews = useMemo(() => added.map((f) => URL.createObjectURL(f)), [added]);
    useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

    return (
        <div className="a-gallery">
            {kept.map((p) => (
                <div className="a-gallery-item" key={p}>
                    <img src={urlFor(p)} alt="" />
                    <button type="button" aria-label="Remove" onClick={() => form.setData(field.name, kept.filter((x) => x !== p))}>✕</button>
                </div>
            ))}
            {previews.map((src, i) => (
                <div className="a-gallery-item new" key={src}>
                    <img src={src} alt="" />
                    <button type="button" aria-label="Remove" onClick={() => form.setData(`${field.name}_new`, added.filter((_, k) => k !== i))}>✕</button>
                </div>
            ))}
            <label className="a-gallery-add">
                + Add images
                <input type="file" accept="image/*" multiple hidden onChange={(e) => form.setData(`${field.name}_new`, [...added, ...Array.from(e.target.files)])} />
            </label>
        </div>
    );
}

function ListInput({ field, form }) {
    const list = form.data[field.name];
    const set = (v) => form.setData(field.name, v);
    return (
        <div className="a-list">
            {list.map((v, i) => (
                <div className="a-list-row" key={i}>
                    <input value={v} onChange={(e) => set(list.map((x, k) => (k === i ? e.target.value : x)))} placeholder={`Item ${i + 1}`} />
                    <button type="button" className="a-icon-btn" aria-label="Remove" onClick={() => set(list.length > 1 ? list.filter((_, k) => k !== i) : [''])}>✕</button>
                </div>
            ))}
            <button type="button" className="a-btn ghost sm" onClick={() => set([...list, ''])}>+ Add item</button>
        </div>
    );
}

function FeaturesInput({ field, form }) {
    const rows = form.data[field.name];
    const set = (v) => form.setData(field.name, v);
    const upd = (i, k, val) => set(rows.map((r, j) => (j === i ? { ...r, [k]: val } : r)));
    return (
        <div className="a-list">
            {rows.map((r, i) => (
                <div className="a-list-row two" key={i}>
                    <input value={r.label} onChange={(e) => upd(i, 'label', e.target.value)} placeholder="Label, e.g. Floors" />
                    <input value={r.value} onChange={(e) => upd(i, 'value', e.target.value)} placeholder="Value, e.g. G+10" />
                    <button type="button" className="a-icon-btn" aria-label="Remove" onClick={() => set(rows.length > 1 ? rows.filter((_, k) => k !== i) : [{ label: '', value: '' }])}>✕</button>
                </div>
            ))}
            <button type="button" className="a-btn ghost sm" onClick={() => set([...rows, { label: '', value: '' }])}>+ Add feature</button>
        </div>
    );
}

function FieldInput({ field, form, item }) {
    const v = form.data[field.name];
    const set = (e) => form.setData(field.name, e.target.value);
    switch (field.type) {
        case 'textarea': return <textarea rows={6} value={v} onChange={set} />;
        case 'number': return <input type="number" min="0" value={v} onChange={set} />;
        case 'select': return <select value={v} onChange={set}>{field.options.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
        case 'boolean': return (
            <button type="button" role="switch" aria-checked={v} className={`a-switch ${v ? 'on' : ''}`} onClick={() => form.setData(field.name, !v)}><i /></button>
        );
        case 'image': return <ImageInput field={field} form={form} item={item} />;
        case 'gallery': return <GalleryInput field={field} form={form} item={item} />;
        case 'list': return <ListInput field={field} form={form} />;
        case 'features': return <FeaturesInput field={field} form={form} />;
        default: return <input type="text" value={v} onChange={set} />;
    }
}

export default function ResourceForm({ resource, item }) {
    const base = `/admin/content/${resource.slug}`;
    const form = useForm(initialData(resource.fields, item));
    const [dirty, setDirty] = useState(false);
    useEffect(() => { if (form.isDirty) setDirty(true); }, [form.isDirty]);

    const submit = (e) => {
        e.preventDefault();
        if (item) {
            form.transform((d) => ({ ...d, _method: 'put' }));
            form.post(`${base}/${item.id}`, { forceFormData: true, preserveScroll: true });
        } else {
            form.post(base, { forceFormData: true, preserveScroll: true });
        }
    };

    const errorFor = (name) => form.errors[name] || Object.entries(form.errors).find(([k]) => k.startsWith(name + '.'))?.[1];
    const title = item ? `Edit ${resource.singular.toLowerCase()}` : `New ${resource.singular.toLowerCase()}`;

    return (
        <AdminLayout title={title} actions={<Link className="a-btn ghost" href={base}>← Back to {resource.label.toLowerCase()}</Link>}>
            <form className="a-card a-form" onSubmit={submit}>
                <div className="a-form-grid">
                    {resource.fields.map((f) => (
                        <div key={f.name} className={`a-field ${f.half ? 'half' : ''} ${f.type === 'boolean' ? 'inline' : ''}`}>
                            <span>{f.label}</span>
                            <FieldInput field={f} form={form} item={item} />
                            {f.help && <small className="a-muted">{f.help}</small>}
                            {errorFor(f.name) && <small className="a-error">{errorFor(f.name)}</small>}
                            {f.type === 'gallery' && errorFor(`${f.name}_new`) && <small className="a-error">{errorFor(`${f.name}_new`)}</small>}
                        </div>
                    ))}
                </div>
                <div className="a-form-foot">
                    {form.progress && <progress value={form.progress.percentage} max="100" />}
                    {dirty && !form.processing && <span className="a-muted">Unsaved changes</span>}
                    <Link className="a-btn ghost" href={base}>Cancel</Link>
                    <button className="a-btn primary" disabled={form.processing}>{form.processing ? 'Saving…' : item ? 'Save changes' : `Create ${resource.singular.toLowerCase()}`}</button>
                </div>
            </form>
        </AdminLayout>
    );
}
