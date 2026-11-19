import { Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { FieldList, FieldRow, mediaUrl, useUnsavedWarning } from '../../../Components/Admin/Fields';
import AdminLayout, { ago, Icon, askDelete } from '../../../Layouts/AdminLayout';

const initial = (page, sections, seo, numbers = []) => ({
    title: page.title,
    slug: page.slug,
    is_published: page.is_published,
    seo: seo.values,
    sections: Object.fromEntries(sections.map((s) => [s.key, { is_enabled: s.is_enabled, content: s.content, reset: false }])),
    section_order: sections.map((s) => s.key),
    numbers: numbers.map((n) => ({ ...n })),
});

/** One page: its sections as boxes (switch on / off, edit, back to default), its SEO and its settings. */
export default function PageEdit({ page, sections, seo, numbers = [] }) {
    const [data, setData] = useState(() => initial(page, sections, seo, numbers));
    const [base, setBase] = useState(() => JSON.stringify(initial(page, sections, seo, numbers)));
    const [tab, setTab] = useState('sections');
    const [open, setOpen] = useState(() => (sections.length ? [sections[0].key] : []));
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [filter, setFilter] = useState('');

    // after a save the server sends fresh props: start again from them
    useEffect(() => { const i = initial(page, sections, seo, numbers); setData(i); setBase(JSON.stringify(i)); }, [page.updated_at]);

    const dirty = JSON.stringify(data) !== base;
    useUnsavedWarning(dirty);

    const setSec = (key, patch) => setData((d) => ({ ...d, sections: { ...d.sections, [key]: { ...d.sections[key], ...patch } } }));
    const setField = (key, name, v) => setData((d) => ({ ...d, sections: { ...d.sections, [key]: { ...d.sections[key], reset: false, content: { ...d.sections[key].content, [name]: v } } } }));
    const moveSection = (key, direction) => setData((d) => {
        const index = d.section_order.indexOf(key);
        const nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || nextIndex >= d.section_order.length) return d;
        const section_order = [...d.section_order];
        [section_order[index], section_order[nextIndex]] = [section_order[nextIndex], section_order[index]];
        return { ...d, section_order };
    });
    const resetSec = (s) => confirm(`Put "${s.label}" back to its original texts and images?`) && setSec(s.key, { content: s.defaults, reset: true });

    const save = () => {
        setSaving(true);
        const original = JSON.parse(base);
        const changedSections = Object.fromEntries(Object.entries(data.sections).flatMap(([key, section]) => {
            const previous = original.sections[key];
            const content = Object.fromEntries(Object.entries(section.content).filter(([field, value]) => JSON.stringify(value) !== JSON.stringify(previous?.content?.[field])));
            const changed = section.is_enabled !== previous?.is_enabled || section.reset || Object.keys(content).length > 0;
            return changed ? [[key, { is_enabled: section.is_enabled, reset: section.reset, content }]] : [];
        }));
        const payload = { ...data, sections: changedSections };
        if (JSON.stringify(data.section_order) === JSON.stringify(original.section_order)) delete payload.section_order;
        if (JSON.stringify(data.numbers) === JSON.stringify(original.numbers)) delete payload.numbers;
        router.put(`/admin/pages/${page.id}`, payload, {
            preserveScroll: true,
            onError: (e) => { setErrors(e); if (e.title || e.slug) setTab('settings'); },
            onSuccess: (response) => {
                setErrors({});
                const next = initial(response.props.page, response.props.sections, response.props.seo, response.props.numbers);
                setData(next);
                setBase(JSON.stringify(next));
            },
            onFinish: () => setSaving(false),
        });
    };
    useEffect(() => {
        const k = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); if (dirty && !saving) save(); } };
        addEventListener('keydown', k);
        return () => removeEventListener('keydown', k);
    });

    const onCount = Object.values(data.sections).filter((s) => s.is_enabled).length;
    const shown = useMemo(() => sections.filter((s) => !filter || (s.label + ' ' + (s.description || '')).toLowerCase().includes(filter.toLowerCase())), [sections, filter]);
    const viewHref = page.template === 'project' ? page.path : page.path;

    const actions = (
        <>
            <a className="a-btn ghost" href={viewHref} target="_blank" rel="noopener"><Icon name="eye" /> View</a>
            <button className="a-btn primary" disabled={!dirty || saving} onClick={save}>{saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}</button>
        </>
    );

    return (
        <AdminLayout title={data.title || page.title} actions={actions}>
            <div className="a-editor-head">
                <Link href="/admin/pages" className="a-back" aria-label="Back to pages">←</Link>
                {dirty && <span className="a-dirty">● Unsaved changes</span>}
            </div>

            <div className="a-tabs a-tabs-lg">
                <button className={tab === 'sections' ? 'is-active' : ''} onClick={() => setTab('sections')}><Icon name="layers" size={16} /> Sections <em>{onCount}/{sections.length}</em></button>
                <button className={tab === 'seo' ? 'is-active' : ''} onClick={() => setTab('seo')}><Icon name="globe" size={16} /> SEO</button>
                <button className={tab === 'settings' ? 'is-active' : ''} onClick={() => setTab('settings')}><Icon name="settings" size={16} /> Page settings</button>
            </div>

            {tab === 'sections' && (
                <>
                    <div className="a-sec-tools">
                        <input type="search" className="a-input" placeholder="Find a section" value={filter} onChange={(e) => setFilter(e.target.value)} />
                    </div>
                    <div className="a-secs">
                        {shown.slice().sort((a, b) => data.section_order.indexOf(a.key) - data.section_order.indexOf(b.key)).map((s) => {
                            const st = data.sections[s.key];
                            const isOpen = open.includes(s.key);
                            const edited = st.reset ? false : s.customised || JSON.stringify(st.content) !== JSON.stringify(s.content);
                            const hasNumbersWidget = (page.slug === 'home' && s.key === 'numbers') || (page.slug === 'about' && s.key === 'stats');
                            const isHomeNumbersWidget = page.slug === 'home' && s.key === 'numbers';
                            const fields = (isHomeNumbersWidget ? s.fields.filter((field) => field.name !== 'images') : s.fields).map((field) =>
                                page.slug === 'services' && s.key === 'cta' && field.name === 'badge_text' ? { ...field, warnIfEmpty: true } : field);
                            const sectionIndex = data.section_order.indexOf(s.key);
                            return (
                                <div key={s.key} className={`a-sec ${st.is_enabled ? '' : 'is-off'} ${isOpen ? 'is-open' : ''}`}>
                                    <div className="a-sec-head" onClick={() => setOpen((o) => (o.includes(s.key) ? o.filter((k) => k !== s.key) : [...o, s.key]))}>
                                        <span className="a-sec-n">{String(sectionIndex + 1).padStart(2, '0')}</span>
                                        <div className="a-sec-title">
                                            <b>{s.label}</b>
                                            {s.description && <small>{s.description}</small>}
                                        </div>
                                        <div className="a-sec-meta" onClick={(e) => e.stopPropagation()}>
                                            <button type="button" className="a-icon-btn" title="Move up" aria-label={`Move ${s.label} up`} disabled={sectionIndex <= 0} onClick={() => moveSection(s.key, -1)}><Icon name="up" size={15} /></button>
                                            <button type="button" className="a-icon-btn" title="Move down" aria-label={`Move ${s.label} down`} disabled={sectionIndex === data.section_order.length - 1} onClick={() => moveSection(s.key, 1)}><Icon name="down" size={15} /></button>
                                            {edited && <span className="a-pill gold" title={s.updated_at ? `Saved ${ago(s.updated_at)}` : 'Not saved yet'}>Edited</span>}
                                            {!st.is_enabled && <span className="a-pill off">Hidden</span>}
                                            {s.source && <Link className="a-btn sm ghost" href={s.source.href}>{s.source.label} &rarr;</Link>}
                                            {s.toggle ? (
                                                <button type="button" role="switch" aria-checked={st.is_enabled} title={st.is_enabled ? 'Shown on the website (click to hide)' : 'Hidden (click to show)'}
                                                    className={`a-switch ${st.is_enabled ? 'on' : ''}`} onClick={() => setSec(s.key, { is_enabled: !st.is_enabled })}><i /></button>
                                            ) : <span className="a-muted sm" title="This section holds the page together and is always shown">Always on</span>}
                                        </div>
                                        <span className="a-sec-chev"><Icon name="chevron" /></span>
                                    </div>
                                    {isOpen && (
                                        <div className="a-sec-body">
                                            {s.fields.length ? (
                                                <FieldList fields={fields} values={st.content} defaults={s.defaults} onChange={(name, v) => setField(s.key, name, v)} />
                                            ) : !hasNumbersWidget ? (
                                                <p className="a-muted" style={{ margin: 0 }}>This section has no texts of its own{s.source ? <> - its items are managed under <Link className="a-strong" href={s.source.href}>{s.source.label}</Link></> : ''}. Use the switch to show or hide it.</p>
                                            ) : null}
                                            {hasNumbersWidget && <NumbersWidget page={page.slug} numbers={data.numbers} onChange={(next) => setData((d) => ({ ...d, numbers: next }))} errors={errors}
                                                images={isHomeNumbersWidget ? st.content.images : null}
                                                imageField={isHomeNumbersWidget ? s.fields.find((field) => field.name === 'images')?.fields?.[0] : null}
                                                imageDefaults={isHomeNumbersWidget ? s.defaults.images : null}
                                                onImagesChange={isHomeNumbersWidget ? (next) => setField(s.key, 'images', next) : null} />}
                                            {s.fields.length > 0 && (
                                                <div className="a-sec-foot">
                                                    <span className="a-muted sm">{st.reset ? 'Will go back to the original on save' : s.updated_at && s.customised ? `Last saved ${ago(s.updated_at)}` : 'Showing the original content'}</span>
                                                    <button type="button" className="a-btn sm ghost" onClick={() => resetSec(s)}><Icon name="reset" size={15} /> Reset to original</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {shown.length === 0 && <p className="a-empty">No section matches.</p>}
                    </div>
                </>
            )}

            {tab === 'seo' && <SeoTab seo={seo} data={data} setData={setData} page={page} />}

            {tab === 'settings' && (
                <div className="a-card">
                    <div className="a-form-grid">
                        <label className="a-field half"><span>Page name</span><input value={data.title} onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))} />{errors.title && <small className="a-error">{errors.title}</small>}<small className="a-muted">Used in the admin, and as the SEO title when that is empty.</small></label>
                        <label className="a-field half"><span>URL</span>
                            {page.is_system
                                ? <><input value={page.template === 'project' ? '/projects/{project}' : page.pattern} disabled /><small className="a-muted">The site's own pages keep their address.</small></>
                                : <><div className="a-prefix"><em>/</em><input value={data.slug} onChange={(e) => setData((d) => ({ ...d, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} /></div>{errors.slug && <small className="a-error">{errors.slug}</small>}</>}
                        </label>
                        <div className="a-field half inline">
                            <span>Published</span>
                            <button type="button" role="switch" aria-checked={data.is_published} disabled={page.slug === 'home' || page.slug === 'not-found'} className={`a-switch ${data.is_published ? 'on' : ''}`} onClick={() => setData((d) => ({ ...d, is_published: !d.is_published }))}><i /></button>
                            <small className="a-muted">{page.slug === 'home' ? 'The home page is always published.' : page.slug === 'not-found' ? 'The 404 page is always published: it is shown for every address that does not exist.' : 'Drafts are only visible to signed-in admins.'}</small>
                        </div>
                        <div className="a-field half"><span>Design</span><input value={page.template_label} disabled /><small className="a-muted">Copies keep the design of the page they were made from.</small></div>
                    </div>
                    <div className="a-form-foot" style={{ justifyContent: 'flex-start' }}>
                        {page.duplicable && <button className="a-btn" onClick={() => router.post(`/admin/pages/${page.id}/duplicate`)}><Icon name="copy" /> Duplicate this page</button>}
                        {!page.is_system && <button className="a-btn danger" onClick={() => askDelete({ title: `Delete “${page.title}”?`, text: 'The page and its sections are deleted permanently.' }).then((ok) => ok && router.delete(`/admin/pages/${page.id}`))}><Icon name="trash" /> Delete page</button>}
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

function NumbersWidget({ page, numbers, onChange, errors, images = [], imageField, imageDefaults = [], onImagesChange }) {
    const update = (index, key, value) => onChange(numbers.map((number, i) => i === index ? { ...number, [key]: value } : number));
    const move = (index, direction) => {
        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= numbers.length) return;
        const next = [...numbers];
        [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
        onChange(next);
        if (page === 'home' && onImagesChange) {
            const nextImages = [...images];
            if (index < nextImages.length && nextIndex < nextImages.length) {
                [nextImages[index], nextImages[nextIndex]] = [nextImages[nextIndex], nextImages[index]];
                onImagesChange(nextImages);
            }
        }
    };

    return (
        <div className="a-number-widget">
            <div className="a-number-widget-head">
                <div><b>Numbers shown on the {page === 'home' ? 'landing page' : 'About page'}</b><small>These values update the matching figures on the website.</small></div>
                {(page !== 'home' || numbers.length < 4) && <button type="button" className="a-btn sm ghost" onClick={() => { onChange([...numbers, { id: null, value: '', suffix: '', label: '' }]); if (page === 'home' && onImagesChange && images.length < numbers.length + 1) onImagesChange([...images, { image: null }]); }}><Icon name="plus" size={15} /> Add number</button>}
            </div>
            {numbers.map((number, index) => (
                <div className={`a-number-row ${page === 'home' ? 'a-home-number-row' : ''}`} key={number.id || `new-${index}`}>
                    {page === 'home' && <div className="a-number-preview">
                        {mediaUrl(images[index]?.image || imageDefaults[index]?.image) ? <img src={mediaUrl(images[index]?.image || imageDefaults[index]?.image)} alt="" /> : <span className="a-number-preview-empty">Choose a photo</span>}
                        <div className="a-number-preview-copy"><b>{number.value || '0'}{number.suffix || ''}</b><small>{number.label || 'Number label'}</small></div>
                    </div>}
                    <div className={`a-number-fields ${page === 'home' ? 'a-home-number-fields' : ''}`}>
                        <label className="a-field"><span>Value</span><input type="number" min="0" value={number.value ?? ''} onChange={(e) => update(index, 'value', e.target.value === '' ? '' : Number(e.target.value))} />{errors[`numbers.${index}.value`] && <small className="a-error">{errors[`numbers.${index}.value`]}</small>}</label>
                        <label className="a-field"><span>Suffix</span><input maxLength={8} value={number.suffix || ''} onChange={(e) => update(index, 'suffix', e.target.value)} placeholder="e.g. +" /></label>
                        <label className="a-field"><span>Label</span><input maxLength={120} value={number.label || ''} onChange={(e) => update(index, 'label', e.target.value)} placeholder="Number label" />{errors[`numbers.${index}.label`] && <small className="a-error">{errors[`numbers.${index}.label`]}</small>}</label>
                        {page === 'home' && imageField && <div className="a-number-image-edit"><FieldRow field={imageField} value={images[index]?.image ?? null} def={imageDefaults[index]?.image ?? null} onChange={(value) => { const next = [...images]; next[index] = { ...(next[index] || {}), image: value }; onImagesChange(next); }} /></div>}
                    </div>
                    <div className="a-number-actions">
                        <button type="button" className="a-icon-btn" title="Move up" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}><Icon name="up" size={15} /></button>
                        <button type="button" className="a-icon-btn" title="Move down" aria-label="Move down" disabled={index === numbers.length - 1} onClick={() => move(index, 1)}><Icon name="down" size={15} /></button>
                        <button type="button" className="a-icon-btn danger" title="Remove number" aria-label="Remove number" onClick={() => { onChange(numbers.filter((_, i) => i !== index)); if (page === 'home' && onImagesChange) onImagesChange(images.filter((_, i) => i !== index)); }}><Icon name="trash" size={15} /></button>
                    </div>
                </div>
            ))}
            {numbers.length === 0 && <p className="a-empty">No numbers yet. Add one to show it on this page.</p>}
        </div>
    );
}

function SeoTab({ seo, data, setData, page }) {
    const v = data.seo;
    const title = v.title || seo.defaults.title || page.title;
    const desc = v.description || seo.defaults.description || '';
    const host = typeof window !== 'undefined' ? window.location.host : '';
    const path = page.template === 'project' ? page.path : page.pattern;
    const fields = seo.fields.map((f) => (f.name === 'title' ? { ...f, help: `${f.help} Empty = "${seo.defaults.title || page.title}".` } : f.name === 'description' && seo.defaults.description ? { ...f, help: `${f.help} Empty = the page's standard description.` } : f));
    return (
        <div className="a-split wide">
            <div className="a-card">
                <div className="a-card-head"><h2>Search & sharing</h2></div>
                <FieldList fields={fields} values={v} onChange={(k, x) => setData((d) => ({ ...d, seo: { ...d.seo, [k]: x } }))} />
                <div className="a-counters">
                    <span className={title.length > 60 ? 'warn' : ''}>Title: {title.length}/60</span>
                    <span className={desc.length > 160 || (desc.length > 0 && desc.length < 70) ? 'warn' : ''}>Description: {desc.length}/160</span>
                </div>
            </div>
            <div className="a-card">
                <div className="a-card-head"><h2>Google preview</h2></div>
                <div className="a-serp">
                    <small>{host}{path}</small>
                    <b>{title.replace(/\{name\}/g, 'PTI Shopno Tower-1')} — PTI Development</b>
                    <p>{desc.replace(/\{name\}/g, 'PTI Shopno Tower-1').replace(/\{units\}/g, '60').replace(/\{area\}/g, 'ECB Chattar') || <span className="a-muted">No description yet.</span>}</p>
                </div>
                {v.image && <><div className="a-card-head" style={{ marginTop: 22 }}><h2>Share preview</h2></div><div className="a-share-card"><img src={mediaUrl(v.image)} alt="" /><b>{title}</b><small>{host}</small></div></>}
                {v.noindex && <p className="a-error" style={{ marginTop: 16 }}>This page is hidden from search engines.</p>}
            </div>
        </div>
    );
}
