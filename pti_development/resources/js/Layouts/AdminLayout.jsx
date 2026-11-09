import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const ICONS = {
    home: 'M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z',
    inbox: 'M3 13l3-8h12l3 8v6a1 1 0 01-1 1H4a1 1 0 01-1-1zM3 13h5l1 3h6l1-3h5',
    building: 'M4 21V5l8-3 8 3v16M9 21v-5h6v5M8 8h2M14 8h2M8 12h2M14 12h2',
    layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5',
    users: 'M16 19v-1a4 4 0 00-4-4H6a4 4 0 00-4 4v1M9 10a3 3 0 100-6 3 3 0 000 6M22 19v-1a4 4 0 00-3-3.9M16 4.1a3 3 0 010 5.8',
    star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
    chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    help: 'M12 22a10 10 0 100-20 10 10 0 000 20zM9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01',
    quote: 'M7 7h4v4c0 3-2 5-4 6M15 7h4v4c0 3-2 5-4 6',
    settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
    external: 'M14 3h7v7M10 14L21 3M21 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5',
    logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
};

export const Icon = ({ name, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS[name] || ICONS.layers} /></svg>
);

export default function AdminLayout({ title, actions, children }) {
    const { auth, admin, flash, url } = { ...usePage().props, url: usePage().url };
    const [toast, setToast] = useState(flash.success);
    const [navOpen, setNavOpen] = useState(false);

    useEffect(() => {
        setToast(flash.success);
        if (!flash.success) return;
        const t = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(t);
    }, [flash.success]);

    useEffect(() => {
        document.documentElement.classList.remove('has-motion', 'menu-open');
        document.documentElement.dataset.themeNow = 'light';
    }, []);

    const path = url.split('?')[0];
    const item = (href, label, icon, badge, exact) => {
        const active = exact ? path === href : path.startsWith(href);
        return (
            <Link key={href} href={href} className={`a-nav-link ${active ? 'is-active' : ''}`} onClick={() => setNavOpen(false)}>
                <Icon name={icon} /> <span>{label}</span>
                {badge ? <em className="a-badge">{badge}</em> : null}
            </Link>
        );
    };

    return (
        <div className={`admin ${navOpen ? 'nav-open' : ''}`}>
            <Head title={title ? `${title} · Admin` : 'Admin'} />
            <aside className="a-side">
                <Link href="/admin" className="a-brand"><img src="/images/pti-logo-horizontal-white.svg" alt="PTI" /><span>Admin</span></Link>
                <nav className="a-nav">
                    {item('/admin', 'Dashboard', 'home', null, true)}
                    {item('/admin/inquiries', 'Inquiries', 'inbox', admin?.unread)}
                    <div className="a-nav-label">Content</div>
                    {(admin?.nav || []).map((r) => item(`/admin/content/${r.slug}`, r.label, r.icon))}
                    <div className="a-nav-label">Site</div>
                    {item('/admin/settings', 'Settings', 'settings')}
                    <a className="a-nav-link" href="/" target="_blank" rel="noopener"><Icon name="external" /> <span>View website</span></a>
                </nav>
                <div className="a-user">
                    <div className="a-avatar">{auth.user?.name?.[0] || 'A'}</div>
                    <div className="a-user-meta"><b>{auth.user?.name}</b><small>{auth.user?.email}</small></div>
                    <button className="a-icon-btn" title="Sign out" onClick={() => router.post('/admin/logout')}><Icon name="logout" /></button>
                </div>
            </aside>
            <div className="a-scrim" onClick={() => setNavOpen(false)} />
            <div className="a-main">
                <header className="a-top">
                    <button className="a-burger" aria-label="Menu" onClick={() => setNavOpen(true)}><span /><span /></button>
                    <h1>{title}</h1>
                    <div className="a-actions">{actions}</div>
                </header>
                <div className="a-content">{children}</div>
            </div>
            {toast && <div className="a-toast" role="status">{toast}</div>}
        </div>
    );
}
