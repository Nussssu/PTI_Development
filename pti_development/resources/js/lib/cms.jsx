/* Content from the admin panel (CMS).

   Every page receives `cms` = { page, seo, sections: { key: { enabled, ...fields } } } (App\Cms\Cms::payload) and
   every page gets `blocks` = { header, footer }. Stored values already sit over the defaults on the server, so the
   site looks exactly as designed until something is edited.

   - useSection('hero')          the section's fields ({} when the page has no CMS data)
   - isOn(c)                     false only when the section is switched off in the admin
   - val(c, 'title', 'Default')  a field with a fallback (for components also used without CMS data)
   - rich('Our *office*')        text -> nodes; *asterisks* become the accent span (class "serif" by default)
   - richLines(text)             one entry per line (for the line-by-line animated headings)
   - useImg(img, fallback)       an image field (url or {desktop, mobile}) -> the url for this screen size
   - fill('© {year} {company}', site)  replaces {year} {company} {tagline} {phone} {email} {address} */
import { Head, usePage } from '@inertiajs/react';
import { Fragment, useEffect, useState } from 'react';

export const MOBILE_QUERY = '(max-width: 860px)';

export function useCms() {
    return usePage().props.cms || null;
}

export function useSection(key) {
    const cms = useCms();
    return cms?.sections?.[key] || {};
}

export function useBlocks() {
    return usePage().props.blocks || {};
}

export const isOn = (c) => !c || c.enabled !== false;

export const val = (c, key, fallback) => {
    const x = c ? c[key] : undefined;
    return x === undefined || x === null || x === '' ? fallback : x;
};

export function useIsMobile() {
    const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches);
    useEffect(() => {
        const q = window.matchMedia(MOBILE_QUERY);
        const on = () => setMobile(q.matches);
        q.addEventListener('change', on);
        return () => q.removeEventListener('change', on);
    }, []);
    return mobile;
}

export function pickImg(v, mobile) {
    if (!v) return null;
    if (typeof v === 'string') return v;
    return (mobile && v.mobile) || v.desktop || v.mobile || null;
}

export function useImg(v, fallback = null) {
    const mobile = useIsMobile();
    return pickImg(v, mobile) || fallback;
}

export function rich(text, cls = 'serif', Tag = 'span') {
    if (text === undefined || text === null) return null;
    return String(text).split(/(\*[^*\n]+\*)/g).filter((p) => p !== '').map((p, i) => (
        /^\*[^*\n]+\*$/.test(p) ? <Tag className={cls || undefined} key={i}>{p.slice(1, -1)}</Tag> : <Fragment key={i}>{p}</Fragment>
    ));
}

export function richLines(text, cls = 'serif', Tag = 'span') {
    return String(text ?? '').split(/\r?\n/).filter((l) => l.trim() !== '').map((l, i) => <Fragment key={i}>{rich(l, cls, Tag)}</Fragment>);
}

/** plain text without the *accent* marks (alt texts, aria labels) */
export const plain = (text) => String(text ?? '').replace(/\*/g, '').replace(/\s*\n\s*/g, ' ');

export function fill(text, site = {}) {
    const map = { year: String(new Date().getFullYear()), ...site };
    return String(text ?? '').replace(/\{(\w+)\}/g, (m, k) => (map[k] !== undefined && map[k] !== null ? map[k] : m));
}

/** <title> + meta tags from the page's SEO tab (the server renders the same tags for the first load). */
export function Seo({ title }) {
    const seo = useCms()?.seo || {};
    const t = seo.title || title;
    const abs = (u) => (u && u.startsWith('/') && typeof window !== 'undefined' ? window.location.origin + u : u);
    return (
        <Head title={t}>
            {t && <meta head-key="og:title" property="og:title" content={t} />}
            {seo.description && <meta head-key="description" name="description" content={seo.description} />}
            {seo.description && <meta head-key="og:description" property="og:description" content={seo.description} />}
            {seo.keywords && <meta head-key="keywords" name="keywords" content={seo.keywords} />}
            {seo.image && <meta head-key="og:image" property="og:image" content={abs(seo.image)} />}
            {seo.canonical && <link head-key="canonical" rel="canonical" href={seo.canonical} />}
            {seo.noindex && <meta head-key="robots" name="robots" content="noindex, nofollow" />}
        </Head>
    );
}
