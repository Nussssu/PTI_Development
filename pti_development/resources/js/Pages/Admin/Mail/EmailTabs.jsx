import { Link, usePage } from '@inertiajs/react';

export default function EmailTabs() {
    const { url } = usePage();
    const templates = url.startsWith('/admin/email/templates');
    return (
        <div className="a-tabs a-tabs-lg" aria-label="Email settings">
            <Link className={!templates ? 'is-active' : ''} href="/admin/email/smtp">SMTP setup</Link>
            <Link className={templates ? 'is-active' : ''} href="/admin/email/templates">Email templates</Link>
        </div>
    );
}
