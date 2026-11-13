import { Head, usePage } from '@inertiajs/react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { claimPreloader, LogoPreloader, MenuDropdown, SiteFooter, TLink } from '../Components/Site';
import { initMotion, playLoader, prefersReducedMotion, revealCurtain, ScrollTrigger } from '../lib/motion';
import RisingTower from '../lib/tower';

const SiteCtx = createContext({ openVideo: () => {} });
export const useSite = () => useContext(SiteCtx);

/* ---------- header in the landing page's style: the rotating ring badge (top left, back to Home) and the stacked menu
   (top right). Its colour follows the section under it: white on dark sections, navy on light ones. The ring turns
   slowly and speeds up with the scroll. The Menu dropdown is the same component the landing page uses. ---------- */
const MARK = 'M0.00454068 18.3256H0V73.5928H18.4044V92H36.827V91.9728H73.5949V55.1674V18.3619H73.6085V0H0.00908136V18.3256H0.00454068ZM18.4271 18.3619H55.195V55.1674H36.7997V73.5701H18.4271V18.3619Z';
function SiteChrome() {
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
            el.classList.toggle('on-light', light);
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
            <MenuDropdown />
        </div>
    );
}

/** The Rising Tower is off across the site; `tower` (true) would bring it back and reserve its right-hand lane. */
export default function SiteLayout({ title, children, tower: withTower = false }) {
    const page = usePage();
    const site = page.props.site || {};
    const url = page.url;
    const mainRef = useRef(null);
    const loaderRef = useRef(null);
    const motionRef = useRef(null);
    const [video, setVideo] = useState(null);
    // the logo preloader plays on every fresh page load (not on moves inside the site)
    const [showLoader] = useState(() => !prefersReducedMotion() && claimPreloader());
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
        document.documentElement.classList.toggle('no-tower', !withTower);
        const tower = withTower && sections.length ? new RisingTower(sections, { onFloorClick: (s) => motion.scrollTo(s) }) : null;
        const timers = [];
        /* a link like /about#vision: once the page has settled, glide to that section. Inside a pinned stage the
           pin's own spacer is the target; data-hash-offset (screen heights) scrolls a little into the pin. */
        const toHash = () => {
            const id = decodeURIComponent(window.location.hash.slice(1));
            const el = id && document.getElementById(id);
            if (!el) return;
            ScrollTrigger.refresh();
            const box = el.closest('.pin-spacer') || el;
            const y = box.getBoundingClientRect().top + window.scrollY + (+el.dataset.hashOffset || 0) * window.innerHeight;
            if (motion.lenis) motion.lenis.scrollTo(y, { duration: 1.8 });
            else window.scrollTo({ top: y, behavior: 'smooth' });
        };
        const start = () => {
            motion.intro.play();
            timers.push(setTimeout(() => tower && tower.start(), 700));
            timers.push(setTimeout(toHash, 900));
        };

        const fromNav = sessionStorage.getItem('pti-nav') === '1';
        sessionStorage.removeItem('pti-nav');
        let loaderTl;
        if (showLoader && loaderRef.current) {
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
            document.documentElement.classList.remove('no-tower');
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

    /* ---------- magnetic buttons (the system mouse pointer is used as is) ---------- */
    useEffect(() => {
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
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
        document.addEventListener('mousemove', magMove);
        document.addEventListener('mouseout', magOut);
        return () => {
            document.removeEventListener('mousemove', magMove);
            document.removeEventListener('mouseout', magOut);
        };
    }, []);

    /* ---------- modal locks scrolling ---------- */
    useEffect(() => {
        const lenis = motionRef.current && motionRef.current.lenis;
        if (lenis) (video ? lenis.stop() : lenis.start());
    }, [video]);

    useEffect(() => {
        const esc = (e) => e.key === 'Escape' && setVideo(null);
        addEventListener('keydown', esc);
        return () => removeEventListener('keydown', esc);
    }, []);

    return (
        <SiteCtx.Provider value={{ openVideo: setVideo }}>
            <Head title={title} />
            <div className="site">
                <SiteChrome />

                <main ref={mainRef}>{children}</main>

                <SiteFooter site={site} />

                <div className={`modal ${video ? 'is-open' : ''}`} onClick={(e) => e.target === e.currentTarget && setVideo(null)}>
                    <button className="modal-close" aria-label="Close video" onClick={() => setVideo(null)}>✕</button>
                    <div className="modal-box">
                        {video && <iframe src={`https://www.youtube-nocookie.com/embed/${video}?autoplay=1&rel=0`} title="PTI project video" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />}
                    </div>
                </div>

                {showLoader && !loaderGone && <LogoPreloader ref={loaderRef} />}
            </div>
        </SiteCtx.Provider>
    );
}
