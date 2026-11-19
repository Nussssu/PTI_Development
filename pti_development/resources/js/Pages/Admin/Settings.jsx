import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AdminLayout, { Icon, Switch } from '../../Layouts/AdminLayout';
import { FieldRow } from '../../Components/Admin/Fields';

/* Site settings: tabs (General / Social links) with collapsible cards and one save bar for everything.
   Logos only here (header badge, loading screen, browser tab, footer, emails); the header and footer texts and
   links stay under Menus. The header badge and footer logos are the same values as under Menus. */

const TABS = [['general', 'General'], ['social', 'Social links']];
const LEGACY_SOCIAL = ['facebook', 'instagram', 'linkedin', 'whatsapp'];
const SOCIAL_NETWORKS = { facebook: 'Facebook', instagram: 'Instagram', linkedin: 'LinkedIn', youtube: 'YouTube', whatsapp: 'WhatsApp', custom: 'Other' };

const HEADER_LOGOS = [
    { name: 'header_logo', label: 'Header badge logo', placeholder: { src: '/images/pti-mark-white.svg', label: 'Built-in PTI mark' }, help: 'In the middle of the round badge, top left on every page. Empty = the PTI mark.', dark: true },
    { name: 'logo_preloader', label: 'Loading screen logo', placeholder: { src: '/images/pti-mark-white.svg', label: 'Built-in PTI mark' }, help: 'Shown while a page loads. Empty = the PTI mark.', dark: true },
    { name: 'logo_favicon', label: 'Favicon (browser tab icon)', help: 'A square image or SVG works best.', dark: true },
];
const FOOTER_LOGOS = [
    { name: 'footer_logo', label: 'Footer logo', help: 'At the top of the footer on every page.', dark: true },
    { name: 'logo_email', label: 'Email logo', help: 'At the top of every email the site sends (PNG or JPG).', dark: true },
];

function Section({ icon, title, chip, text, open, onToggle, children }) {
    return (
        <section className={`a-set ${open ? 'is-open' : ''}`}>
            <button type="button" className="a-set-head" onClick={onToggle} aria-expanded={open}>
                <span className="a-set-ico"><Icon name={icon} size={18} /></span>
                <span className="a-set-titles">
                    <span className="a-set-title">{title}{chip && <em className="a-set-chip">{chip}</em>}</span>
                    <span className="a-set-text">{text}</span>
                </span>
                <span className="a-set-toggle">{open ? 'Collapse' : 'Expand'}<i><Icon name="down" size={15} /></i></span>
            </button>
            {open && <div className="a-set-body">{children}</div>}
        </section>
    );
}

function LogoGrid({ items, form, defaults }) {
    return (
        <div className="a-logo-grid">
            {items.map((f) => (
                <div key={f.name} className={`a-logo-cell ${f.dark ? 'dark' : ''}`}>
                    <FieldRow field={{ name: f.name, label: f.label, type: 'image', help: f.help, placeholder: f.placeholder }} value={form.data[f.name] || null}
                        def={defaults[f.name] ?? undefined} onChange={(v) => form.setData(f.name, v)} />
                    {form.errors[f.name] && <small className="a-error">{form.errors[f.name]}</small>}
                </div>
            ))}
        </div>
    );
}

export default function Settings({ fields, values, logoDefaults = {}, socials = [], whatsappMore = [] }) {
    const form = useForm({ ...values, socials, whatsapp_more: whatsappMore });
    const [tab, setTab] = useState(() => {
        const h = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
        return TABS.some(([k]) => k === h) ? h : 'general';
    });
    const [open, setOpen] = useState({ info: true, header: false, footer: false });
    useEffect(() => { history.replaceState(null, '', `#${tab}`); }, [tab]);
    // a failed save opens the card that holds the error
    useEffect(() => {
        const keys = Object.keys(form.errors);
        if (!keys.length) return;
        if (keys.some((k) => LEGACY_SOCIAL.includes(k) || k.startsWith('socials.') || k.startsWith('whatsapp_more'))) setTab('social');
        else setTab('general');
        setOpen((o) => ({
            info: o.info || keys.some((k) => fields.some((f) => f.name === k) && !LEGACY_SOCIAL.includes(k)),
            header: o.header || keys.some((k) => HEADER_LOGOS.some((f) => f.name === k)),
            footer: o.footer || keys.some((k) => FOOTER_LOGOS.some((f) => f.name === k)),
        }));
    }, [form.errors]);

    const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
    const input = (f) => (
        <label key={f.name} className={`a-field ${['address_long', 'address'].includes(f.name) ? '' : 'half'}`}>
            <span>{f.label}</span>
            <input value={form.data[f.name] || ''} onChange={(e) => form.setData(f.name, e.target.value)} />
            {form.errors[f.name] && <small className="a-error">{form.errors[f.name]}</small>}
        </label>
    );
    const save = (e) => { e.preventDefault(); form.put('/admin/settings', { preserveScroll: true }); };

    return (
        <AdminLayout title="Settings">
            <form className="a-settings" onSubmit={save}>
                <header className="a-settings-head">
                    <h2>Site settings</h2>
                    <p className="a-muted">Site-wide details, social links and every logo on the website. Page content is edited under Pages; the header and footer links under Menus.</p>
                </header>

                <nav className="a-settings-tabs" role="tablist">
                    {TABS.map(([k, l]) => (
                        <button type="button" role="tab" key={k} aria-selected={tab === k} className={tab === k ? 'is-active' : ''} onClick={() => setTab(k)}>{l}</button>
                    ))}
                </nav>

                {tab === 'general' && (
                    <div className="a-set-list">
                        <Section icon="globe" title="General / Site info" chip="Default open" text="Company name, tagline, contact details and the office address."
                            open={open.info} onToggle={() => toggle('info')}>
                            <div className="a-form-grid">{fields.filter((f) => !LEGACY_SOCIAL.includes(f.name)).map(input)}</div>
                        </Section>
                        <Section icon="layout" title="Header & branding" chip="Logos" text="Header badge logo, loading screen logo and the browser tab icon."
                            open={open.header} onToggle={() => toggle('header')}>
                            <LogoGrid items={HEADER_LOGOS} form={form} defaults={logoDefaults} />
                        </Section>
                        <Section icon="layers" title="Footer branding" chip="Footer" text="Footer logo and the logo on top of every email. Footer texts and links are under Menus."
                            open={open.footer} onToggle={() => toggle('footer')}>
                            <LogoGrid items={FOOTER_LOGOS} form={form} defaults={logoDefaults} />
                        </Section>
                    </div>
                )}

                {tab === 'social' && (
                    <div className="a-set-list">
                        <section className="a-set is-open is-static">
                            <div className="a-set-head">
                                <span className="a-set-ico"><Icon name="link" size={18} /></span>
                                <span className="a-set-titles">
                                    <span className="a-set-title">Social links</span>
                                    <span className="a-set-text">Profiles and the WhatsApp numbers used across the site.</span>
                                </span>
                            </div>
                            <div className="a-set-body">
                                <div className="a-social-list">
                                    {(form.data.socials || []).map((item, index) => (
                                        <div className="a-social-row" key={index}>
                                            <div className="a-social-fields">
                                                <label className="a-field"><span>Platform</span><select value={item.network || 'custom'} onChange={(e) => form.setData('socials', form.data.socials.map((x, i) => i === index ? { ...x, network: e.target.value, label: e.target.value === 'custom' ? (x.label || '') : SOCIAL_NETWORKS[e.target.value] } : x))}>{Object.entries(SOCIAL_NETWORKS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>{form.errors[`socials.${index}.network`] && <small className="a-error">{form.errors[`socials.${index}.network`]}</small>}</label>
                                                <label className="a-field"><span>Display name</span><input value={item.label || SOCIAL_NETWORKS[item.network] || ''} onChange={(e) => form.setData('socials', form.data.socials.map((x, i) => i === index ? { ...x, label: e.target.value } : x))} placeholder="e.g. YouTube" />{form.errors[`socials.${index}.label`] && <small className="a-error">{form.errors[`socials.${index}.label`]}</small>}</label>
                                                <label className="a-field"><span>URL</span><input type="url" value={item.url || ''} onChange={(e) => form.setData('socials', form.data.socials.map((x, i) => i === index ? { ...x, url: e.target.value } : x))} placeholder="https://…" />{form.errors[`socials.${index}.url`] && <small className="a-error">{form.errors[`socials.${index}.url`]}</small>}</label>
                                            </div>
                                            <label className="a-social-toggle"><Switch on={item.enabled !== false} label={`Show ${item.label || SOCIAL_NETWORKS[item.network] || 'social link'}`} onClick={() => form.setData('socials', form.data.socials.map((x, i) => i === index ? { ...x, enabled: x.enabled === false } : x))} /><small>{item.enabled === false ? 'Off' : 'On'}</small></label>
                                            <button type="button" className="a-icon-btn danger" aria-label="Remove social link" title="Remove" onClick={() => form.setData('socials', form.data.socials.filter((_, i) => i !== index))}><Icon name="trash" size={15} /></button>
                                        </div>
                                    ))}
                                    <button type="button" className="a-btn ghost sm" onClick={() => form.setData('socials', [...(form.data.socials || []), { network: 'youtube', label: 'YouTube', url: '', enabled: false }])}><Icon name="plus" size={15} /> Add social link</button>
                                    {form.errors.socials && <small className="a-error">{form.errors.socials}</small>}
                                </div>
                                <div className="a-form-grid" style={{ marginTop: 20 }}>{fields.filter((f) => f.name === 'whatsapp').map(input)}</div>
                                {/* more WhatsApp numbers: each one shows on the website next to the main number */}
                                <div className="a-social-list" style={{ marginTop: 16 }}>
                                    {(form.data.whatsapp_more || []).map((item, index) => (
                                        <div className="a-social-row" key={index}>
                                            <div className="a-social-fields">
                                                <label className="a-field"><span>Label</span><input value={item.label || ''} onChange={(e) => form.setData('whatsapp_more', form.data.whatsapp_more.map((x, i) => i === index ? { ...x, label: e.target.value } : x))} placeholder="e.g. Sales" />{form.errors[`whatsapp_more.${index}.label`] && <small className="a-error">{form.errors[`whatsapp_more.${index}.label`]}</small>}</label>
                                                <label className="a-field"><span>WhatsApp number (digits only)</span><input inputMode="numeric" value={item.number || ''} onChange={(e) => form.setData('whatsapp_more', form.data.whatsapp_more.map((x, i) => i === index ? { ...x, number: e.target.value.replace(/\D/g, '') } : x))} placeholder="8801XXXXXXXXX" />{form.errors[`whatsapp_more.${index}.number`] && <small className="a-error">{form.errors[`whatsapp_more.${index}.number`]}</small>}</label>
                                            </div>
                                            <button type="button" className="a-icon-btn danger" aria-label="Remove WhatsApp number" title="Remove" onClick={() => form.setData('whatsapp_more', form.data.whatsapp_more.filter((_, i) => i !== index))}><Icon name="trash" size={15} /></button>
                                        </div>
                                    ))}
                                    {(form.data.whatsapp_more || []).length < 10 && (
                                        <button type="button" className="a-btn ghost sm" onClick={() => form.setData('whatsapp_more', [...(form.data.whatsapp_more || []), { label: '', number: '' }])}><Icon name="plus" size={15} /> Add WhatsApp number</button>
                                    )}
                                    {form.errors.whatsapp_more && <small className="a-error">{form.errors.whatsapp_more}</small>}
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                <div className="a-savebar">
                    <p className="a-muted">{form.isDirty ? 'You have unsaved changes.' : 'Changes go live on the website as soon as you save.'}</p>
                    <button className="a-btn primary lg" disabled={form.processing}>{form.processing ? 'Saving…' : 'Save all settings'}</button>
                </div>
            </form>
        </AdminLayout>
    );
}
