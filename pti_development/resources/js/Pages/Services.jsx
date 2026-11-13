import { Fragment, useEffect, useRef } from 'react';
import { Check } from '../Components/Icons';
import { Btn, Cta, pad, PageHero, Split } from '../Components/Site';
import SiteLayout from '../Layouts/SiteLayout';
import { gsap, prefersReducedMotion, ScrollTrigger } from '../lib/motion';

const STEPS = [
    ['Meet & explore', 'We show you finished and under construction projects and the features of each area.'],
    ['Choose with clarity', 'Transparent pricing and verified land titles, all clear and documented.'],
    ['Secure & sign', 'Detailed contract reviews, proper documentation and no hidden fees.'],
    ['Build & hand over', 'Transparent project updates and handovers as promised.'],
];

export default function Services({ services }) {
    return (
        <SiteLayout title="Services" tower={false}>
            <PageHero crumb="Services" className="svc-hero" video="/videos/services-hero.mp4" style={{ minHeight: '100svh' }} title={['Services Built on', <>Trust &amp; <span className="serif">Expertise</span></>]} />

            <ServiceMorph services={services} />

            <section className="section" data-theme="dark" data-floor="How it works">
                <div className="blueprint-grid"></div>
                <div className="wrap" style={{ position: 'relative' }}>
                    <div className="section-head">
                        <span className="eyebrow" data-reveal>Your journey with PTI</span>
                        <Split>{['From first visit', <>to <span className="serif gold">handover</span></>]}</Split>
                    </div>
                    <div className="process">
                        {STEPS.map(([t, d], i) => (
                            <div className="process-step" key={t}><span className="pn">{pad(i + 1)}</span><h3>{t}</h3><p>{d}</p></div>
                        ))}
                    </div>
                </div>
            </section>

            <Cta />
        </SiteLayout>
    );
}

/* ---------------------------------------------------------------------------
 * "What we do": cinematic scroll-scrubbed organic mask morphing + kinetic typography.
 * A fullscreen pinned stage on a dark architectural backdrop. Each service shows a large serif
 * statement on the left and two architectural photos inside asymmetric, softly curved masks on the
 * right. Scrolling (GSAP ScrollTrigger, scrub) lifts the heading out line by line while the masks
 * morph into the next service's outlines; the next photos grow out of the morphing masks and the next
 * heading rises in line by line. Images scale and drift in parallax the whole way through.
 * Below 901px every service animates on its own as it scrolls past; reduced motion gets a static stack.
 * ------------------------------------------------------------------------- */
// HD photos used while a service has no image of its own
const HD_IMGS = ['/images/hd/dusk-tower.webp', '/images/hd/land.webp', '/images/hd/construction.webp'];
const SIDE_IMGS = ['/images/craft-living.webp', '/images/hd/skyline.webp', '/images/hd/night-render.webp'];
const BG_IMG = '/images/hero-tower-dusk.webp';
const imgFor = (s, i) => s.image_url || HD_IMGS[i % HD_IMGS.length];

// mask outlines per service: four corners as fractions of the mask box (tl, tr, br, bl)
const BIG = [
    [[0.16, 0], [1, 0], [0.95, 1], [0, 0.74]],
    [[0, 0.08], [0.88, 0], [1, 0.86], [0.12, 1]],
    [[0.1, 0.14], [1, 0], [0.9, 1], [0, 0.88]],
];
const SMALL = [
    [[0, 0], [0.6, 0.06], [1, 0.84], [0.16, 1]],
    [[0.14, 0], [1, 0.16], [0.84, 1], [0, 0.8]],
    [[0, 0.18], [0.78, 0], [1, 1], [0.08, 0.86]],
];
const RADIUS = 0.15; // corner curve, as a share of the mask's shorter side
const SCROLL_PER_STEP = 1.5; // viewport heights of scroll per service change

function organicPath(corners, w, h, r) {
    const P = corners.map(([x, y]) => [x * w, y * h]);
    const out = [];
    const n = P.length;
    for (let i = 0; i < n; i++) {
        const c = P[i], a = P[(i + n - 1) % n], b = P[(i + 1) % n];
        const da = Math.max(Math.hypot(a[0] - c[0], a[1] - c[1]), 0.001), db = Math.max(Math.hypot(b[0] - c[0], b[1] - c[1]), 0.001);
        const rr = Math.min(r, da / 2, db / 2);
        const p1 = [c[0] + ((a[0] - c[0]) / da) * rr, c[1] + ((a[1] - c[1]) / da) * rr];
        const p2 = [c[0] + ((b[0] - c[0]) / db) * rr, c[1] + ((b[1] - c[1]) / db) * rr];
        for (let k = 0; k <= 10; k++) {
            const t = k / 10, u = 1 - t;
            out.push([u * u * p1[0] + 2 * u * t * c[0] + t * t * p2[0], u * u * p1[1] + 2 * u * t * c[1] + t * t * p2[1]]);
        }
    }
    return `polygon(${out.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`;
}
const mixShape = (A, B, t) => A.map((p, i) => [p[0] + (B[i][0] - p[0]) * t, p[1] + (B[i][1] - p[1]) * t]);
const collapse = (S) => S.map(([x]) => [x, 1]); // flattened onto the bottom edge (zero area)

function Words({ text }) {
    return String(text || '').split(/\s+/).filter(Boolean).map((w, i) => (
        <Fragment key={i}><span className="sm-w"><span>{w}</span></span>{' '}</Fragment>
    ));
}

function ServiceMorph({ services }) {
    const ref = useRef(null);
    const list = services.slice(0, 3);

    useEffect(() => {
        const sec = ref.current;
        if (!sec || !list.length || prefersReducedMotion()) return;
        let mm = null, dead = false;
        const q = (sel, root = sec) => Array.from(root.querySelectorAll(sel));

        const panelData = (p, i) => ({
            p,
            i,
            // group the heading's words into the lines they wrapped onto
            lines: Object.values(q('.sm-head .sm-w', p).reduce((acc, w) => {
                (acc[w.offsetTop] = acc[w.offsetTop] || []).push(w.firstElementChild);
                return acc;
            }, {})),
            bits: q('.sm-eyebrow, .sm-list li, .sm-cta', p),
            masks: q('.sm-mask', p).map((el, k) => ({ el, img: el.querySelector('img'), shapes: k ? SMALL : BIG, w: 0, h: 0, c: null })),
        });
        const measure = (d) => d.masks.forEach((m) => { m.w = m.el.offsetWidth; m.h = m.el.offsetHeight; });
        const draw = (m, c) => { m.c = c; m.el.style.clipPath = organicPath(c, m.w, m.h, Math.min(m.w, m.h) * RADIUS); };
        const shapeOf = (m, i) => m.shapes[i % m.shapes.length];
        const prime = (d) => {
            measure(d);
            gsap.set(d.lines.flat(), { yPercent: 110 });
            gsap.set(d.bits, { y: 30, opacity: 0 });
            gsap.set(d.masks.map((m) => m.img), { scale: 1.22 });
            d.masks.forEach((m) => draw(m, collapse(shapeOf(m, d.i))));
        };
        // heading rises line by line, masks grow out of their bottom edge into this service's outlines
        const revealIn = (tl, d, at) => {
            d.lines.forEach((ln, L) => tl.to(ln, { yPercent: 0, duration: 0.55, stagger: 0.015, ease: 'power3.out' }, at + L * 0.09));
            tl.to(d.bits, { y: 0, opacity: 1, duration: 0.5, stagger: 0.035, ease: 'power2.out' }, at + 0.3);
            d.masks.forEach((m, k) => {
                const o = { t: 0 }, from = collapse(shapeOf(m, d.i)), to = shapeOf(m, d.i);
                tl.to(o, { t: 1, duration: 0.8, ease: 'power3.inOut', onUpdate: () => draw(m, mixShape(from, to, o.t)) }, at + k * 0.14)
                  .to(m.img, { scale: 1, duration: 0.95, ease: 'power2.out' }, at + k * 0.14);
            });
        };
        // heading lifts away line by line, masks morph toward the next service's outlines
        const revealOut = (tl, d, at) => {
            d.lines.forEach((ln, L) => tl.to(ln, { yPercent: -110, duration: 0.45, stagger: 0.012, ease: 'power3.in' }, at + L * 0.07));
            tl.to(d.bits, { y: -26, opacity: 0, duration: 0.4, stagger: 0.025, ease: 'power2.in' }, at);
            d.masks.forEach((m, k) => {
                const o = { t: 0 }, from = shapeOf(m, d.i), to = shapeOf(m, d.i + 1);
                tl.to(o, { t: 1, duration: 0.9, ease: 'power3.inOut', onUpdate: () => draw(m, mixShape(from, to, o.t)) }, at + k * 0.14)
                  .to(m.img, { scale: 1.12, duration: 1, ease: 'power1.inOut' }, at);
            });
        };

        const desktop = () => {
            sec.classList.add('is-live');
            const stage = sec.querySelector('.sm-stage');
            const data = q('.sm-panel').map(panelData);
            const count = sec.querySelector('.sm-count b');
            const bar = sec.querySelector('.sm-bar i');
            const line = sec.querySelector('.sm-line path');
            const bg = sec.querySelector('.sm-bg img');
            data.forEach((d, i) => { gsap.set(d.p, { zIndex: i + 1 }); prime(d); });
            const redraw = () => data.forEach((d) => { measure(d); d.masks.forEach((m) => m.c && draw(m, m.c)); });

            // 1. entrance: the first service builds itself as the section scrolls into view
            const entry = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 70%', end: 'top top', scrub: 1 } });
            revealIn(entry, data[0], 0);

            // 2. pinned stage: every change of service is driven by scroll progress
            const HOLD = 0.5, MOVE = 1.2;
            const starts = data.slice(1).map((_, i) => HOLD + i * (MOVE + HOLD));
            const steps = Math.max(data.length - 1, 0);
            const tl = gsap.timeline({
                defaults: { ease: 'none' },
                scrollTrigger: {
                    trigger: sec, start: 'top top', end: () => '+=' + window.innerHeight * (steps * SCROLL_PER_STEP + 0.6),
                    pin: stage, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
                    onRefresh: redraw,
                },
                // follows the scrubbed playhead (not the raw scroll), so the counter lands with the visuals
                onUpdate: () => {
                    const t = tl.time();
                    const idx = starts.filter((at) => t > at + MOVE * 0.45).length;
                    if (count) count.textContent = String(idx + 1).padStart(2, '0');
                    data.forEach((d, i) => d.p.classList.toggle('is-active', i === idx));
                },
            });
            starts.forEach((at, i) => {
                revealOut(tl, data[i], at);
                revealIn(tl, data[i + 1], at + MOVE * 0.38);
                // once the next service fully covers it, retire the old one so its edges never peek out later
                tl.set(data[i].p, { autoAlpha: 0 }, at + MOVE * 0.38 + 1);
            });
            tl.to({}, { duration: HOLD });
            const total = tl.duration();
            // continuous depth: photos drift at different speeds, the backdrop slower still
            data.forEach((d) => d.masks.forEach((m, k) => tl.fromTo(m.el, { yPercent: k ? 7 : 3 }, { yPercent: k ? -7 : -3, duration: total }, 0)));
            if (bg) tl.fromTo(bg, { yPercent: -5 }, { yPercent: 5, duration: total }, 0);
            if (bar) tl.fromTo(bar, { scaleX: 1 / data.length }, { scaleX: 1, duration: total }, 0);
            if (line) tl.fromTo(line, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: total }, 0);
            data[0].p.classList.add('is-active');

            return () => {
                sec.classList.remove('is-live');
                data.forEach((d) => { d.p.classList.remove('is-active'); d.masks.forEach((m) => { m.el.style.clipPath = ''; }); });
            };
        };

        const mobile = () => {
            sec.classList.add('is-stack');
            const data = q('.sm-panel').map(panelData);
            data.forEach((d) => {
                prime(d);
                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: d.p, start: 'top 85%', end: 'center 55%', scrub: 1,
                        onRefresh: () => { measure(d); d.masks.forEach((m) => m.c && draw(m, m.c)); },
                    },
                });
                revealIn(tl, d, 0);
                d.masks.forEach((m, k) => gsap.fromTo(m.el, { yPercent: k ? 8 : 3 }, { yPercent: k ? -8 : -3, ease: 'none', scrollTrigger: { trigger: d.p, start: 'top bottom', end: 'bottom top', scrub: true } }));
            });
            return () => {
                sec.classList.remove('is-stack');
                data.forEach((d) => d.masks.forEach((m) => { m.el.style.clipPath = ''; }));
            };
        };

        // build once the fonts are in, so the heading's line breaks are final
        (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
            if (dead) return;
            mm = gsap.matchMedia();
            mm.add({ desk: '(min-width: 901px)', mob: '(max-width: 900px)' }, (ctx) => (ctx.conditions.desk ? desktop() : mobile()));
            ScrollTrigger.refresh();
        });
        return () => { dead = true; mm && mm.revert(); };
    }, [services]);

    return (
        <section className="svc-morph" data-theme="dark" data-floor="What we do" ref={ref}>
            <div className="sm-stage">
                <div className="sm-bg" aria-hidden="true"><img src={BG_IMG} alt="" /></div>
                <svg className="sm-line" viewBox="0 0 300 900" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M-10 20 C 90 60 150 150 120 260 S 30 470 120 600 S 260 800 210 910" pathLength="1" />
                </svg>
                {list.map((s, i) => (
                    <article className="sm-panel" key={s.id}>
                        <div className="sm-copy">
                            <h2 className="sm-eyebrow">{s.title}</h2>
                            <p className="sm-head"><Words text={s.description} /></p>
                            <ul className="svc-list sm-list">{(s.points || []).map((p) => <li key={p}><Check />{p}</li>)}</ul>
                            <div className="sm-cta"><Btn href="/projects" className="ghost">Our Projects</Btn></div>
                        </div>
                        <div className="sm-media">
                            <div className="sm-mask sm-big"><img src={imgFor(s, i)} alt={s.title} decoding="async" /></div>
                            <div className="sm-mask sm-small"><img src={SIDE_IMGS[i % SIDE_IMGS.length]} alt="" decoding="async" /></div>
                        </div>
                    </article>
                ))}
                <div className="sm-progress" aria-hidden="true">
                    <span className="sm-bar"><i></i></span>
                    <span className="sm-count"><b>01</b> / {pad(list.length)}</span>
                </div>
            </div>
        </section>
    );
}
