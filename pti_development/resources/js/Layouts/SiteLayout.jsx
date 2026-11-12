import { Head, usePage } from '@inertiajs/react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Facebook, Instagram, LinkedIn } from '../Components/Icons';
import { pad, TLink } from '../Components/Site';
import { initMotion, playLoader, prefersReducedMotion, revealCurtain } from '../lib/motion';
import RisingTower from '../lib/tower';

const SiteCtx = createContext({ openVideo: () => {} });
export const useSite = () => useContext(SiteCtx);

const NAV = [['/', 'Home'], ['/about', 'About'], ['/services', 'Services'], ['/projects', 'Projects'], ['/contact', 'Contact']];

/* ---------- header in the landing page's style: the rotating ring badge (top left, back to Home) and the stacked menu
   (top right). Its colour follows the section under it: white on dark sections, navy on light ones. The ring turns
   slowly and speeds up with the scroll. On phones the links fold into the menu button. ---------- */
const MARK = 'M0.00454068 18.3256H0V73.5928H18.4044V92H36.827V91.9728H73.5949V55.1674V18.3619H73.6085V0H0.00908136V18.3256H0.00454068ZM18.4271 18.3619H55.195V55.1674H36.7997V73.5701H18.4271V18.3619Z';
function SiteChrome({ menuOpen, onBurger }) {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current, ring = el.querySelector('.ring');
        const reduce = prefersReducedMotion();
        let rot = 0, lastY = window.scrollY, raf;
        const tick = () => {
            const y = window.scrollY, v = y - lastY;
            lastY = y;
            if (!reduce) { rot += 0.12 + Math.min(6, Math.abs(v) * 0.06); ring.style.transform = `rotate(${rot}deg)`; }
            /* light or dark under the menu (top right): pages mark sections with data-theme, the landing sections with data-tone */
            let light = false;
            for (const s of document.querySelectorAll('main [data-theme], main [data-tone]')) {
                const r = s.getBoundingClientRect();
                if (r.top <= 90 && r.bottom > 90 && r.left <= innerWidth - 60 && r.right > innerWidth - 60) {
                    const t = s.dataset.tone || s.dataset.theme;
                    light = t === 'light' || t === 'white';
                }
            }
            el.classList.toggle('on-light', light && !document.documentElement.classList.contains('menu-open'));
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);
    return (
        <div className="site-chrome" ref={ref}>
            <TLink className="sc-badge" href="/" aria-label="PTI Development home">
                <svg className="ring" viewBox="0 0 120 120" aria-hidden="true">
                    <defs><path id="sc-ring" d="M60 60 m-47 0 a47 47 0 1 1 94 0 a47 47 0 1 1 -94 0" /></defs>
                    <text><textPath href="#sc-ring">PTI DEVELOPMENT · SHAPING DREAMS · DHAKA ·</textPath></text>
                </svg>
                <svg className="mark" viewBox="0 0 74 92" aria-hidden="true"><path d={MARK} /></svg>
            </TLink>
            <nav className="sc-nav" aria-label="Main">
                <TLink className="primary" href="/projects"><span>Our</span><span>Projects</span></TLink>
                <div className="links">
                    <TLink href="/contact">Book a visit</TLink>
                    <TLink href="/about">About</TLink>
                    <TLink href="/services">Services</TLink>
                    <TLink href="/contact">Contact</TLink>
                </div>
            </nav>
            <button className="burger sc-burger" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={onBurger}><i></i><i></i></button>
        </div>
    );
}

export default function SiteLayout({ title, children }) {
    const page = usePage();
    const site = page.props.site || {};
    const url = page.url;
    const mainRef = useRef(null);
    const loaderRef = useRef(null);
    const motionRef = useRef(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [video, setVideo] = useState(null);
    const [showLoader] = useState(() => typeof window !== 'undefined' && sessionStorage.getItem('pti-seen') !== '1' && !prefersReducedMotion());
    const [loaderGone, setLoaderGone] = useState(false);

    const path = url.split('?')[0];
    const isActive = (href) => (href === '/' ? path === '/' : path.startsWith(href));

    /* ---------- motion, tower, intro ---------- */
    useEffect(() => {
        const root = document.body;
        window.scrollTo(0, 0);
        const motion = initMotion(mainRef.current.parentElement);
        motionRef.current = motion;
        const sections = Array.from(mainRef.current.querySelectorAll('[data-floor]'));
        const tower = sections.length ? new RisingTower(sections, { onFloorClick: (s) => motion.scrollTo(s) }) : null;
        const timers = [];
        const start = () => {
            motion.intro.play();
            timers.push(setTimeout(() => tower && tower.start(), 700));
        };

        const fromNav = sessionStorage.getItem('pti-nav') === '1';
        sessionStorage.removeItem('pti-nav');
        let loaderTl;
        if (showLoader && loaderRef.current) {
            sessionStorage.setItem('pti-seen', '1');
            loaderTl = playLoader(loaderRef.current, start, () => setLoaderGone(true));
        } else {
            if (fromNav) revealCurtain();
            timers.push(setTimeout(start, fromNav ? 250 : 50));
        }

        return () => {
            timers.forEach(clearTimeout);
            loaderTl && loaderTl.kill();
            tower && tower.destroy();
            motion.destroy();
            root.classList.remove('menu-open');
        };
    }, []);

    /* ---------- theme under the top of the screen ---------- */
    useEffect(() => {
        const onScroll = () => {
            let theme = 'dark';
            for (const s of document.querySelectorAll('[data-theme]')) {
                const r = s.getBoundingClientRect();
                if (r.top <= 40 && r.bottom > 40) { theme = s.dataset.theme; break; }
            }
            document.documentElement.dataset.themeNow = theme === 'dark' ? 'dark' : 'light';
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    /* ---------- cursor + magnetic ---------- */
    useEffect(() => {
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        const c = document.createElement('div');
        c.className = 'cursor';
        c.innerHTML = '<div class="cursor-ring"></div><div class="cursor-dot"></div>';
        document.body.appendChild(c);
        const ring = c.firstChild, dot = c.lastChild;
        let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, raf;
        const move = (e) => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px)`; };
        const loop = () => { rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16; ring.style.transform = `translate(${rx}px,${ry}px)`; raf = requestAnimationFrame(loop); };
        const over = (e) => {
            const lab = e.target.closest('[data-cursor]');
            const link = e.target.closest('a, button, .tw-floor');
            c.classList.toggle('has-label', !!lab);
            c.classList.toggle('is-link', !!link && !lab);
            ring.textContent = lab ? lab.dataset.cursor : '';
        };
        const magMove = (e) => {
            const m = e.target.closest('[data-magnetic]');
            if (!m) return;
            const r = m.getBoundingClientRect();
            m.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
        };
        const magOut = (e) => {
            const m = e.target.closest('[data-magnetic]');
            if (!m || m.contains(e.relatedTarget)) return;
            m.style.transition = 'transform .6s cubic-bezier(.22,1,.36,1), color .5s';
            m.style.transform = '';
            setTimeout(() => { m.style.transition = ''; }, 600);
        };
        addEventListener('mousemove', move);
        document.addEventListener('mouseover', over);
        document.addEventListener('mousemove', magMove);
        document.addEventListener('mouseout', magOut);
        loop();
        return () => {
            cancelAnimationFrame(raf);
            removeEventListener('mousemove', move);
            document.removeEventListener('mouseover', over);
            document.removeEventListener('mousemove', magMove);
            document.removeEventListener('mouseout', magOut);
            c.remove();
        };
    }, []);

    /* ---------- menu + modal lock scrolling ---------- */
    useEffect(() => {
        document.documentElement.classList.toggle('menu-open', menuOpen);
        const lenis = motionRef.current && motionRef.current.lenis;
        if (lenis) (menuOpen || video ? lenis.stop() : lenis.start());
    }, [menuOpen, video]);

    useEffect(() => {
        const esc = (e) => e.key === 'Escape' && setVideo(null);
        addEventListener('keydown', esc);
        return () => removeEventListener('keydown', esc);
    }, []);

    const socials = [[site.facebook, 'Facebook', <Facebook key="f" />], [site.instagram, 'Instagram', <Instagram key="i" />], [site.linkedin, 'LinkedIn', <LinkedIn key="l" />]].filter(([href]) => href);

    return (
        <SiteCtx.Provider value={{ openVideo: setVideo }}>
            <Head title={title} />
            <div className="site">
                <SiteChrome menuOpen={menuOpen} onBurger={() => setMenuOpen(!menuOpen)} />

                <div className="mobile-menu" aria-hidden={!menuOpen}>
                    {NAV.map(([h, t], i) => (
                        <TLink key={h} className="big" href={h} onClick={() => setMenuOpen(false)}><small>{pad(i + 1)}</small>{t}</TLink>
                    ))}
                    <div className="mm-foot"><a href={`tel:${site.phone?.replace(/\s/g, '')}`}>{site.phone}</a><a href={`mailto:${site.email}`}>{site.email}</a></div>
                </div>

                <main ref={mainRef}>{children}</main>

                <footer className="footer">
                    <div className="wrap">
                        <div className="footer-grid">
                            <div>
                                <TLink className="footer-logo" href="/"><img src="/images/pti-logo-white.svg" alt="PTI Development" style={{ height: 64 }} /></TLink>
                                <p style={{ marginTop: 24, maxWidth: '34ch', opacity: 0.7 }}>Shaping Dreams into Homes. {site.tagline}</p>
                            </div>
                            <div>
                                <h4>Links</h4>
                                <div className="footer-links">{NAV.map(([h, t]) => <TLink key={h} href={h}>{t}</TLink>)}</div>
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
                            {socials.length > 0 && (
                                <div className="socials">{socials.map(([href, label, icon]) => <a key={label} href={href} target="_blank" rel="noopener" aria-label={label}>{icon}</a>)}</div>
                            )}
                        </div>
                    </div>
                </footer>

                <div className={`modal ${video ? 'is-open' : ''}`} onClick={(e) => e.target === e.currentTarget && setVideo(null)}>
                    <button className="modal-close" aria-label="Close video" onClick={() => setVideo(null)}>✕</button>
                    <div className="modal-box">
                        {video && <iframe src={`https://www.youtube-nocookie.com/embed/${video}?autoplay=1&rel=0`} title="PTI project video" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />}
                    </div>
                </div>

                <div className="floors-curtain" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <i key={i} />)}</div>

                {showLoader && !loaderGone && (
                    <div className="loader" ref={loaderRef}>
                        <div className="loader-inner">
                            <svg viewBox="0 0 74 92"><path d="M0.00454068 18.3256H0V73.5928H18.4044V92H36.827V91.9728H73.5949V55.1674V18.3619H73.6085V0H0.00908136V18.3256H0.00454068ZM18.4271 18.3619H55.195V55.1674H36.7997V73.5701H18.4271V18.3619Z" pathLength="1" /></svg>
                            <div className="loader-bar"><i></i></div>
                            <div className="loader-count">LAYING FOUNDATION <span>000</span></div>
                        </div>
                    </div>
                )}
            </div>
        </SiteCtx.Provider>
    );
}
