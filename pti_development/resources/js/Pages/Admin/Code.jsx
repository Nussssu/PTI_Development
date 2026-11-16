import { useForm } from '@inertiajs/react';
import AdminLayout, { Icon } from '../../Layouts/AdminLayout';

const SLOTS = [
    ['head', 'Inside <head>', 'Google Analytics / Tag Manager, Meta Pixel, Search Console verification, custom CSS in a <style> tag.', '<!-- Google tag (gtag.js) -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>'],
    ['body_start', 'Right after <body>', 'Google Tag Manager "noscript" part, and anything that must load first.', '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXX" …></iframe></noscript>'],
    ['body_end', 'Before </body>', 'Live chat widgets (Tawk.to, Messenger), other scripts that can load last.', '<script src="https://embed.tawk.to/…"></script>'],
];

/** Custom code: snippets printed on every public page (not the admin). */
export default function Code({ code }) {
    const form = useForm(code);
    const dirty = SLOTS.some(([k]) => (form.data[k] || '') !== (code[k] || ''));

    return (
        <AdminLayout title="Custom code" actions={<button className="a-btn primary" disabled={!dirty || form.processing} onClick={() => form.put('/admin/code', { preserveScroll: true })}>{form.processing ? 'Saving…' : dirty ? 'Save code' : 'Saved'}</button>}>
            <div className="a-alert" style={{ cursor: 'default' }}>
                <Icon name="code" /> <span>Code here runs on every page of the public website as soon as you save. Only paste snippets from services you trust; a broken script can break the site. Empty boxes add nothing. Every change is recorded in the audit log.</span>
            </div>
            <div className="a-stack-lg">
                {SLOTS.map(([k, title, help, ph]) => (
                    <div key={k} className="a-card">
                        <label className="a-field">
                            <span className="a-field-label">{title}<small className="a-muted">{(form.data[k] || '').length.toLocaleString()} characters</small></span>
                            <textarea className="a-code" spellCheck={false} value={form.data[k] || ''} placeholder={ph} onChange={(e) => form.setData(k, e.target.value)} rows={8} />
                            {form.errors[k] && <small className="a-error">{form.errors[k]}</small>}
                            <small className="a-muted">{help}</small>
                        </label>
                    </div>
                ))}
            </div>
        </AdminLayout>
    );
}
