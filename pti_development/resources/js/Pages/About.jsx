import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Odometer, Split, TLink } from '../Components/Site';
import SiteLayout from '../Layouts/SiteLayout';
import { initLuxSections } from '../lib/lux';
import { prefersReducedMotion, ScrollTrigger } from '../lib/motion';
import { Quote, Values } from './Home';

/* ---------- About hero (after almarishomes.com): a full-screen photo with the title; on scroll the stage pins, the title
   lifts away, the photo shrinks to the right and its top rises into the landing page's pointed door, and the story
   rises in on the left. Below 1000px / reduced motion it is a plain photo hero with the story underneath. ---------- */
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;

/* door outline in the box (w x h). k = 0: a plain rectangle; k = 1: the landing page's pointed arch (rise 0.58 w,
   two circular arcs of r = 0.5864 w, here as one cubic each). In between the control points blend smoothly. */
function doorPath(w, h, k) {
    const f = (n) => n.toFixed(2);
    const rise = 0.58 * w * k;
    const p1 = [0, lerp(0, 0.2896 * w, k)], p1f = [w / 6, 0];
    const p2 = [lerp(w / 3, 0.2128 * w, k), lerp(0, 0.0428 * w, k)];
    const c1 = [lerp(p1f[0], p1[0], k), p1[1]];
    const ax = w / 2;
    return `M0 ${f(h)} L0 ${f(rise)} C${f(c1[0])} ${f(c1[1])} ${f(p2[0])} ${f(p2[1])} ${f(ax)} 0 `
        + `C${f(w - p2[0])} ${f(p2[1])} ${f(w - c1[0])} ${f(c1[1])} ${f(w)} ${f(rise)} L${f(w)} ${f(h)} Z`;
}

function AboutHero() {
    const ref = useRef(null);
    useEffect(() => {
        const sec = ref.current;
        const door = sec.querySelector('.ab-door');
        const img = door.querySelector('img');
        const inner = door.querySelector('.ab-door-in');
        const shade = sec.querySelector('.ab-shade');
        const intro = sec.querySelector('.ab-intro');
        const introLines = sec.querySelectorAll('.ab-intro .line-mask > span');
        const introRest = sec.querySelectorAll('.ab-intro [data-in]');
        const measure = sec.querySelector('.ab-measure');
        const storyWrap = sec.querySelector('.ab-story-wrap');
        const lines = sec.querySelectorAll('.ab-story .line-mask > span');
        const paras = sec.querySelectorAll('.ab-story p');

        /* entrance on load (both layouts) */
        const enter = gsap.timeline({ delay: 0.35 })
            .fromTo(introLines, { yPercent: 110 }, { yPercent: 0, duration: 1.3, stagger: 0.1, ease: 'expo.out' }, 0)
            .fromTo(introRest, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out' }, 0.35)
            .fromTo(img, { scale: 1.18 }, { scale: 1, duration: 2.2, ease: 'expo.out' }, 0);

        const canAnimate = () => !prefersReducedMotion() && innerWidth >= 1000 && innerHeight >= 600;
        let st = null, target = 0, cur = 0, painted = -1;

        const render = (p) => {
            const W = sec.clientWidth, H = innerHeight;
            const wr = measure.getBoundingClientRect();
            const w1 = wr.width * 0.44, h1 = Math.min(H * 0.78, w1 * 1.5);
            const x1 = wr.right - wr.left - w1 + (wr.left - sec.getBoundingClientRect().left), y1 = (H - h1) / 2 + 30;
            const m = ease(seg(p, 0.06, 0.7));
            const k = ease(seg(p, 0.28, 0.8));
            const x = lerp(0, x1, m), y = lerp(0, y1, m), w = lerp(W, w1, m), h = lerp(H, h1, m);
            Object.assign(door.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px`, clipPath: `path('${doorPath(w, h, k)}')` });
            inner.style.transform = `scale(${1 + 0.08 * (1 - m)})`;
            shade.style.opacity = 1 - seg(p, 0, 0.4);
            const t = ease(seg(p, 0, 0.3));
            intro.style.opacity = 1 - t;
            intro.style.transform = `translateY(${-70 * t}px)`;
            intro.style.filter = t > 0.001 ? `blur(${8 * t}px)` : '';
            intro.style.visibility = t >= 1 ? 'hidden' : '';
            lines.forEach((l, i) => { l.style.transform = `translateY(${110 * (1 - ease(seg(p, 0.55 + i * 0.05, 0.8 + i * 0.05)))}%)`; });
            paras.forEach((el, i) => {
                const q = ease(seg(p, 0.66 + i * 0.06, 0.9 + i * 0.05));
                el.style.opacity = q;
                el.style.transform = `translateY(${40 * (1 - q)}px)`;
            });
            sec.dataset.theme = p > 0.42 ? 'light' : 'dark'; // header colour follows the background under it
        };
        const clear = () => {
            [door, inner, shade, intro, ...lines, ...paras].forEach((el) => el.removeAttribute('style'));
            sec.dataset.theme = 'dark';
        };
        const tick = () => {
            cur += (target - cur) * 0.14;
            if (Math.abs(target - cur) < 0.0005) cur = target;
            if (cur !== painted) { painted = cur; render(cur); }
        };
        const setup = () => {
            const on = canAnimate();
            if (on === !!st) { if (!on) storyWrap.dataset.theme = 'light'; return; }
            // static layout: the story sits on lavender below the photo, so the header reads it as light
            if (on) delete storyWrap.dataset.theme; else storyWrap.dataset.theme = 'light';
            if (on) {
                sec.classList.add('ab-anim');
                st = ScrollTrigger.create({ trigger: sec, start: 'top top', end: '+=180%', pin: sec.querySelector('.ab-stage'), onUpdate: (s) => { target = s.progress; } });
                target = cur = st.progress; painted = -1;
                gsap.ticker.add(tick);
                tick();
            } else {
                gsap.ticker.remove(tick);
                st.kill(); st = null;
                sec.classList.remove('ab-anim');
                clear();
            }
            ScrollTrigger.refresh();
        };
        setup();
        const onResize = () => { setup(); painted = -1; };
        addEventListener('resize', onResize);
        return () => {
            removeEventListener('resize', onResize);
            gsap.ticker.remove(tick);
            st && st.kill();
            enter.kill();
        };
    }, []);

    return (
        <section className="ab-hero" data-theme="dark" data-floor="About" ref={ref}>
            <div className="ab-stage">
                <div className="wrap ab-measure" aria-hidden="true" />
                <div className="ab-door">
                    <div className="ab-door-in"><img src="/images/rooftop-dusk.webp" alt="PTI Development building rooftop at dusk" /></div>
                    <div className="ab-shade" />
                </div>
                <div className="ab-intro">
                    <div className="crumbs" data-in><TLink href="/">Home</TLink><span>/</span><span>About</span></div>
                    <h1>
                        {['Our Legacy of', 'Construction', <span className="serif" key="s">Excellence</span>].map((l, i) => (
                            <span className="line-mask" key={i}><span>{l}</span></span>
                        ))}
                    </h1>
                    <p className="lead" data-in>From modern property development to land share investment and full legal support, PTI delivers end-to-end solutions for Dhaka's real estate market.</p>
                </div>
                <div className="ab-story-wrap">
                    <div className="ab-story">
                        <h2 className="h2">
                            <span className="line-mask"><span>Shaping Dhaka's</span></span>
                            <span className="line-mask"><span className="serif">Skyline</span></span>
                        </h2>
                        <p>PTI Development’s journey began with a clear vision: to elevate living and working spaces in Dhaka through uncompromising quality and integrity. From our first residential project to our expansive mixed-use developments, our journey has been fueled by a commitment to our clients’ aspirations and the sustainable growth of our communities. Every project is a milestone in our legacy of excellence.</p>
                        <p>Led by <span className="leader">Md. Ruhul Amin</span>, a visionary entrepreneur, we are shaping Dhaka’s skyline with projects that combine affordability, transparency, and world-class design. Every square foot we build is a commitment — to trust, to safety, and to the dreams of our clients.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* The landing page's "vision" rows (same pinned, scrubbed travel from the right), on a construction photo:
   only the travelling lines are kept. Motion: the .lx-vision block in lib/lux.js. */
function AboutVision() {
    return (
        <section className="lx-vision lx-vision--photo" data-tone="dark">
            <div className="v-photo" aria-hidden="true"><img src="/images/hd/construction.webp" alt="" loading="lazy" /></div>
            <div className="rows disp">
                <div className="label micro">Our vision</div>
                <div className="row">PTI is shaping Dhaka's skyline with projects</div>
                <div className="row">that combine affordability, transparency</div>
                <div className="row">and world-class design, square foot by square foot</div>
            </div>
        </section>
    );
}

/* Our vision -> What we stand for as one sideways track (like the landing page's "Our Projects" strip): the stage
   pins and everything moves continuously with the scroll. While the vision rows are still travelling towards their
   end, the whole vision page (photo and all) is already sliding left and "What we stand for" comes in from the side;
   then its list highlights and the cream arch rises; only after that does the page scroll on to the quote.
   Vision and values keep lib/lux.js's motions and scroll lengths (180%; 45% per item + 80%); the slide (110%) overlaps
   the last part of the vision rows. Phones / reduced motion: the two sections stack and lux.js animates them as before. */
function AboutTrack({ values }) {
    const ref = useRef(null);
    useEffect(() => {
        const wrap = ref.current;
        const mm = gsap.matchMedia();
        mm.add({ desk: '(min-width: 861px) and (prefers-reduced-motion: no-preference)', other: '(max-width: 860px), (prefers-reduced-motion: reduce)' }, (c) => {
            if (c.conditions.other) return initLuxSections(wrap);
            wrap.classList.add('ab-track-on');
            const track = wrap.querySelector('.ab-track');
            const vision = wrap.querySelector('.lx-vision');
            const vals = wrap.querySelector('.lx-values');
            const rows = [...vision.querySelectorAll('.row')];
            const items = [...vals.querySelectorAll('.list li')];
            const texts = [...vals.querySelectorAll('.text .disp')];

            /* values: one text at a time, the matching list item lit (as in lux.js) */
            let vcur = -1;
            const setVal = (i) => {
                if (i === vcur) return;
                items.forEach((li, k) => li.classList.toggle('on', k === i));
                texts.forEach((t, k) => gsap.to(t, { opacity: k === i ? 1 : 0, y: k === i ? 0 : (k < i ? -20 : 20), duration: 0.7, ease: 'lux', overwrite: true }));
                vcur = i;
            };
            texts.forEach((t, k) => gsap.set(t, { opacity: k ? 0 : 1, position: k ? 'absolute' : 'relative', top: k ? 0 : 'auto', left: 0, right: 0 }));
            setVal(0);

            const V = 1.8, S = 1.1, A = (items.length * 45 + 80) / 100; // scroll lengths in screen heights
            const S0 = V * 0.72;          // the slide starts while the rows are still travelling
            const A0 = S0 + S;            // values part starts when the slide is done
            const total = A0 + A;
            const tl = gsap.timeline({
                defaults: { ease: 'none' },
                scrollTrigger: {
                    trigger: wrap, start: 'top top', end: () => `+=${total * 100}%`, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
                    onUpdate: (self) => {
                        const p = (self.progress * total - A0) / A; // progress through the values part
                        setVal(p <= 0 ? 0 : Math.min(items.length - 1, Math.floor((p / 0.78) * items.length)));
                    },
                },
            });
            /* 1. vision: the three rows travel in from the right, the photo eases out, the label fades in */
            rows.forEach((r, i) => {
                const from = [40, 62, 28][i] || 40;
                tl.fromTo(r, { x: () => innerWidth * from / 100 }, { x: () => -(r.scrollWidth - innerWidth * 0.62), duration: V }, 0);
            });
            const label = vision.querySelector('.label');
            if (label) tl.fromTo(label, { opacity: 0 }, { opacity: 1, duration: 0.15 * V }, 0);
            tl.fromTo(vision.querySelector('.v-photo img'), { scale: 1.12 }, { scale: 1, duration: V }, 0);
            /* 2. overlapping the rows' last stretch, the strip slides left with the scroll: the vision photo moves out
               to the left and "What we stand for" comes in from the side (linear, so it is one continuous motion) */
            tl.fromTo(track, { x: 0 }, { x: () => -innerWidth, duration: S }, S0);
            /* 3. values: photo settles, then the cream arch rises */
            tl.fromTo(vals.querySelector('.bg img'), { scale: 1.18 }, { scale: 1, duration: S + A }, S0)
                .fromTo(vals.querySelector('.rise'), { yPercent: 100 }, { yPercent: 30, ease: 'luxSoft', duration: 0.22 * A }, A0 + 0.78 * A);

            return () => {
                wrap.classList.remove('ab-track-on');
                gsap.set([track, ...rows, ...texts], { clearProps: 'all' });
            };
        });
        return () => mm.revert();
    }, []);

    return (
        <div className="lx ab-track-wrap" ref={ref}>
            <div className="ab-track">
                <AboutVision />
                <Values values={values} image="/images/hd/night-render.webp" />
            </div>
        </div>
    );
}

export default function About({ values, stats, team, projects = [], services = [], faqs = [], homeStats = [] }) {
    /* the quote is a landing-page (lux) section: same look and scroll motion as there (vision + values: AboutTrack) */
    const quote = useRef(null);
    useEffect(() => (quote.current ? initLuxSections(quote.current) : undefined), []);
    return (
        <SiteLayout title="About" tower={false}>
            <AboutHero />

            {stats.length > 0 && (
                <section className="section lux-gold" data-theme="light" data-floor="In numbers" data-scrub-stats>
                    <div className="wrap">
                        {/* just the numbers (no cards): their digits spin with the scroll (motion.js, data-scrub-stats) */}
                        <div className="numbers-grid">
                            {stats.map((s) => (
                                <div className="stat-plain" key={s.id}>
                                    <Odometer value={s.value} suffix={s.suffix} />
                                    <p>{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <AboutTrack values={values} />

            {team.length > 0 && (
                <section className="section lux-gold" data-theme="light" data-floor="Our people">
                    <div className="wrap">
                        <div className="section-head split">
                            <div>
                                <Split>{['Meet Our', <span className="serif">Visionaries</span>]}</Split>
                            </div>
                        </div>
                        <div className="team-grid">
                            {team.map((m, i) => (
                                <div className={`member ${i < 2 ? 'lead-member' : ''}`} data-reveal key={m.id}>
                                    <div className="member-photo">{m.photo_url && <img src={m.photo_url} alt={m.name} loading="lazy" />}</div>
                                    <div><h3>{m.name}</h3><small>{m.role}</small></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <div className="lx" ref={quote}>
                <Quote flower={false} sideImage="/images/quote-construction.webp" />
            </div>
        </SiteLayout>
    );
}
