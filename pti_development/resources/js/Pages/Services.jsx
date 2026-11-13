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

            <Journey />

            <Cta />
        </SiteLayout>
    );
}

/* ---------------------------------------------------------------------------
 * "What we do": scroll-scrubbed square image reveal with kinetic typography, on lavender.
 * Each service shows a large serif statement on the left and its photo as a sharp square on the right.
 * Scrolling (GSAP ScrollTrigger, scrub) lifts the heading out line by line while the square folds down,
 * then the next heading rises line by line and its photo grows up into the square. Below 901px each
 * service reveals as it scrolls past; reduced motion gets a static stack.
 * ------------------------------------------------------------------------- */
// HD photos used while a service has no image of its own
const HD_IMGS = ['/images/hd/dusk-tower.webp', '/images/hd/land.webp', '/images/hd/construction.webp'];
const imgFor = (s, i) => s.image_url || HD_IMGS[i % HD_IMGS.length];

const SQUARE = 0.82; // the photo square, as a share of the media area's shorter side

function roundedPoly(P, r) {
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
const mixPts = (A, B, t) => A.map((p, i) => [p[0] + (B[i][0] - p[0]) * t, p[1] + (B[i][1] - p[1]) * t]);

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

        // the photo square, centred in the media area; `flat` folds it onto its bottom edge
        const square = (m, flat = false) => () => {
            const s = Math.min(m.w, m.h) * SQUARE, sx = (m.w - s) / 2, sy = (m.h - s) / 2;
            const top = flat ? sy + s : sy;
            return { pts: [[sx, top], [sx + s, top], [sx + s, sy + s], [sx, sy + s]], r: 0 };
        };
        const paint = (m) => { const { pts, r } = m.at(); m.el.style.clipPath = roundedPoly(pts, r); };
        const morph = (tl, m, A, B, pos, dur, ease) => {
            const o = { t: 0 };
            tl.to(o, {
                t: 1, duration: dur, ease,
                onUpdate: () => {
                    m.at = () => { const a = A(), b = B(); return { pts: mixPts(a.pts, b.pts, o.t), r: a.r + (b.r - a.r) * o.t }; };
                    paint(m);
                },
            }, pos);
        };

        const panelData = (p, i) => ({
            p,
            i,
            // group the heading's words into the lines they wrapped onto
            lines: Object.values(q('.sm-head .sm-w', p).reduce((acc, w) => {
                (acc[w.offsetTop] = acc[w.offsetTop] || []).push(w.firstElementChild);
                return acc;
            }, {})),
            bits: q('.sm-eyebrow, .sm-list li, .sm-cta', p),
            masks: q('.sm-mask', p).map((el) => ({ el, img: el.querySelector('img'), w: 0, h: 0, at: null })),
        });
        const measure = (d) => d.masks.forEach((m) => { m.w = m.el.offsetWidth; m.h = m.el.offsetHeight; });
        const repaint = (d) => { measure(d); d.masks.forEach((m) => m.at && paint(m)); };
        const prime = (d) => {
            measure(d);
            gsap.set(d.lines.flat(), { yPercent: 110 });
            gsap.set(d.bits, { y: 30, opacity: 0 });
            gsap.set(d.masks.map((m) => m.img), { scale: 1.2 });
            d.masks.forEach((m) => { m.at = square(m, true); paint(m); });
        };
        // heading rises line by line, the photo grows up into its square
        const revealIn = (tl, d, at) => {
            d.lines.forEach((ln, L) => tl.to(ln, { yPercent: 0, duration: 0.55, stagger: 0.015, ease: 'power3.out' }, at + L * 0.09));
            tl.to(d.bits, { y: 0, opacity: 1, duration: 0.5, stagger: 0.035, ease: 'power2.out' }, at + 0.3);
            d.masks.forEach((m) => morph(tl, m, square(m, true), square(m), at, 0.8, 'power3.inOut'));
            tl.to(d.masks.map((m) => m.img), { scale: 1, duration: 0.95, ease: 'power2.out' }, at);
        };
        // heading lifts away line by line, the square folds down out of view
        const revealOut = (tl, d, at) => {
            d.lines.forEach((ln, L) => tl.to(ln, { yPercent: -110, duration: 0.45, stagger: 0.012, ease: 'power3.in' }, at + L * 0.07));
            tl.to(d.bits, { y: -26, opacity: 0, duration: 0.4, stagger: 0.025, ease: 'power2.in' }, at);
            d.masks.forEach((m) => morph(tl, m, square(m), square(m, true), at, 0.75, 'power3.in'));
            tl.to(d.masks.map((m) => m.img), { scale: 1.08, duration: 0.8, ease: 'power1.in' }, at);
        };

        const desktop = () => {
            sec.classList.add('is-live');
            const stage = sec.querySelector('.sm-stage');
            const data = q('.sm-panel').map(panelData);
            data.forEach((d, i) => { gsap.set(d.p, { zIndex: i + 1 }); prime(d); });

            // 1. entrance: the first service's heading and photo build as the section scrolls into view
            const entry = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 70%', end: 'top top', scrub: 1 } });
            revealIn(entry, data[0], 0);

            // 2. pinned stage: hand over from service to service, all on scroll progress
            const HOLD = 0.45, MOVE = 1.4;
            const changes = [];
            const tl = gsap.timeline({
                defaults: { ease: 'none' },
                // follows the scrubbed playhead (not the raw scroll), so the active service lands with the visuals
                onUpdate: () => {
                    const t = tl.time();
                    const idx = changes.filter((at) => t > at + MOVE * 0.4).length;
                    data.forEach((d, i) => d.p.classList.toggle('is-active', i === idx));
                },
            });
            let c = 0.3;
            data.forEach((d, i) => {
                c += HOLD * 2;
                if (i < data.length - 1) {
                    changes.push(c);
                    revealOut(tl, d, c);
                    revealIn(tl, data[i + 1], c + 0.45);
                    tl.set(d.p, { autoAlpha: 0 }, c + 0.45 + 1); // retire it once fully replaced
                    c += MOVE + 0.2;
                }
            });
            tl.to({}, { duration: HOLD }, c);
            const total = tl.duration();
            // the photo drifts gently the whole way through
            data.forEach((d) => tl.fromTo(d.masks.map((m) => m.img), { yPercent: 3 }, { yPercent: -3, duration: total }, 0));
            ScrollTrigger.create({
                animation: tl, trigger: sec, start: 'top top', end: () => '+=' + window.innerHeight * total * 0.55,
                pin: stage, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
                onRefresh: () => data.forEach(repaint),
            });
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
                    scrollTrigger: { trigger: d.p, start: 'top 80%', end: 'bottom 70%', scrub: 1, onRefresh: () => repaint(d) },
                });
                revealIn(tl, d, 0);
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
        <section className="svc-morph" data-theme="light" data-floor="What we do" ref={ref}>
            <div className="sm-stage">
                {list.map((s, i) => (
                    <article className="sm-panel" key={s.id}>
                        <div className="sm-copy">
                            <h2 className="sm-eyebrow">{s.title}</h2>
                            <p className="sm-head"><Words text={s.description} /></p>
                            <ul className="svc-list sm-list">{(s.points || []).map((p) => <li key={p}><Check />{p}</li>)}</ul>
                            <div className="sm-cta"><Btn href="/projects" className="ghost">Our Projects</Btn></div>
                        </div>
                        <div className="sm-media">
                            <div className="sm-mask"><img src={imgFor(s, i)} alt={s.title} decoding="async" /></div>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

/* ---------------------------------------------------------------------------
 * "How it works": panoramic construction backdrop. On desktop the section pins while the gold
 * line fills from the first step's dot through the last one to the end of the row, and the panorama
 * pans sideways in step with it; each dot lights up as the line reaches it. On smaller screens the panorama just drifts.
 * ------------------------------------------------------------------------- */
const JOURNEY_IMG = '/images/journey-panorama.webp';

function Journey() {
    const ref = useRef(null);

    useEffect(() => {
        const sec = ref.current;
        if (!sec || prefersReducedMotion()) return;
        let mm = null, dead = false;
        const build = () => {
            if (dead) return;
            const img = sec.querySelector('.jr-bg img');
            const fill = sec.querySelector('.jr-fill');
            const steps = Array.from(sec.querySelectorAll('.process-step'));
            const pan = () => -Math.max(0, img.offsetWidth - sec.offsetWidth);
            mm = gsap.matchMedia();
            mm.add('(min-width: 861px)', () => {
                sec.classList.add('is-live');
                // the line runs the full width: dots sit at 0, 25, 50, 75 %, then it fills the rest before unpinning
                const light = (p) => steps.forEach((st, i) => st.classList.toggle('is-on', p >= i / steps.length - 0.001));
                const tl = gsap.timeline({
                    defaults: { ease: 'none' },
                    scrollTrigger: {
                        trigger: sec, start: 'top top', end: () => '+=' + window.innerHeight * 1.4,
                        pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
                    },
                    onUpdate: () => light(tl.progress()),
                });
                tl.fromTo(fill, { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)
                  .fromTo(img, { x: 0 }, { x: pan, duration: 1 }, 0);
                light(0);
                return () => { sec.classList.remove('is-live'); steps.forEach((st) => st.classList.remove('is-on')); };
            });
            mm.add('(max-width: 860px)', () => {
                gsap.fromTo(img, { x: 0 }, { x: pan, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
            });
            ScrollTrigger.refresh();
        };
        // build after the services stage above (it waits for fonts), so pin spacing is measured in page order
        (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(build));
        return () => { dead = true; mm && mm.revert(); };
    }, []);

    return (
        <section className="section journey" data-theme="dark" data-floor="How it works" ref={ref}>
            <div className="jr-bg" aria-hidden="true"><img src={JOURNEY_IMG} alt="" decoding="async" /></div>
            <div className="blueprint-grid"></div>
            <div className="wrap" style={{ position: 'relative' }}>
                <div className="section-head">
                    <Split>{['From first visit', <>to <span className="serif gold">handover</span></>]}</Split>
                </div>
                <div className="process">
                    <span className="jr-fill" aria-hidden="true"></span>
                    {STEPS.map(([t, d], i) => (
                        <div className="process-step" key={t}><span className="pn">{pad(i + 1)}</span><h3>{t}</h3><p>{d}</p></div>
                    ))}
                </div>
            </div>
        </section>
    );
}
