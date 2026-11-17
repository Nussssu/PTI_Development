import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

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
    file: 'M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9zM14 3v6h6M8 13h8M8 17h5',
    image: 'M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zM8.5 11a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 16l-5-5L5 19',
    layout: 'M4 4h16v5H4zM4 15h16v5H4zM8 12h8',
    eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
    reply: 'M9 14L4 9l5-5M4 9h11a5 5 0 015 5v6',
    edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
    copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    plus: 'M12 5v14M5 12h14',
    chevron: 'M6 9l6 6 6-6',
    up: 'M18 15l-6-6-6 6',
    down: 'M6 9l6 6 6-6',
    upload: 'M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3',
    globe: 'M12 22a10 10 0 100-20 10 10 0 000 20zM2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20',
    mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
    phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2',
    check: 'M5 12l5 5L20 7',
    x: 'M6 6l12 12M18 6L6 18',
    monitor: 'M3 4h18v12H3zM8 20h8M12 16v4',
    mobile: 'M7 2h10v20H7zM11 18h2',
    reset: 'M4 4v6h6M20 20v-6h-6M5.5 15a7 7 0 0011.9 2.5M18.5 9A7 7 0 006.6 6.5',
    link: 'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1',
    code: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
    shield: 'M12 3l8 3v6c0 5-3.4 8.3-8 9-4.6-.7-8-4-8-9V6zM9 12l2 2 4-4',
    lock: 'M6 11h12v10H6zM8 11V7a4 4 0 018 0v4',
    download: 'M12 4v12M7 11l5 5 5-5M4 20h16',
    archive: 'M3 4h18v4H3zM5 8v12h14V8M10 12h4',
    send: 'M22 2L11 13M22 2l-7 20-4-9-9-4z',
    star2: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
};

/* ---------------- delete confirmation dialog ---------------- */
let openConfirm = null;

/**
 * Ask before deleting, in the admin's own dialog (not the browser's confirm box).
 * askDelete({ title: 'Delete "Home"?', text: '...', confirmLabel: 'Delete' }) → Promise<boolean>
 */
export function askDelete({ title, text = 'This is deleted permanently.', confirmLabel = 'Delete' }) {
    if (!openConfirm) return Promise.resolve(window.confirm(`${title}\n\n${text}`));
    return new Promise((resolve) => openConfirm({ title, text, confirmLabel, resolve }));
}

function ConfirmHost() {
    const [ask, setAsk] = useState(null);
    useEffect(() => {
        openConfirm = setAsk;
        return () => { openConfirm = null; };
    }, []);
    useEffect(() => {
        if (!ask) return undefined;
        const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); done(false); } };
        addEventListener('keydown', key, true);
        return () => removeEventListener('keydown', key, true);
    }, [ask]);
    if (!ask) return null;
    const done = (ok) => { ask.resolve(ok); setAsk(null); };

    return (
        <div className="a-modal a-confirm-wrap" onMouseDown={(e) => e.target === e.currentTarget && done(false)}>
            <div className="a-confirm" role="alertdialog" aria-modal="true" aria-labelledby="a-confirm-title" aria-describedby="a-confirm-text">
                <h2 id="a-confirm-title">{ask.title}</h2>
                <p id="a-confirm-text">{ask.text}</p>
                <div className="a-confirm-btns">
                    <button type="button" className="a-confirm-cancel" onClick={() => done(false)} autoFocus>Cancel</button>
                    <button type="button" className="a-confirm-delete" onClick={() => done(true)}>{ask.confirmLabel}</button>
                </div>
            </div>
        </div>
    );
}

/** On / off switch used in lists (Featured, Published, Visible). */
export const Switch = ({ on, onClick, label, disabled }) => (
    <button type="button" role="switch" aria-checked={!!on} aria-label={label} title={label} className={`a-switch ${on ? 'on' : ''}`} onClick={onClick} disabled={disabled}><i /></button>
);

export const Icon = ({ name, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[name] || ICONS.layers} /></svg>
);

/** Small square icon button with a tooltip (used for row actions: view, reply, edit, duplicate, delete). */
export function IconBtn({ icon, label, href, onClick, tone = '', external, disabled, ...rest }) {
    const cls = `a-ibtn ${tone}`;
    if (href && !disabled) {
        return external
            ? <a className={cls} href={href} target="_blank" rel="noopener" title={label} aria-label={label} {...rest}><Icon name={icon} size={17} /></a>
            : <Link className={cls} href={href} title={label} aria-label={label} {...rest}><Icon name={icon} size={17} /></Link>;
    }
    return <button type="button" className={cls} onClick={onClick} title={label} aria-label={label} disabled={disabled} {...rest}><Icon name={icon} size={17} /></button>;
}

export const ago = (d) => {
    if (!d) return '';
    const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.round(s / 60)} min ago`;
    if (s < 86400) return `${Math.round(s / 3600)} h ago`;
    if (s < 86400 * 7) return `${Math.round(s / 86400)} d ago`;
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

/* the sidebar's scroll position, kept across page changes (every admin page mounts its own layout) */
let sideScroll = 0;

export default function AdminLayout({ title, actions, children, wide = false }) {
    const { auth, admin, flash, url } = { ...usePage().props, url: usePage().url };
    const [toast, setToast] = useState(null);
    const [navOpen, setNavOpen] = useState(false);
    const sideRef = useRef(null);
    useLayoutEffect(() => { if (sideRef.current) sideRef.current.scrollTop = sideScroll; }, []);

    useEffect(() => {
        const t = flash?.error ? { text: flash.error, bad: true } : flash?.success ? { text: flash.success } : null;
        setToast(t);
        if (!t) return undefined;
        const timer = setTimeout(() => setToast(null), t.bad ? 7000 : 3500);
        return () => clearTimeout(timer);
    }, [flash?.success, flash?.error]);

    useEffect(() => {
        document.documentElement.classList.remove('has-motion', 'menu-open');
        document.documentElement.dataset.themeNow = 'light';
    }, []);

    const path = url.split('?')[0];
    const can = auth.user?.can || {};
    const item = (href, label, icon, badge, exact) => {
        const active = exact ? path === href : path === href || path.startsWith(href + '/');
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
            <aside className="a-side" ref={sideRef} onScroll={(e) => { sideScroll = e.currentTarget.scrollTop; }}>
                <Link href="/admin" className="a-brand"><img src="/images/pti-logo-horizontal-white.svg" alt="PTI" /><span>Admin</span></Link>
                <nav className="a-nav">
                    <div className="a-nav-label">Overview</div>
                    {item('/admin', 'Dashboard', 'home', null, true)}
                    {can.leads && <>
                        <div className="a-nav-label">Leads</div>
                        {item('/admin/inquiries', 'Inbox', 'inbox', admin?.unread)}
                    </>}
                    {can.content && <>
                        <div className="a-nav-label">Content management</div>
                        {item('/admin/pages', 'Pages', 'file')}
                        {(admin?.nav || []).map((r) => item(`/admin/content/${r.slug}`, r.label, r.icon))}
                        {item('/admin/media', 'Media library', 'image')}
                        {item('/admin/layout', 'Menus', 'layout')}
                    </>}
                    <div className="a-nav-label">System &amp; administration</div>
                    {can.users && item('/admin/users', 'User management', 'users')}
                    {can.system && <>
                        <Link key="/admin/email" href="/admin/email/smtp" className={`a-nav-link ${path.startsWith('/admin/email/') ? 'is-active' : ''}`} onClick={() => setNavOpen(false)}>
                            <Icon name="mail" /> <span>Email setup</span>{!admin?.mailLive && <em className="a-badge">!</em>}
                        </Link>
                        {item('/admin/settings', 'Settings', 'settings')}
                    </>}
                    {can.system && item('/admin/audit', 'Audit log', 'shield')}
                    {item('/admin/security', 'My security', 'lock')}
                </nav>
                <div className="a-user">
                    <div className="a-user-row">
                        <div className="a-avatar">{auth.user?.name?.[0] || 'A'}</div>
                        <div className="a-user-meta"><b>{auth.user?.name}</b><small>{auth.user?.role_label}</small></div>
                    </div>
                    <div className="a-user-btns">
                        <a className="a-side-btn" href="/" target="_blank" rel="noopener">View site <Icon name="external" size={13} /></a>
                        <button className="a-side-btn" onClick={() => router.post('/admin/logout')}>Log out</button>
                    </div>
                </div>
            </aside>
            <div className="a-scrim" onClick={() => setNavOpen(false)} />
            <div className="a-main">
                <header className="a-top">
                    <button className="a-burger" aria-label="Menu" onClick={() => setNavOpen(true)}><span /><span /></button>
                    <h1>{title}</h1>
                    <div className="a-actions">{actions}</div>
                </header>
                <div className={`a-content ${wide ? 'wide' : ''}`}>{children}</div>
            </div>
            {toast && <div className={`a-toast ${toast.bad ? 'bad' : ''}`} role="status" onClick={() => setToast(null)}>{toast.text}</div>}
            <ConfirmHost />
        </div>
    );
}
