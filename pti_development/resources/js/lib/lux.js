/* =========================================================
   Landing page motion system
   initLux(root, { skipIntro }) -> destroy()
   ========================================================= */
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create('lux', '0.19,1,0.22,1');
CustomEase.create('luxInOut', '0.76,0,0.24,1');
CustomEase.create('luxSoft', '0.45,0,0.15,1');

const $ = (s, c) => c.querySelector(s);
const $$ = (s, c) => Array.from(c.querySelectorAll(s));
const isDesktop = () => window.matchMedia('(min-width: 861px)').matches;

/* ---------------- falling petals ---------------- */
class Petals {
    constructor(canvas, srcs, count) {
        this.c = canvas;
        this.ctx = canvas.getContext('2d');
        this.imgs = srcs.map((s) => { const i = new Image(); i.src = s; return i; });
        this.count = count;
        this.p = [];
        this.wind = 0;
        this.running = false;
        this.resize = this.resize.bind(this);
        this.loop = this.loop.bind(this);
        this.resize();
        window.addEventListener('resize', this.resize);
        for (let i = 0; i < count; i++) this.p.push(this.spawn(true));
        this.io = new IntersectionObserver(([e]) => (e.isIntersecting ? this.start() : this.stop()));
        this.io.observe(canvas);
    }
    resize() {
        const r = this.c.getBoundingClientRect();
        this.dpr = Math.min(2, window.devicePixelRatio || 1);
        this.w = r.width; this.h = r.height;
        this.c.width = r.width * this.dpr; this.c.height = r.height * this.dpr;
    }
    spawn(anywhere) {
        const depth = Math.random();
        return {
            x: Math.random() * this.w, y: anywhere ? Math.random() * this.h : -40 - Math.random() * 200,
            vy: 0.35 + depth * 0.9, vx: -0.2 + Math.random() * 0.5, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.03,
            tumble: Math.random() * 6.28, vt: 0.01 + Math.random() * 0.03, s: 0.07 + depth * 0.12, depth,
            img: this.imgs[(Math.random() * this.imgs.length) | 0], sway: Math.random() * 6.28,
        };
    }
    start() { if (!this.running) { this.running = true; this.raf = requestAnimationFrame(this.loop); } }
    stop() { this.running = false; cancelAnimationFrame(this.raf); }
    loop() {
        if (!this.running) return;
        const { ctx } = this;
        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        ctx.clearRect(0, 0, this.w, this.h);
        for (let i = 0; i < this.p.length; i++) {
            const q = this.p[i];
            q.sway += 0.012;
            q.x += q.vx + Math.sin(q.sway) * 0.6 * q.depth + this.wind * q.depth;
            q.y += q.vy;
            q.rot += q.vr; q.tumble += q.vt;
            if (q.y > this.h + 60 || q.x < -80 || q.x > this.w + 80) { this.p[i] = this.spawn(false); continue; }
            if (!q.img.complete || !q.img.naturalWidth) continue;
            const w = q.img.naturalWidth * q.s, h = q.img.naturalHeight * q.s;
            ctx.save();
            ctx.globalAlpha = 0.55 + q.depth * 0.45;
            ctx.translate(q.x, q.y);
            ctx.rotate(q.rot);
            ctx.scale(1, Math.cos(q.tumble));
            ctx.drawImage(q.img, -w / 2, -h / 2, w, h);
            ctx.restore();
        }
        this.wind *= 0.96;
        this.raf = requestAnimationFrame(this.loop);
    }
    destroy() { this.stop(); this.io.disconnect(); window.removeEventListener('resize', this.resize); }
}

/* ---------------- main ---------------- */
export function initLux(root, { skipIntro = false } = {}) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cleanups = [];
    const lenis = new Lenis({ lerp: 0.085, smoothWheel: !reduce });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    cleanups.push(() => { gsap.ticker.remove(raf); lenis.destroy(); window.__lenis = null; });
    lenis.stop();
    window.scrollTo(0, 0);

    const chrome = $('.lx-chrome', root);
    const petalSrc = [1, 2, 3, 4, 5, 6].map((i) => `/images/botanical/petal-${i}.png`);
    const petals = $$('.lx-petals', root).map((c) => new Petals(c, petalSrc, +c.dataset.count || 26));
    cleanups.push(() => petals.forEach((p) => p.destroy()));

    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
        /* ---------- chrome: meter, badge, tone ---------- */
        const bar = $('.lx-meter .bar i', chrome);
        const num = $('.lx-meter .num', chrome);
        const badge = $('.lx-badge .ring', chrome);
        let rot = 0;
        const tones = $$('[data-tone]', root);
        const tick = () => {
            const max = document.documentElement.scrollHeight - innerHeight;
            const p = max > 0 ? lenis.scroll / max : 0;
            bar.style.transform = `scaleY(${p})`;
            num.textContent = String(Math.round(p * 100)).padStart(2, '0');
            rot += 0.12 + Math.min(6, Math.abs(lenis.velocity) * 0.06);
            badge.style.transform = `rotate(${rot}deg)`;
            let tone = 'dark';
            for (const s of tones) {
                const r = s.getBoundingClientRect();
                if (r.top <= 90 && r.bottom > 90) { tone = s.dataset.tone; }
            }
            chrome.classList.toggle('on-light', tone === 'light');
            petals.forEach((pt) => { pt.wind += lenis.velocity * 0.004; });
        };
        gsap.ticker.add(tick);
        cleanups.push(() => gsap.ticker.remove(tick));

        /* ---------- cursor parallax ---------- */
        const layers = $$('[data-depth]', root).map((el) => ({
            d: +el.dataset.depth,
            x: gsap.quickTo(el, 'x', { duration: 1.4, ease: 'power3' }),
            y: gsap.quickTo(el, 'y', { duration: 1.4, ease: 'power3' }),
        }));
        const move = (e) => {
            const mx = e.clientX / innerWidth - 0.5, my = e.clientY / innerHeight - 0.5;
            layers.forEach((l) => { l.x(mx * l.d * 40); l.y(my * l.d * 26); });
        };
        window.addEventListener('mousemove', move);
        cleanups.push(() => window.removeEventListener('mousemove', move));

        /* ---------- perpetual sway of every botanical layer ---------- */
        $$('.lx-flora .sway', root).forEach((el, i) => {
            const amp = +el.closest('.lx-flora').dataset.sway || 2;
            gsap.to(el, { rotation: amp, y: amp * 2, duration: 4.5 + (i % 3) * 1.3, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: -i * 0.9 });
        });

        /* ---------- preloader + hero entrance ---------- */
        const pre = $('.lx-pre', root);
        const hero = $('.lx-hero', root);
        const heroChars = new SplitText($$('.lx-hero .title .disp', root), { type: 'chars', charsClass: 'char' }).chars;
        const heroFlora = $$('.lx-hero .lx-flora', root);
        gsap.set(heroChars, { yPercent: 105, opacity: 0 });
        gsap.set($('.lx-hero .sc', root), { clipPath: 'inset(0 100% 0 0)' });
        gsap.set($$('.lx-hero [data-in]', root), { opacity: 0, y: 24 });
        gsap.set($$('.lx-hot', root), { scale: 0, opacity: 0 });
        heroFlora.forEach((f) => gsap.set(f, { clipPath: `circle(0% at ${f.dataset.anchor || '0% 0%'})`, scale: 0.86, rotation: +f.dataset.turn || 0 }));
        gsap.set($('.lx-hero .media', root), { scale: 1.28 });

        const heroIn = gsap.timeline({ paused: true, onComplete: () => lenis.start() });
        heroIn
            .to($('.lx-hero .media', root), { scale: 1, duration: 3.2, ease: 'lux' }, 0)
            .to(heroChars, { yPercent: 0, opacity: 1, duration: 1.6, stagger: { each: 0.045, from: 'center' }, ease: 'lux' }, 0.25)
            .to($('.lx-hero .sc', root), { clipPath: 'inset(0 0% 0 0)', duration: 2.0, ease: 'luxSoft' }, 0.9)
            .to(heroFlora, { clipPath: (i, el) => `circle(150% at ${el.dataset.anchor || '0% 0%'})`, scale: 1, rotation: 0, duration: 2.8, stagger: 0.18, ease: 'luxSoft' }, 0.2)
            .to($$('.lx-hero [data-in]', root), { opacity: 1, y: 0, duration: 1.3, stagger: 0.08, ease: 'lux' }, 1.2)
            .to($$('.lx-hot', root), { scale: 1, opacity: 1, duration: 1, stagger: 0.15, ease: 'back.out(2)' }, 1.8);

        if (pre && !skipIntro && !reduce) {
            const t1 = new SplitText($$('.lx-pre .t1, .lx-pre .t2', pre), { type: 'chars', charsClass: 'char' }).chars;
            const side = new SplitText($$('.lx-pre .side', pre), { type: 'chars', charsClass: 'char' }).chars;
            const frame = $('.lx-pre .frame path', pre);
            const len = frame.getTotalLength();
            gsap.set(frame, { strokeDasharray: len, strokeDashoffset: len });
            gsap.set(t1, { yPercent: 110, opacity: 0, scaleY: 1.4, transformOrigin: '50% 100%' });
            gsap.set(side, { opacity: 0, y: 10 });
            gsap.set($('.lx-pre .sc', pre), { clipPath: 'inset(0 100% 0 0)' });
            gsap.set($('.lx-pre .vline', pre), { scaleY: 0 });
            gsap.set([$('.lx-pre .emblem', pre), $('.lx-pre .cap', pre), $('.lx-pre .ghost', pre)], { opacity: 0 });
            gsap.timeline()
                .to($('.lx-pre .emblem', pre), { opacity: 1, duration: 1, ease: 'power2.out' }, 0.1)
                .fromTo($('.lx-pre .emblem', pre), { rotate: -90, scale: 0.6 }, { rotate: 0, scale: 1, duration: 1.6, ease: 'lux' }, 0.1)
                .to(frame, { strokeDashoffset: 0, duration: 2.4, ease: 'luxInOut' }, 0.2)
                .to($('.lx-pre .ghost', pre), { opacity: 1, duration: 2.4, ease: 'power1.out' }, 0.3)
                .fromTo($('.lx-pre .ghost', pre), { xPercent: -46 }, { xPercent: -54, duration: 3.6, ease: 'none' }, 0.3)
                .to(t1, { yPercent: 0, opacity: 1, scaleY: 1, duration: 1.3, stagger: { each: 0.05, from: 'center' }, ease: 'lux' }, 0.5)
                .to(side, { opacity: 1, y: 0, duration: 0.8, stagger: 0.06, ease: 'power2.out' }, 1.0)
                .to($('.lx-pre .sc', pre), { clipPath: 'inset(0 0% 0 0)', duration: 1.6, ease: 'luxSoft' }, 1.3)
                .to($('.lx-pre .vline', pre), { scaleY: 1, duration: 1.2, ease: 'lux' }, 1.5)
                .to($('.lx-pre .cap', pre), { opacity: 1, duration: 0.8 }, 1.8)
                .to(pre, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.5, ease: 'luxInOut' }, 3.5)
                .to($('.lx-pre .center', pre), { yPercent: -40, opacity: 0, duration: 1.1, ease: 'luxInOut' }, 3.5)
                .add(() => heroIn.play(), 3.75)
                .add(() => { pre.style.display = 'none'; }, 5.1);
        } else {
            if (pre) pre.style.display = 'none';
            heroIn.play(reduce ? heroIn.duration() : 0);
            if (reduce) lenis.start();
        }

        /* ---------- hero scroll: pinned under the rising arch ---------- */
        ScrollTrigger.create({ trigger: hero, start: 'top top', end: '+=100%', pin: true, pinSpacing: false });
        const heroOut = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: '+=100%', scrub: true } });
        heroOut
            .to($('.lx-hero .media img.night', root), { scale: 1.18, ease: 'none' }, 0)
            .to($('.lx-hero .media img.day', root), { scale: 1.18, ease: 'none' }, 0)
            .to($('.lx-hero .title', root), { yPercent: -35, opacity: 0, ease: 'none' }, 0)
            .to($('.lx-hero .claim', root), { y: -120, opacity: 0, ease: 'none' }, 0)
            .to($('.lx-hero .f-corner', root), { yPercent: -30, ease: 'none' }, 0)
            .to($('.lx-hero .f-rise', root), { yPercent: 18, ease: 'none' }, 0)
            .to($('.lx-hero .f-near', root), { yPercent: -60, ease: 'none' }, 0);

        /* ---------- arch: dome rises, curved text slides along it ---------- */
        const arch = $('.lx-arch', root);
        gsap.fromTo($('.lx-arch .dome', root), { scaleX: 0.78 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: arch, start: 'top top', end: '+=100%', scrub: true } });
        gsap.fromTo($('.lx-arch .curve', root), { scaleX: 0.78 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: arch, start: 'top top', end: '+=100%', scrub: true } });
        gsap.fromTo($('.lx-arch textPath', root), { attr: { startOffset: '12%' } }, { attr: { startOffset: '50%' }, ease: 'none', scrollTrigger: { trigger: arch, start: 'top top', end: '+=100%', scrub: true } });
        gsap.fromTo($('.lx-arch .curve text', root), { opacity: 0 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: arch, start: '20% top', end: '+=60%', scrub: true } });
        gsap.fromTo($('.lx-arch .vline', root), { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: $('.lx-arch .vline', root), start: 'top 85%', end: 'top 45%', scrub: true } });
        reveal($$('.lx-arch .crest, .lx-arch .lede', root));
        $$('.lx-promise', root).forEach((p, i) => {
            gsap.fromTo(p, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 1.4, delay: i * 0.12, ease: 'lux', scrollTrigger: { trigger: p, start: 'top 88%' } });
            gsap.fromTo($('.n', p), { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 0.9, duration: 1.6, delay: 0.2 + i * 0.12, ease: 'lux', scrollTrigger: { trigger: p, start: 'top 88%' } });
        });
        linesUp($$('.lx-arch .body', root));

        /* ---------- portal: arched window opens into the tower ---------- */
        const portal = $('.lx-portal', root);
        mm.add({ desk: '(min-width: 761px)', mob: '(max-width: 760px)' }, (c) => {
            const start = c.conditions.desk
                ? 'inset(15vh 36vw 8vh 36vw round 32vw 32vw 0vw 0vw)'
                : 'inset(18vh 14vw 10vh 14vw round 40vw 40vw 0vw 0vw)';
            const ringStart = c.conditions.desk ? { l: 36, t: 13.6, b: 8, r: 32 } : { l: 14, t: 16, b: 10, r: 40 };
            const win = $('.lx-portal .window', portal);
            gsap.set(win, { clipPath: start });
            const tl = gsap.timeline({ scrollTrigger: { trigger: portal, start: 'top top', end: '+=220%', pin: true, scrub: 1 } });
            tl.to(win, { clipPath: 'inset(0vh 0vw 0vh 0vw round 0vw 0vw 0vw 0vw)', ease: 'luxSoft', duration: 1 }, 0)
                .to($('.lx-portal .window img', portal), { scale: 1, ease: 'luxSoft', duration: 1 }, 0)
                .fromTo($('.lx-portal .ring', portal), { left: `${ringStart.l}vw`, right: `${ringStart.l}vw`, top: `${ringStart.t}vh`, bottom: `${ringStart.b}vh`, borderRadius: `${ringStart.r}vw ${ringStart.r}vw 0 0` },
                    { left: '-2vw', right: '-2vw', top: '-2vh', bottom: '-2vh', borderRadius: '0vw 0vw 0 0', opacity: 0, ease: 'luxSoft', duration: 1 }, 0)
                .to($('.lx-portal .word.l', portal), { xPercent: -120, opacity: 0, ease: 'power2.in', duration: 0.6 }, 0)
                .to($('.lx-portal .word.r', portal), { xPercent: 120, opacity: 0, ease: 'power2.in', duration: 0.6 }, 0)
                .to($('.lx-portal .sub', portal), { opacity: 0, duration: 0.3 }, 0)
                .to($('.lx-portal .f-left', portal), { xPercent: -60, yPercent: 30, scale: 1.5, ease: 'power1.in', duration: 1 }, 0)
                .to($('.lx-portal .f-right', portal), { xPercent: 60, yPercent: 25, scale: 1.5, ease: 'power1.in', duration: 1 }, 0)
                .to($('.lx-portal .shade', portal), { opacity: 1, duration: 0.4 }, 0.85)
                .fromTo($('.lx-portal .reveal', portal), { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, 0.95)
                .to({}, { duration: 0.35 });
        });

        /* ---------- collection ---------- */
        linesUp($$('.lx-collection .lead', root));
        reveal($$('.lx-collection .tag', root));
        gsap.fromTo($('.lx-slider .frame', root), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'luxInOut', scrollTrigger: { trigger: $('.lx-slider', root), start: 'top 80%' } });

        /* ---------- quote band ---------- */
        gsap.fromTo($('.lx-quote .bg', root), { yPercent: -10 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: $('.lx-quote', root), start: 'top bottom', end: 'bottom top', scrub: true } });
        linesUp($$('.lx-quote blockquote .disp', root), 0.08);
        reveal($$('.lx-quote blockquote .micro', root));
        $$('.lx-hang .lx-flora', root).forEach((f) => {
            gsap.fromTo(f, { yPercent: -18 }, { yPercent: 14, ease: 'none', scrollTrigger: { trigger: f.parentElement, start: 'top bottom', end: '+=160%', scrub: true } });
            gsap.fromTo(f, { clipPath: `circle(0% at ${f.dataset.anchor})` }, { clipPath: `circle(150% at ${f.dataset.anchor})`, duration: 2.6, ease: 'luxSoft', scrollTrigger: { trigger: f.parentElement, start: 'top 85%' } });
        });

        /* ---------- vision: three rows of type travel horizontally ---------- */
        const vision = $('.lx-vision', root);
        const rows = $$('.lx-vision .row', vision);
        const bigs = $$('.lx-vision .big span', vision);
        const country = new SplitText($('.lx-vision .country', vision), { type: 'chars', charsClass: 'char' }).chars;
        const vt = gsap.timeline({ scrollTrigger: { trigger: vision, start: 'top top', end: '+=180%', pin: true, scrub: 1 } });
        rows.forEach((r, i) => {
            const from = [40, 62, 28][i] || 40;
            vt.fromTo(r, { x: () => innerWidth * from / 100 }, { x: () => -(r.scrollWidth - innerWidth * 0.62), ease: 'none', duration: 1 }, 0);
        });
        vt.fromTo(bigs, { xPercent: 60, opacity: 0 }, { xPercent: 0, opacity: 1, stagger: 0.12, ease: 'power2.out', duration: 0.4 }, 0.05)
            .fromTo(country, { opacity: 0, y: 14 }, { opacity: 1, y: 0, stagger: 0.03, duration: 0.2 }, 0.3)
            .fromTo($('.lx-vision .label', vision), { opacity: 0 }, { opacity: 1, duration: 0.15 }, 0)
            .fromTo($('.lx-vision .note', vision), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.25 }, 0.45)
            .fromTo($('.lx-vision .lx-flora', vision), { yPercent: 40, rotation: 6 }, { yPercent: -6, rotation: 0, ease: 'none', duration: 1 }, 0);

        /* ---------- place: scattered letters assemble ---------- */
        const place = $('.lx-place', root);
        const pChars = new SplitText($$('.lx-place .head .disp', place), { type: 'chars', charsClass: 'char' }).chars;
        gsap.fromTo(pChars, { yPercent: () => gsap.utils.random(-80, 120), opacity: 0, rotation: () => gsap.utils.random(-12, 12), scaleY: () => gsap.utils.random(0.6, 1.6) },
            { yPercent: 0, opacity: 1, rotation: 0, scaleY: 1, stagger: { each: 0.035, from: 'random' }, duration: 1.6, ease: 'lux', scrollTrigger: { trigger: $('.lx-place .head', place), start: 'top 75%' } });
        $$('.lx-place .head .script', place).forEach((s) => gsap.fromTo(s, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 2, delay: 0.6, ease: 'luxSoft', scrollTrigger: { trigger: $('.lx-place .head', place), start: 'top 75%' } }));
        const route = $('.lx-route path', place);
        if (route) {
            const L = route.getTotalLength();
            gsap.set(route, { strokeDasharray: `4 6`, strokeDashoffset: 0 });
            gsap.fromTo($('.lx-route .draw', place), { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: $('.lx-route', place), start: 'top 85%', end: 'bottom 45%', scrub: true } });
            $$('.lx-stop', place).forEach((s, i, arr) => gsap.fromTo(s, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, ease: 'lux', scrollTrigger: { trigger: $('.lx-route', place), start: `top+=${(i / arr.length) * 70}% 80%` } }));
        }
        reveal($$('.lx-place .lower > div:first-child, .lx-place .cta', place));
        gsap.fromTo($('.lx-place .peek img', place), { xPercent: 0 }, { xPercent: -30, ease: 'none', scrollTrigger: { trigger: place, start: 'top bottom', end: 'bottom top', scrub: true } });

        /* ---------- sky: clouds part over the city ---------- */
        const sky = $('.lx-sky', root);
        const st = gsap.timeline({ scrollTrigger: { trigger: sky, start: 'top top', end: '+=170%', pin: true, scrub: 1 } });
        st.fromTo($('.lx-sky .city img', sky), { scale: 1.25 }, { scale: 1, ease: 'none', duration: 1 }, 0)
            .to($('.lx-sky .c1', sky), { xPercent: -85, yPercent: -10, ease: 'power1.in', duration: 0.8 }, 0)
            .to($('.lx-sky .c2', sky), { xPercent: 85, yPercent: -6, ease: 'power1.in', duration: 0.8 }, 0)
            .to($('.lx-sky .c3', sky), { scale: 2.2, yPercent: -40, opacity: 0, ease: 'power1.in', duration: 0.7 }, 0)
            .to($('.lx-sky .c4', sky), { xPercent: -50, yPercent: -60, opacity: 0, ease: 'power1.in', duration: 0.6 }, 0.05)
            .fromTo($('.lx-sky .copy', sky), { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.35 }, 0.45)
            .to({}, { duration: 0.2 });

        /* ---------- services: pinned three-act sequence ---------- */
        const svc = $('.lx-services', root);
        const slides = $$('.lx-services .slide', svc);
        if (slides.length) {
            let cur = -1;
            const bar = $('.lx-services .p i', svc);
            const idx = $('.lx-services .idx', svc);
            const show = (i) => {
                if (i === cur) return;
                const prev = slides[cur];
                const next = slides[i];
                const dir = i > cur ? 1 : -1;
                if (prev) {
                    gsap.to($$('.char', prev), { yPercent: -110 * dir, opacity: 0, duration: 0.7, stagger: 0.015, ease: 'power3.in', overwrite: true });
                    gsap.to($$('.detail, .pic', prev), { opacity: 0, duration: 0.5, overwrite: true });
                }
                gsap.set(next, { visibility: 'visible' });
                gsap.fromTo($$('.char', next), { yPercent: 110 * dir, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.1, stagger: 0.022, ease: 'lux', delay: 0.25, overwrite: true });
                gsap.fromTo($('.pic', next), { opacity: 1, clipPath: dir > 0 ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)' }, { clipPath: 'inset(0% 0 0% 0)', duration: 1.2, ease: 'luxInOut', overwrite: true });
                gsap.fromTo($('.pic img', next), { scale: 1.3 }, { scale: 1, duration: 1.6, ease: 'lux' });
                gsap.fromTo($('.detail', next), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, delay: 0.45, ease: 'lux', overwrite: true });
                bar.style.transform = `scaleX(${(i + 1) / slides.length})`;
                idx.textContent = String(i + 1);
                cur = i;
            };
            slides.forEach((s, i) => { if (i) gsap.set(s, { visibility: 'hidden' }); gsap.set($$('.char', s), { opacity: i ? 0 : 1 }); });
            const trig = ScrollTrigger.create({
                trigger: svc, start: 'top top', end: `+=${slides.length * 80}%`, pin: true,
                onUpdate: (self) => show(Math.min(slides.length - 1, Math.floor(self.progress * slides.length * 0.999))),
            });
            show(0);
            const go = (d) => {
                const target = Math.max(0, Math.min(slides.length - 1, cur + d));
                lenis.scrollTo(trig.start + (trig.end - trig.start) * ((target + 0.5) / slides.length), { duration: 1.2 });
            };
            const prevB = $('.lx-services .prev', svc), nextB = $('.lx-services .next', svc);
            const pv = () => go(-1), nx = () => go(1);
            prevB.addEventListener('click', pv); nextB.addEventListener('click', nx);
            cleanups.push(() => { prevB.removeEventListener('click', pv); nextB.removeEventListener('click', nx); });
        }

        /* ---------- values: pinned list highlights, then the cream arch rises ---------- */
        const vals = $('.lx-values', root);
        const items = $$('.lx-values .list li', vals);
        const texts = $$('.lx-values .text .disp', vals);
        let vcur = -1;
        const setVal = (i) => {
            if (i === vcur) return;
            items.forEach((li, k) => li.classList.toggle('on', k === i));
            texts.forEach((t, k) => gsap.to(t, { opacity: k === i ? 1 : 0, y: k === i ? 0 : (k < i ? -20 : 20), duration: 0.7, ease: 'lux', overwrite: true }));
            vcur = i;
        };
        texts.forEach((t, k) => gsap.set(t, { opacity: k ? 0 : 1, position: k ? 'absolute' : 'relative', top: k ? 0 : 'auto', left: 0, right: 0 }));
        setVal(0);
        const vtl = gsap.timeline({
            scrollTrigger: {
                trigger: vals, start: 'top top', end: `+=${items.length * 45 + 80}%`, pin: true, scrub: 1,
                onUpdate: (self) => setVal(Math.min(items.length - 1, Math.floor((self.progress / 0.78) * items.length))),
            },
        });
        vtl.fromTo($('.lx-values .bg img', vals), { scale: 1.18 }, { scale: 1, ease: 'none', duration: 1 }, 0)
            .fromTo($('.lx-values .rise', vals), { yPercent: 100 }, { yPercent: 30, ease: 'luxSoft', duration: 0.22 }, 0.78);

        /* ---------- split: numbers ---------- */
        const split = $('.lx-split', root);
        gsap.fromTo($('.lx-split .photo img', split), { yPercent: -8 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: split, start: 'top bottom', end: 'bottom top', scrub: true } });
        gsap.fromTo($('.lx-split .photo', split), { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.8, ease: 'luxInOut', scrollTrigger: { trigger: split, start: 'top 70%' } });
        linesUp($$('.lx-split .copy .disp', split), 0.07);
        $$('.lx-stat', split).forEach((s, i) => {
            const v = $('.v b', s);
            const end = +v.dataset.v;
            const o = { n: 0 };
            gsap.fromTo(s, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, delay: i * 0.1, ease: 'lux', scrollTrigger: { trigger: s, start: 'top 88%' } });
            gsap.to(o, { n: end, duration: 2.4, delay: 0.2 + i * 0.1, ease: 'power3.out', onUpdate: () => { v.textContent = Math.round(o.n); }, scrollTrigger: { trigger: s, start: 'top 88%' } });
        });
        $$('.lx-split .lx-flora', split).forEach((f) => gsap.fromTo(f, { yPercent: 20 }, { yPercent: -16, ease: 'none', scrollTrigger: { trigger: split, start: 'top bottom', end: 'bottom top', scrub: true } }));
        reveal($$('.lx-split .cta', split));

        /* ---------- gallery: staggered horizontal drift ---------- */
        const gal = $('.lx-gallery', root);
        const track = $('.lx-gallery .track', gal);
        gsap.fromTo(track, { x: 0 }, { x: () => -(track.scrollWidth - innerWidth * 0.86), ease: 'none', scrollTrigger: { trigger: gal, start: 'top 70%', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
        $$('.lx-gallery .card .img', gal).forEach((c) => gsap.fromTo(c, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.6, ease: 'luxInOut', scrollTrigger: { trigger: gal, start: 'top 75%' } }));
        linesUp($$('.lx-gallery .head .disp', gal));
        $$('.lx-gallery .lx-flora', gal).forEach((f, i) => gsap.fromTo(f, { yPercent: 30 }, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: gal, start: 'top bottom', end: 'bottom top', scrub: true } }));

        /* ---------- faq + footer ---------- */
        reveal($$('.lx-faq details', root));
        linesUp($$('.lx-faq .disp', root));
        const foot = $('.lx-foot', root);
        gsap.fromTo($('.lx-foot .dome', foot), { yPercent: 0, scaleX: 1 }, { yPercent: -38, scaleX: 0.7, ease: 'none', scrollTrigger: { trigger: foot, start: 'top bottom', end: 'top 20%', scrub: true } });
        gsap.fromTo($('.lx-foot .ghost', foot), { xPercent: -40 }, { xPercent: -60, ease: 'none', scrollTrigger: { trigger: foot, start: 'top bottom', end: 'bottom bottom', scrub: true } });
        const fChars = new SplitText($('.lx-foot .big .disp', foot), { type: 'chars', charsClass: 'char' }).chars;
        gsap.fromTo(fChars, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: { each: 0.04, from: 'center' }, duration: 1.4, ease: 'lux', scrollTrigger: { trigger: foot, start: 'top 40%' } });
        gsap.fromTo($('.lx-foot .big .script', foot), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.8, delay: 0.5, ease: 'luxSoft', scrollTrigger: { trigger: foot, start: 'top 40%' } });
        reveal($$('.lx-foot .cols > div', foot));

        /* circles draw in when they appear */
        $$('.lx-circle .track', root).forEach((c) => gsap.fromTo(c, { strokeDasharray: 566, strokeDashoffset: 566 }, { strokeDashoffset: 0, duration: 2, ease: 'luxInOut', scrollTrigger: { trigger: c.closest('.lx-circle'), start: 'top 92%' } }));
    }, root);

    // helpers inside the context
    function reveal(els) {
        els.forEach((el) => gsap.fromTo(el, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.3, ease: 'lux', scrollTrigger: { trigger: el, start: 'top 90%' } }));
    }
    function linesUp(els, each = 0.1) {
        els.forEach((el) => {
            const s = new SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
            gsap.fromTo(s.lines, { yPercent: 105 }, { yPercent: 0, duration: 1.4, stagger: each, ease: 'lux', scrollTrigger: { trigger: el, start: 'top 88%' } });
        });
    }

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    document.fonts && document.fonts.ready.then(refresh);
    const t = setTimeout(refresh, 900);

    return () => {
        clearTimeout(t);
        window.removeEventListener('load', refresh);
        mm.revert();
        ctx.revert();
        cleanups.forEach((fn) => fn());
    };
}
