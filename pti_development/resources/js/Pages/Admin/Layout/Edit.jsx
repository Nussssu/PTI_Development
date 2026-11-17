import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { FieldList, useUnsavedWarning } from '../../../Components/Admin/Fields';
import AdminLayout, { ago, Icon } from '../../../Layouts/AdminLayout';

/** Header & Footer: two tabs, each its own form (one header and one footer for the whole site). */
export default function LayoutEdit({ blocks }) {
    const [tab, setTab] = useState(blocks[0]?.key || 'header');
    const [values, setValues] = useState(() => Object.fromEntries(blocks.map((b) => [b.key, b.values])));
    const [base, setBase] = useState(() => JSON.stringify(Object.fromEntries(blocks.map((b) => [b.key, b.values]))));
    const [saving, setSaving] = useState(false);
    const stamp = blocks.map((b) => b.updated_at).join();
    useEffect(() => { const v = Object.fromEntries(blocks.map((b) => [b.key, b.values])); setValues(v); setBase(JSON.stringify(v)); }, [stamp]);

    const b = blocks.find((x) => x.key === tab);
    const baseObj = JSON.parse(base);
    const dirtyOf = (k) => JSON.stringify(values[k]) !== JSON.stringify(baseObj[k]);
    useUnsavedWarning(blocks.some((x) => dirtyOf(x.key)));

    const save = (reset = false) => {
        setSaving(true);
        router.put(`/admin/layout/${tab}`, { values: values[tab], reset }, { preserveScroll: true, onFinish: () => setSaving(false) });
    };

    return (
        <AdminLayout title="Header & Footer" actions={
            <>
                <a className="a-btn ghost" href="/" target="_blank" rel="noopener"><Icon name="eye" /> View website</a>
                <button className="a-btn primary" disabled={!dirtyOf(tab) || saving} onClick={() => save(false)}>{saving ? 'Saving…' : dirtyOf(tab) ? `Save ${b.label.toLowerCase()}` : 'Saved'}</button>
            </>
        }>
            <div className="a-tabs a-tabs-lg">
                {blocks.map((x) => (
                    <button key={x.key} className={tab === x.key ? 'is-active' : ''} onClick={() => setTab(x.key)}>
                        <Icon name={x.key === 'header' ? 'layout' : 'layers'} size={16} /> {x.label}{dirtyOf(x.key) && <em className="a-dot">●</em>}
                    </button>
                ))}
            </div>
            <div className="a-card">
                <div className="a-card-head">
                    <div><h2>{b.label}</h2>{b.description && <p className="a-muted" style={{ margin: '4px 0 0' }}>{b.description}</p>}</div>
                    <span className="a-muted sm">{b.updated_at ? `Saved ${ago(b.updated_at)}${b.editor ? ` by ${b.editor}` : ''}` : 'Showing the original'}</span>
                </div>
                <FieldList fields={b.fields.map((f) => (f.type === 'repeater' ? { ...f, openFirst: true } : f))} values={values[tab]} defaults={b.defaults} onChange={(k, v) => setValues((s) => ({ ...s, [tab]: { ...s[tab], [k]: v } }))} />
                <div className="a-form-foot">
                    <button type="button" className="a-btn ghost" onClick={() => confirm(`Put the ${b.label.toLowerCase()} back to the original?`) && save(true)}><Icon name="reset" size={15} /> Reset to original</button>
                    <button className="a-btn primary" disabled={!dirtyOf(tab) || saving} onClick={() => save(false)}>{saving ? 'Saving…' : `Save ${b.label.toLowerCase()}`}</button>
                </div>
            </div>
        </AdminLayout>
    );
}
