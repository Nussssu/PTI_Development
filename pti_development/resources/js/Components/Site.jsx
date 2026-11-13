/* Small building blocks shared by every public page */
import { router } from '@inertiajs/react';
import { Children, forwardRef, Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { coverCurtain, revealCurtain, ScrollTrigger } from '../lib/motion';
import { Arrow, Facebook, Instagram, LinkedIn, Pin, Units } from './Icons';

/* ---------- shared header menu + footer: identical on the landing page and every inner page ---------- */
const PTI_MARK = 'M0.00454068 18.3256H0V73.5928H18.4044V92H36.827V91.9728H73.5949V55.1674V18.3619H73.6085V0H0.00908136V18.3256H0.00454068ZM18.4271 18.3619H55.195V55.1674H36.7997V73.5701H18.4271V18.3619Z';

/* true only for the first page shown after a fresh load / reload (Inertia visits keep this module alive) */
export function claimPreloader() {
    if (typeof window === 'undefined' || window.__ptiPreloaded) return false;
    window.__ptiPreloaded = true;
    return true;
}

/** The site preloader: only the PTI logo in the middle of a navy screen, with a loading bar under it. Motion: playLoader in lib/motion.js. */
export const LogoPreloader = forwardRef(function LogoPreloader(_, ref) {
    return (
        <div className="lx-pre-host">
            <div className="lx-pre" ref={ref} aria-hidden="true">
                <svg className="emblem" viewBox="0 0 74 92"><path d={PTI_MARK} /></svg>
                <div className="pre-bar"><i /></div>
            </div>
        </div>
    );
});

const MENU = [['/projects', 'Our Projects'], ['/about', 'About'], ['/services', 'Services'], ['/contact#contact', 'Book a visit']];
const FOOT_NAV = [['/', 'Home'], ['/about', 'About'], ['/services', 'Services'], ['/projects', 'Projects'], ['/contact', 'Contact']];

/** Top-right "Menu" button; the site links open in a dropdown under it. `Link` decides how a link navigates. */
export function MenuDropdown({ Link = TLink }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        if (!open) return;
        const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('pointerdown', onDown);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
    }, [open]);
    return (
        <nav className={`lx-menu${open ? ' is-open' : ''}`} aria-label="Main" ref={ref}>
            <button type="button" className="lx-menu-btn" aria-expanded={open} aria-controls="lx-menu-list" onClick={() => setOpen((o) => !o)}>
                <span className="lbl">{open ? 'Close' : 'Menu'}</span>
                <span className="ico" aria-hidden="true"><i /><i /></span>
            </button>
            <ul className="lx-menu-list" id="lx-menu-list" inert={!open} aria-hidden={!open}>
                {MENU.map(([href, label], i) => (
                    <li key={label} style={{ '--i': i }}>
                        <Link className={i === 0 ? 'primary' : ''} href={href} onClick={() => setOpen(false)}>{label}</Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

/** Site footer (logo, links, contact, big outlined name, legal + socials). */
export function SiteFooter({ site, Link = TLink, ...rest }) {
    // social icons under the logo + description; each opens that network's login page
    const socials = [
        ['https://www.facebook.com/login/', 'Facebook', <Facebook key="f" />],
        ['https://www.instagram.com/accounts/login/', 'Instagram', <Instagram key="i" />],
        ['https://www.linkedin.com/login', 'LinkedIn', <LinkedIn key="l" />],
    ];
    return (
        <footer className="footer" {...rest}>
            <div className="wrap">
                <div className="footer-grid">
                    <div>
                        <Link className="footer-logo" href="/"><img src="/images/pti-logo-white.svg" alt="PTI Development" style={{ height: 64 }} /></Link>
                        <p style={{ marginTop: 24, maxWidth: '34ch', opacity: 0.7 }}>Shaping Dreams into Homes. {site.tagline}</p>
                        <div className="socials" style={{ marginTop: 24 }}>{socials.map(([href, label, icon]) => <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>{icon}</a>)}</div>
                    </div>
                    <div>
                        <h4>Links</h4>
                        <div className="footer-links">{FOOT_NAV.map(([h, t]) => <Link key={h} href={h}>{t}</Link>)}</div>
                    </div>
                    <div className="footer-contact">
                        <h4 style={{ marginBottom: 2 }}>Contact</h4>
                        <div><small>Phone</small><a href={`tel:${site.phone?.replace(/\s/g, '')}`}>{site.phone}</a></div>
                        <div><small>Email</small><a href={`mailto:${site.email}`}>{site.email}</a></div>
                        <div><small>Address</small>{site.address}</div>
                    </div>
                </div>
                <div className="footer-big" aria-hidden="true">PTI Development</div>
                <div className="footer-bottom">
                    <span>© {new Date().getFullYear()} {site.company} All Rights Reserved.</span>
                </div>
            </div>
        </footer>
    );
}

export const pad = (n) => String(n).padStart(2, '0');

/** Internal link that plays the "floors" curtain before visiting. */
/** Go to another page of the site behind the logo preloader (same-page #hash links just glide there). */
export function navigate(href) {
    if (href === window.location.pathname) return;
    const [path, hash] = href.split('#');
    if (hash && path === window.location.pathname) {
        const el = document.getElementById(hash);
        if (el) { window.__lenis ? window.__lenis.scrollTo(el, { duration: 1.4 }) : el.scrollIntoView({ behavior: 'smooth' }); }
        return;
    }
    sessionStorage.setItem('pti-nav', '1');
    document.documentElement.classList.remove('menu-open');
    coverCurtain(() => router.visit(href, { onFinish: () => revealCurtain() }));
}

export function TLink({ href, children, onClick, ...rest }) {
    const go = (e) => {
        onClick && onClick(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || rest.target) return;
        e.preventDefault();
        navigate(href);
    };
    return <a href={href} onClick={go} {...rest}>{children}</a>;
}

export function Btn({ href, children, className = '', icon = true, external, ...rest }) {
    const inner = (
        <>
            <span>{children}</span>
            {icon && <span className="btn-ico"><Arrow /></span>}
        </>
    );
    const cls = `btn ${className} ${icon ? '' : 'no-ico'}`;
    if (external || href.startsWith('tel:') || href.startsWith('mailto:')) {
        return <a className={cls} href={href} data-magnetic {...rest}>{inner}</a>;
    }
    return <TLink className={cls} href={href} data-magnetic {...rest}>{inner}</TLink>;
}

/** Heading whose lines slide up. Each child is one line. */
export function Split({ as: Tag = 'h2', className = 'h2', children, ...rest }) {
    return (
        <Tag className={className} data-split {...rest}>
            {Children.toArray(children).map((line, i) => (
                <span className="line-mask" key={i}><span>{line}</span></span>
            ))}
        </Tag>
    );
}

/** Hero heading (animated by the page intro, not on scroll). */
export function HeroTitle({ as: Tag = 'h1', className, children }) {
    return (
        <Tag className={className}>
            {Children.toArray(children).map((line, i) => (
                <span className="line-mask" key={i}><span>{line}</span></span>
            ))}
        </Tag>
    );
}

/** Splits text into word spans for the scroll-lit statement. Strings or {serif: "..."} parts. */
export function Words({ parts }) {
    const words = (text, cls, k) =>
        text.split(/(\s+)/).map((t, i) => (/^\s+$/.test(t) || !t ? <Fragment key={`${k}-${i}`}>{t}</Fragment> : <span className={`w ${cls}`} key={`${k}-${i}`}>{t}</span>));
    return <>{parts.map((p, k) => (typeof p === 'string' ? words(p, '', k) : words(p.serif, 'serif', k)))}</>;
}

export function ProjectCard({ project, index, total }) {
    return (
        <TLink className="p-card" href={`/projects/${project.slug}`} data-cursor="View" data-area={project.area}>
            <div className="p-card-media">
                {project.image_url && <img src={project.image_url} alt={project.name} loading="lazy" />}
                <span className="status">{project.status}</span>
            </div>
            <div className="p-card-body">
                <h3>{project.name}</h3>
                <div className="p-facts">
                    <span><Units />{project.units} Units</span>
                    <span><Pin />{project.location}</span>
                </div>
            </div>
        </TLink>
    );
}

export function Odometer({ value, suffix }) {
    return (
        <div className="odo" aria-label={`${value}${suffix || ''}`}>
            {String(value).split('').map((d, i) => (
                <span className="odo-col" data-d={d} key={i}>
                    <span>{Array.from({ length: 20 }, (_, k) => <span key={k}>{k % 10}</span>)}</span>
                </span>
            ))}
            {suffix ? <sup>{suffix}</sup> : null}
        </div>
    );
}

export function StatCard({ stat, index }) {
    return (
        <div className="num-card" data-reveal>
            {stat.image_url && <img src={stat.image_url} alt="" loading="lazy" />}
            <div className="elev-head"><span>Floor {pad(index + 1)}</span><span className="elev-arrows"><i></i><i></i></span></div>
            <div>
                <Odometer value={stat.value} suffix={stat.suffix} />
                <div className="num-label">{stat.label}</div>
            </div>
        </div>
    );
}

export function FaqList({ faqs }) {
    const [open, setOpen] = useState(0);
    return faqs.map((f, i) => <FaqItem key={f.id} faq={f} n={i} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />);
}

function FaqItem({ faq, n, open, onToggle }) {
    const ref = useRef(null);
    const [h, setH] = useState(open ? 'auto' : 0);
    const first = useRef(true);
    useLayoutEffect(() => {
        if (first.current) { first.current = false; return; }
        const el = ref.current;
        const full = el.scrollHeight;
        if (open) {
            setH(full);
            const t = setTimeout(() => { setH('auto'); ScrollTrigger.refresh(); }, 620);
            return () => clearTimeout(t);
        }
        setH(full);
        requestAnimationFrame(() => requestAnimationFrame(() => setH(0)));
        const t = setTimeout(() => ScrollTrigger.refresh(), 620);
        return () => clearTimeout(t);
    }, [open]);
    return (
        <div className={`faq-item ${open ? 'is-open' : ''}`} data-reveal>
            <button className="faq-q" aria-expanded={open} onClick={onToggle}>
                <span><span className="n">{pad(n + 1)}</span>{faq.question}</span>
                <span className="faq-ico"></span>
            </button>
            <div className="faq-a" ref={ref} style={{ height: h }}><p>{faq.answer}</p></div>
        </div>
    );
}

/** "Let's talk": laid out like the landing page's closing contact section (photo left, condensed serif + script
    title right, on lavender), with the "Book the meeting" badge taking the form's place; it opens the Contact page. */
export function Cta() {
    return (
        <section className="cta" data-theme="light" data-floor="Book a meeting">
            <div className="cta-pic" data-reveal><img src="/images/lets-talk-keys.webp" alt="A PTI agent handing the keys of a new apartment to a smiling couple" loading="lazy" /></div>
            <div className="cta-main">
                <div className="cta-eyebrow" data-reveal>Let's talk</div>
                <h2 className="cta-title" data-reveal>Ready to build <span className="cta-script">your dream?</span></h2>
                <p className="cta-lead" data-reveal>We will show you finished and under construction projects, introduce you to the features of the areas and tell you about the real estate market in Dhaka.</p>
                <TLink className="cta-badge" href="/contact#contact" data-magnetic data-reveal aria-label="Book the meeting">
                    <svg className="ring" viewBox="0 0 100 100"><defs><path id="cta-c" d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0" /></defs><text><textPath href="#cta-c">Book the meeting · Book the meeting ·</textPath></text></svg>
                    <Arrow size={34} />
                </TLink>
            </div>
        </section>
    );
}

export function PageHero({ crumb, image, imageStyle, video, children, title, style, className = '' }) {
    const videoRef = useRef(null);
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        // Respect reduced-motion: keep the poster frame, never autoplay.
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { v.pause(); v.removeAttribute('autoplay'); return; }
        v.play().catch(() => {});
    }, [video]);

    return (
        <section className={`page-hero ${className}`} data-theme="dark" data-floor={crumb} style={style}>
            <div className="bg">
                {video
                    ? <video ref={videoRef} src={video} poster={image} style={imageStyle} autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
                    : <img src={image} alt="" style={imageStyle} />}
            </div>
            <div className="wrap">
                <HeroTitle>{title}</HeroTitle>
                {children}
            </div>
        </section>
    );
}

/** Field with floating label used by the public forms. */
export function Field({ id, label, error, full, textarea, required = true, ...rest }) {
    const Tag = textarea ? 'textarea' : 'input';
    return (
        <div className={`field ${full ? 'full' : ''} ${error ? 'has-error' : ''}`}>
            <Tag id={id} placeholder=" " required={required} {...rest} />
            <label htmlFor={id}>{label} {required && <em>*</em>}</label>
            {error && <small className="field-error">{error}</small>}
        </div>
    );
}

export function useMounted() {
    const [m, setM] = useState(false);
    useEffect(() => setM(true), []);
    return m;
}
