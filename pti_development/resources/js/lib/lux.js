/* =========================================================
   Landing page motion system
   initLux(root, { skipIntro }) -> destroy()
   ========================================================= */
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { createFlora } from './flora3d';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create('lux', '0.19,1,0.22,1');
CustomEase.create('luxInOut', '0.76,0,0.24,1');
CustomEase.create('luxSoft', '0.45,0,0.15,1');

const $ = (s, c) => c.querySelector(s);
const $$ = (s, c) => Array.from(c.querySelectorAll(s));
const isDesktop = () => window.matchMedia('(min-width: 861px)').matches;

/* shared reveal helpers (used inside a gsap.context, so they are reverted with it) */
function reveal(els) {
    els.forEach((el) => gsap.fromTo(el, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.3, ease: 'lux', scrollTrigger: { trigger: el, start: 'top 90%' } }));
}
function linesUp(els, each = 0.1) {
    els.forEach((el) => {
        const s = new SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
        gsap.fromTo(s.lines, { yPercent: 105 }, { yPercent: 0, duration: 1.4, stagger: each, ease: 'lux', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
}

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
    const petals = $$('.lx-petals', root).map((c) => {
        const requested = +c.dataset.count || 26;
        const count = reduce ? 0 : (isDesktop() ? requested : Math.ceil(requested * 0.55));
        return new Petals(c, petalSrc, count);
    });
    cleanups.push(() => petals.forEach((p) => p.destroy()));

    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
        /* ---------- chrome: badge, tone ---------- */
        const badge = $('.lx-badge .ring', chrome);
        let rot = 0;
        const tones = $$('[data-tone]', root);
        const tick = () => {
            rot += 0.12 + Math.min(6, Math.abs(lenis.velocity) * 0.06);
            badge.style.transform = `rotate(${rot}deg)`;
            let tone = 'dark';
            for (const s of tones) {
                const r = s.getBoundingClientRect();
                /* data-tone-offset="screen": the section's first screen is transparent (it overlaps the hero) */
                const off = s.dataset.toneOffset === 'screen' ? innerHeight : 0;
                /* inside the sideways strip only the page under the menu (top right) counts */
                if (r.top + off <= 90 && r.bottom > 90 && r.left <= innerWidth - 60 && r.right > innerWidth - 60) { tone = s.dataset.tone; }
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
        if (isDesktop() && !reduce) {
            window.addEventListener('mousemove', move);
            cleanups.push(() => window.removeEventListener('mousemove', move));
        }

        /* ---------- perpetual sway of every botanical layer ---------- */
        $$('.lx-flora .sway', root).forEach((el, i) => {
            const amp = +el.closest('.lx-flora').dataset.sway || 2;
            gsap.to(el, { rotation: amp, y: amp * 2, duration: 4.5 + (i % 3) * 1.3, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: -i * 0.9 });
        });

        /* ---------- hero: navy cover -> gothic-arch portal reveal -> scene zooms to fit + centred title ----------
           Plays by itself on load. The scene never scrolls; the hero only stays pinned while the next section
           rises over it. */
        const hero = $('.lx-hero', root);
        const stage = $('.lx-hero .hero-stage', root);
        const tower = $('.lx-hero .hero-tower', root);
        const titleMain = $('.lx-hero .t-main', root);
        const titleChars = $$('.lx-hero .t-main .char', root);
        const subWords = $$('.lx-hero .t-sub .word', root);
        const eyebrowWord = $('.lx-hero .t-eyebrow .word', root);
        const vw = () => hero.clientWidth;
        const vh = () => hero.clientHeight;
        const desk = isDesktop();
        CustomEase.create('heroDive', '0.6,0,0,1');

        /* Pointed (gothic) arch, proportioned on the reference door: straight jambs up to the springing
           line, then two circular arcs that meet in a point. Arch rise = 0.58 x span, so each arc's
           radius r = (span^2/4 + rise^2) / span (~0.56 x span), centred on the springing line.
           The shape is described by its span (w, in vw) and the height of its apex (y, in vh); the jambs
           always run past the bottom of the screen. */
        const RISE = 0.58;
        const archPath = (wPx, apexPx) => {
            const cx = vw() / 2, half = wPx / 2, rise = wPx * RISE;
            const spring = apexPx + rise;
            const bottom = Math.max(vh(), spring) + 4;
            const r = (wPx * wPx / 4 + rise * rise) / wPx;
            const L = cx - half, R = cx + half, f = (n) => n.toFixed(2);
            return `M${f(L)} ${f(bottom)} L${f(L)} ${f(spring)} A${f(r)} ${f(r)} 0 0 1 ${f(cx)} ${f(apexPx)} A${f(r)} ${f(r)} 0 0 1 ${f(R)} ${f(spring)} L${f(R)} ${f(bottom)} Z`;
        };
        const heroArch = { w: desk ? 22 : 44, y: 104 };          // starts hidden below the screen
        const drawArch = () => {
            const w = (heroArch.w / 100) * vw(), apex = (heroArch.y / 100) * vh();
            stage.style.clipPath = `path('${archPath(w, apex)}')`;
        };
        drawArch();
        const onResize = () => drawArch();
        window.addEventListener('resize', onResize);
        cleanups.push(() => { window.removeEventListener('resize', onResize); stage.style.clipPath = ''; });

        /* arch stages: rises to a portal in the middle of the screen, then dives past every edge
           (end span 135vw, apex high enough that the springing line clears the top). */
        const ARCH_MID = desk ? { w: 34, y: 17 } : { w: 64, y: 22 };
        const archEndY = () => -((RISE * 1.35 * vw()) / vh()) * 100 - 6;

        gsap.set(tower, { scale: 1.5, transformOrigin: '50% 50%' });
        gsap.set(titleChars, { yPercent: 115, opacity: 0 });
        gsap.set(subWords, { yPercent: 120, opacity: 0 });
        gsap.set(titleMain, { letterSpacing: '0.12em' });
        gsap.set(eyebrowWord, { yPercent: 120, opacity: 0 });

        /* INTRO (scroll is locked meanwhile):
           0     arch rises from the bottom centre (scene inside, zoomed in)
           1.3   the arch opens past the screen edges, and IN THE SAME MOMENT the scene eases from zoomed-in to
                 exactly fitted while the eyebrow, the headline (letter by letter, tracking closing in) and the
                 subtext (word by word) reveal — one combined transition */
        const ZOOM_AT = 1.3;
        let heroPinned = false;
        const heroIntro = gsap.timeline({ paused: true });
        heroIntro
            .to(heroArch, { ...ARCH_MID, ease: 'power2.out', duration: 1.5, onUpdate: drawArch }, 0)
            .to(heroArch, { w: 135, y: archEndY, ease: 'heroDive', duration: 2.2, onUpdate: drawArch }, 1.3)
            .to(tower, { scale: 1.36, ease: 'power2.out', duration: ZOOM_AT }, 0)
            .to(tower, { scale: 1, ease: 'heroDive', duration: 2.4 }, ZOOM_AT)
            .to(eyebrowWord, { yPercent: 0, opacity: 1, ease: 'power3.out', duration: 1.0 }, ZOOM_AT + 0.2)
            .to(titleMain, { letterSpacing: '0.01em', ease: 'power3.out', duration: 2.0 }, ZOOM_AT + 0.25)
            .to(titleChars, { yPercent: 0, opacity: 1, ease: 'power3.out', duration: 1.0, stagger: 0.045 }, ZOOM_AT + 0.3)
            .to(subWords, { yPercent: 0, opacity: 1, ease: 'power3.out', duration: 0.8, stagger: 0.04 }, ZOOM_AT + 0.9)
            .call(() => { pinHero(); lenis.start(); }, null, ZOOM_AT + 2.2);

        /* start once the scene is decoded (so the portal never reveals a blank), max 2.5s wait */
        let heroAlive = true;
        cleanups.push(() => { heroAlive = false; });
        Promise.race([
            Promise.resolve($('.lx-hero .hero-tower > img', root).decode?.()).catch(() => {}),
            new Promise((r) => setTimeout(r, 2500)),
        ]).then(() => {
            if (!heroAlive) return;
            if (reduce) heroIntro.progress(1, false);
            else heroIntro.play(0);
        });
        const heroFailSafe = window.setTimeout(() => {
            if (heroIntro.progress() < 0.99) heroIntro.progress(1, false);
            pinHero();
            lenis.start();
        }, reduce ? 80 : 9000);
        cleanups.push(() => window.clearTimeout(heroFailSafe));

        /* the hero holds still (pinned, nothing animates) while the next section rises over it */
        function pinHero() {
            if (heroPinned || !heroAlive) return;
            heroPinned = true;
            ctx.add(() => {
                ScrollTrigger.create({ trigger: hero, start: 'top top', end: () => `+=${vh()}`, pin: true, pinSpacing: false, invalidateOnRefresh: true });
            });
        }
        /* ---------- arch: dome rises, curved text slides along it; then the promises slider (ported from ERA) ---------- */
        const arch = $('.lx-arch', root);
        gsap.fromTo($('.lx-arch .dome', root), { scaleX: 0.78 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: arch, start: 'top top', end: '+=100%', scrub: true } });
        gsap.fromTo($('.lx-arch .curve', root), { scaleX: 0.78 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: arch, start: 'top top', end: '+=100%', scrub: true } });
        gsap.fromTo($('.lx-arch textPath', root), { attr: { startOffset: '12%' } }, { attr: { startOffset: '50%' }, ease: 'none', scrollTrigger: { trigger: arch, start: 'top top', end: '+=100%', scrub: true } });
        gsap.fromTo($('.lx-arch .curve text', root), { opacity: 0 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: arch, start: '20% top', end: '+=60%', scrub: true } });
        gsap.fromTo($('.lx-arch .vline', root), { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: $('.lx-arch .vline', root), start: 'top 85%', end: 'top 45%', scrub: true } });
        reveal($$('.lx-arch .crest, .lx-arch .lede', root));
        {
            CustomEase.create('eraOut', '0.25,1,0.5,1');
            CustomEase.create('eraIn', '0.5,0,0.75,0');
            CustomEase.create('eraInOut', '0.75,0,0.25,1');
            const DS = 0.4, DM = 0.8, DL = 1.2, ST = 0.1, AUTO = 6;
            const sl = $('.lx-bslider', root);
            const slides = $$('.b-slide', sl);
            const pager = $('.b-pager', sl);
            const cur = $('.cur', sl), nxt = $('.nxt', sl), bar = $('.bar i', sl);
            /* split once: title -> chars, paragraphs -> masked lines */
            const parts = slides.map((s) => ({
                el: s,
                h: new SplitText($('[data-b="h"]', s), { type: 'words,chars', wordsClass: 'split-word', charsClass: 'split-char' }).chars,
                p: $$('[data-b="p"]', s).map((p) => new SplitText(p, { type: 'lines', linesClass: 'split-line', mask: 'lines' }).lines),
                img: $('[data-b="img"]', s),
            }));
            cleanups.push(() => parts.forEach((pt) => pt.el.querySelectorAll('[data-b="h"], [data-b="p"]').forEach((n) => { n.textContent = n.textContent; })));
            const H = {
                initial: (c) => gsap.set(c, { opacity: 0, yPercent: 50, rotateY: 90 }),
                reveal: (c, d = 0) => gsap.fromTo(c, { opacity: 0, yPercent: 50, rotateY: 90 }, { opacity: 1, yPercent: 0, rotateY: 0, duration: DL, delay: d, stagger: 0.5 * ST, ease: 'eraOut', overwrite: true }),
                hide: (c) => gsap.to(c, { opacity: 0, yPercent: -50, rotateY: -90, duration: DS, stagger: 0.25 * ST, ease: 'eraIn', overwrite: true }),
            };
            const P = {
                initial: (ls) => ls.forEach((l) => gsap.set(l, { yPercent: 110 })),
                reveal: (ls, d = 0) => ls.forEach((l, i) => gsap.fromTo(l, { yPercent: 110 }, { yPercent: 0, duration: DL, delay: d + i * ST, stagger: ST, ease: 'eraOut', overwrite: true })),
                hide: (ls) => ls.forEach((l) => gsap.to(l, { yPercent: -110, duration: DS, stagger: 0.5 * ST, ease: 'eraIn', overwrite: true })),
            };
            const IMG = {
                initial: (w) => { gsap.set(w, { clipPath: 'inset(100% 0% 0% 0%)' }); gsap.set(w.firstElementChild, { scale: 1.5, xPercent: 25 }); },
                reveal: (w, d = 0) => {
                    gsap.fromTo(w, { clipPath: 'polygon(100% 0%, 100% 0%, 101% 100%, 125% 100%)' }, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: DL, delay: d, ease: 'eraInOut', overwrite: true });
                    gsap.fromTo(w.firstElementChild, { scale: 1.5, xPercent: 25 }, { scale: 1, xPercent: 0, duration: DL, delay: d, ease: 'eraInOut', overwrite: true });
                },
                hide: (w) => {
                    gsap.fromTo(w, { clipPath: 'polygon(0% 0%, 100% 0%, 125% 100%, 0% 100%)' }, { clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)', duration: DL, ease: 'eraInOut', overwrite: true });
                    gsap.to(w.firstElementChild, { scale: 1.5, xPercent: -25, duration: DL, ease: 'eraInOut', overwrite: true });
                },
            };
            /* descriptions live under the pager, one per slide: animate them with their slide's lines */
            $$('.b-descs .b-desc', sl).forEach((c, i) => { if (parts[i]) parts[i].p.push(new SplitText(c, { type: 'lines', linesClass: 'split-line', mask: 'lines' }).lines); });
            parts.forEach((pt) => { H.initial(pt.h); P.initial(pt.p); IMG.initial(pt.img); });
            gsap.set(pager, { opacity: 0, y: 48 });

            let index = 0, busy = false, timer = null, started = false;
            const n = parts.length;
            const labels = () => { cur.textContent = index + 1; nxt.textContent = index === n - 1 ? 1 : index + 2; };
            const runBar = () => { gsap.killTweensOf(bar); gsap.fromTo(bar, { width: '0%' }, { width: '100%', duration: AUTO, ease: 'none' }); };
            const schedule = () => { clearInterval(timer); if (n > 1) { runBar(); timer = setInterval(() => { if (!document.hidden) go(index + 1, true); }, AUTO * 1000); } };
            cleanups.push(() => clearInterval(timer));

            /* ERA slide change: old texts out + old image wipes out while the new image wipes in;
               after DM the new title (chars) and lines rise in */
            function go(k, auto = false) {
                if (busy || n < 2) return;
                const to = (k + n) % n;
                if (to === index) return;
                busy = true;
                const from = parts[index], next = parts[to];
                from.el.classList.add('is-leaving'); from.el.classList.remove('is-active'); from.el.setAttribute('aria-hidden', 'true');
                next.el.classList.add('is-active'); next.el.removeAttribute('aria-hidden');
                H.initial(next.h); P.initial(next.p); IMG.initial(next.img);
                H.hide(from.h); P.hide(from.p); IMG.hide(from.img); IMG.reveal(next.img, 0);
                index = to; labels();
                gsap.delayedCall(DM, () => { H.reveal(next.h); P.reveal(next.p); });
                gsap.delayedCall(DL, () => { from.el.classList.remove('is-leaving'); busy = false; });
                if (!auto) schedule(); else runBar();
            }
            $('.next', sl).addEventListener('click', () => go(index + 1));
            $('.prev', sl).addEventListener('click', () => go(index - 1));

            /* first reveal when the slider scrolls into view (once) */
            ScrollTrigger.create({
                trigger: $('.b-slides', sl), start: 'top 82%', once: true,
                onEnter: () => {
                    if (started) return; started = true;
                    const f = parts[0];
                    H.reveal(f.h, 0.3); IMG.reveal(f.img, 0.3); P.reveal(f.p, 0.6);
                    gsap.to(pager, { opacity: 1, y: 0, duration: DL, delay: 0.7, ease: 'eraOut' });
                    gsap.delayedCall(1.2, schedule);
                },
            });
        }

        /* ---------- what our clients say: ERA reveals (ctn up, masked lines), image drift, optional rotation ---------- */
        {
            const says = $('.lx-says', root);
            if (says) {
                const quotes = $$('.s-quote', says).map((q) => ({
                    el: q,
                    lines: $$('[data-s="p"]', q).map((n) => new SplitText(n, { type: 'lines', linesClass: 'split-line', mask: 'lines' }).lines),
                }));
                const ctn = $$('[data-s="ctn"]', says);
                const up = (ls, d = 0) => ls.forEach((l, i) => gsap.fromTo(l, { yPercent: 110 }, { yPercent: 0, duration: 1.2, delay: d + i * 0.1, stagger: 0.1, ease: 'eraOut', overwrite: true }));
                const out = (ls) => ls.forEach((l) => gsap.to(l, { yPercent: -110, duration: 0.4, stagger: 0.05, ease: 'eraIn', overwrite: true }));
                quotes.forEach((q) => q.lines.forEach((l) => gsap.set(l, { yPercent: 110 })));
                gsap.set(ctn, { opacity: 0, y: 48 });
                ScrollTrigger.create({
                    trigger: $('.s-band', says), start: 'top 75%', once: true,
                    onEnter: () => {
                        gsap.to(ctn, { opacity: 1, y: 0, duration: 1.2, delay: 0.2, stagger: 0.1, ease: 'eraOut' });
                        if (quotes[0]) up(quotes[0].lines, 0.35);
                    },
                });
                /* the scene drifts slower than the page (ERA "img-out"), staying inside its frame */
                const img = $('.s-scene img', says);
                gsap.set(img, { scale: 1.12, transformOrigin: '50% 100%' });
                gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: $('.s-scene', says), start: 'top bottom', end: 'bottom top', scrub: 0.5 } });
                /* more than one testimonial: rotate every 8s, arrows switch immediately */
                if (quotes.length > 1) {
                    let i = 0, busy = false;
                    const cur = $('.s-pager .cur', says);
                    const show = (k) => {
                        const to = (k + quotes.length) % quotes.length;
                        if (busy || to === i) return;
                        busy = true;
                        const a = quotes[i], b = quotes[to];
                        out(a.lines);
                        a.el.classList.add('is-leaving'); a.el.classList.remove('is-active'); a.el.setAttribute('aria-hidden', 'true');
                        b.el.classList.add('is-active'); b.el.removeAttribute('aria-hidden');
                        b.lines.forEach((l) => gsap.set(l, { yPercent: 110 }));
                        up(b.lines, 0.45);
                        i = to; cur.textContent = i + 1;
                        gsap.delayedCall(0.6, () => { a.el.classList.remove('is-leaving'); busy = false; });
                    };
                    let t = setInterval(() => { if (!document.hidden) show(i + 1); }, 8000);
                    const reset = () => { clearInterval(t); t = setInterval(() => { if (!document.hidden) show(i + 1); }, 8000); };
                    $('.s-pager .next', says).addEventListener('click', () => { show(i + 1); reset(); });
                    $('.s-pager .prev', says).addEventListener('click', () => { show(i - 1); reset(); });
                    cleanups.push(() => clearInterval(t));
                }
            }
        }

        /* ---------- "We are in numbers" (auras intro), driven by the scroll: the section holds still while the scroll moves a
           small row of the four cards in from the right to the middle, swells it a touch, then grows every card into the
           full-size row while the figures count up. Scrolling back plays it in reverse. ---------- */
        {
            const nm = $('.lx-innum', root);
            if (nm && !reduce) {
                const cards = $$('.n-card', nm);
                /* rolling counter: each digit strip (0-9 three times) rolls two full turns and stops on its digit */
                const strips = $$('.n-strip', nm);
                gsap.set(strips, { clearProps: 'transform' });
                const setNums = (k) => strips.forEach((st) => gsap.set(st, { yPercent: -((20 + +st.dataset.d) * k) / 30 * 100 }));
                const tLines = new SplitText($('[data-n="h"]', nm), { type: 'lines', linesClass: 'split-line', mask: 'lines' }).lines;
                gsap.set(tLines, { yPercent: 110 });
                /* the heading rises as the section comes up the screen */
                ScrollTrigger.create({ trigger: nm, start: 'top 70%', once: true, onEnter: () => gsap.to(tLines, { yPercent: 0, duration: 1.2, stagger: 0.1, ease: 'eraOut' }) });
                setNums(0);
                mm.add({ wide: '(min-width: 1001px)', narrow: '(max-width: 1000px)' }, (c) => {
                    if (c.conditions.narrow) {
                        /* phones / tablets: cards wipe up and the figures count as the scroll brings them in */
                        gsap.set(cards, { clipPath: 'inset(100% 0% 0% 0%)' });
                        const tw = gsap.to(cards, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', stagger: 0.15, scrollTrigger: { trigger: $('.n-row', nm), start: 'top 90%', end: 'top 35%', scrub: 0.6 } });
                        const k = { v: 0 };
                        const kt = gsap.to(k, { v: 1, ease: 'none', onUpdate: () => setNums(k.v), scrollTrigger: { trigger: $('.n-row', nm), start: 'top 80%', end: 'top 30%', scrub: 0.6 } });
                        return () => { tw.scrollTrigger?.kill(); kt.scrollTrigger?.kill(); gsap.set(cards, { clearProps: 'clipPath' }); setNums(1); };
                    }
                    /* the small row: each card at 32% of its size, packed side by side around the row's centre */
                    const S = 0.32, G = 14;
                    gsap.set(cards, { x: 0, y: 0, scale: 1, clipPath: 'inset(0% 0% 0% 0%)', transformOrigin: '50% 50%' });
                    const rs = cards.map((el) => el.getBoundingClientRect());
                    const row = $('.n-row', nm).getBoundingClientRect();
                    const cx = row.left + row.width / 2;
                    const w = rs[0].width * S, total = cards.length * w + (cards.length - 1) * G;
                    const pos = rs.map((r, i) => cx - total / 2 + w / 2 + i * (w + G) - (r.left + r.width / 2));
                    /* waiting just past the right edge of the screen (the row's left end 40px out of view) */
                    const off = innerWidth - (cx - total / 2) + 40;
                    const k = { v: 0 };
                    const tl = gsap.timeline({
                        defaults: { ease: 'none' },
                        scrollTrigger: { trigger: nm, start: 'top top', end: '+=220%', pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: false },
                    });
                    tl.fromTo(cards, { x: (i) => pos[i] + off, scale: S }, { x: (i) => pos[i], duration: 1.2, ease: 'power3.out', stagger: { each: 0.08, from: 'start' } }, 0)  // 1. in from the right
                      .to(cards, { scale: S * 1.12, duration: 0.5, ease: 'power1.inOut' }, '>-0.15')                                                      // 2. swells a touch
                      .to(cards, { x: 0, scale: 1, duration: 1.4, ease: 'power3.inOut', stagger: { each: 0.03, from: 'center' } }, '>');                   // 3. grows into the full row
                    /* 4. the figures spin from the moment the pictures come in from the right until the row is full size */
                    tl.to(k, { v: 1, duration: tl.duration(), ease: 'power1.out', onUpdate: () => setNums(k.v) }, 0)
                      .to({}, { duration: 0.35 });                                                                                                         // a short rest before it lets go
                    return () => { tl.scrollTrigger?.kill(); tl.kill(); gsap.set(cards, { clearProps: 'transform' }); };
                });
            }
        }

        /* ---------- "Our Projects" from above: the title rises in over the photo ---------- */
        {
            const ae = $('.lx-aerial', root);
            if (ae) {
                const chars = new SplitText($('[data-a="h"]', ae), { type: 'words,chars', wordsClass: 'split-word', charsClass: 'split-char' }).chars;
                gsap.set(chars, { opacity: 0, yPercent: 40, filter: 'blur(14px)' });
                ScrollTrigger.create({
                    trigger: ae, start: 'top 70%', once: true,
                    onEnter: () => gsap.to(chars, { opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: 1.6, stagger: 0.045, ease: 'eraOut' }),
                });
            }
            /* the last project page's flower: a photographed cluster bent by wind + scroll in a vertex shader (lib/flora3d.js) */
            const hsf = $('.lx-hscroll', root);
            if (hsf) $$('.c-flora', hsf).forEach((cv) => {
                try {
                    const [l, r, t, b] = (cv.dataset.pads || '0,0,0,0').split(',').map(Number);
                    cleanups.push(createFlora(cv, { src: cv.dataset.src, anchor: cv.dataset.anchor, side: +cv.dataset.side || 1, pads: { l, r, t, b }, reduce }));
                } catch (e) { cv.style.display = 'none'; }
            });
        }

        /* ---------- horizontal track (ERA location): vertical scroll moves the whole strip sideways ---------- */
        {
            const hs = $('.lx-hscroll', root);
            if (hs) mm.add('(min-width: 861px)', () => {
                CustomEase.create('horScroll', '0.25,0,0.75,1');
                const track = $('.h-track', hs);
                const dist = () => Math.max(0, track.scrollWidth - innerWidth);
                const tween = gsap.to(track, {
                    x: () => -dist(), ease: 'horScroll',
                    scrollTrigger: { trigger: hs, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.25, invalidateOnRefresh: true, anticipatePin: 1 },
                });
                /* the aerial page: the title drifts a little and the photo lags behind as the strip moves, so they read as two depths */
                const ae = $('.lx-aerial', hs);
                if (ae) {
                    const pass = { trigger: ae, containerAnimation: tween, start: 'left left', end: 'right left', scrub: 0.25 };
                    if (!reduce) {
                        gsap.fromTo($('.a-title', ae), { xPercent: 0 }, { xPercent: 18, ease: 'none', scrollTrigger: pass });
                        gsap.fromTo($('.a-img img', ae), { xPercent: 0 }, { xPercent: 12, ease: 'none', scrollTrigger: pass });
                    }
                }
                /* the last page's cascade starts lifted and settles into its corner as that page slides in */
                const trf = $('.c-flower.tr', hs);
                if (!reduce) {
                    if (trf) gsap.fromTo(trf, { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: trf.closest('.h-panel'), containerAnimation: tween, start: 'left right', end: 'right right', scrub: 0.5 } });
                }
                /* each name shrinks until its longest line fits the left column (never runs into the image) */
                const fit = () => $$('.h-title', hs).forEach((t) => {
                    t.style.fontSize = '';
                    const widest = Math.max(...$$('.h-line', t).map((l) => l.offsetWidth));
                    if (widest > t.clientWidth) t.style.fontSize = `${parseFloat(getComputedStyle(t).fontSize) * t.clientWidth / widest}px`;
                });
                fit();
                document.fonts && document.fonts.ready.then(fit);
                window.addEventListener('resize', fit);
                cleanups.push(() => window.removeEventListener('resize', fit));
                $$('.h-panel', hs).forEach((p) => {
                    const once = (fn) => ScrollTrigger.create({ trigger: p, containerAnimation: tween, start: 'left 85%', once: true, onEnter: fn });
                    const img = $('.h-img', p), lines = $$('.h-line', p), cta = [$('.h-cta', p), $('.h-meta', p)].filter(Boolean);
                    /* ERA "New / Golden / Mile": the big serif lines are scrubbed sideways by the scroll, each by its own
                       amount (xPercent -5 -> 5, 25 -> -25, -15 -> 25, scrub .25), so they arrive at different moments,
                       slide over the photo's layer and run back when the scroll reverses */
                    if (!reduce && lines.length) gsap.fromTo(lines, { xPercent: gsap.utils.wrap([-5, 25, -15]) }, {
                        xPercent: gsap.utils.wrap([5, -25, 25]), ease: 'none',
                        scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left right', end: 'right left', scrub: 0.25 },
                    });
                    const desc = $$('[data-h="p"]', p).flatMap((n) => new SplitText(n, { type: 'lines', linesClass: 'split-line', mask: 'lines' }).lines);
                    gsap.set(img, { clipPath: 'inset(100% 0% 0% 0%)' });
                    gsap.set(img.firstElementChild, { scale: 1.5, xPercent: 25 });
                    gsap.set(lines, { opacity: 0 });
                    gsap.set(desc, { yPercent: 110 });
                    gsap.set(cta, { opacity: 0 });
                    once(() => {
                        /* ERA slide reveal: slanted wipe + the photo settles from 1.5x */
                        gsap.fromTo(img, { clipPath: 'polygon(100% 0%, 100% 0%, 101% 100%, 125% 100%)' }, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: 1.2, delay: 0.1, ease: 'eraInOut' });
                        gsap.to(img.firstElementChild, { scale: 1, xPercent: 0, duration: 1.2, delay: 0.1, ease: 'eraInOut' });
                        gsap.to(lines, { opacity: 1, duration: 1.2, stagger: 0.1, ease: 'eraOut' });
                        gsap.to(desc, { yPercent: 0, duration: 1.2, delay: 0.4, stagger: 0.1, ease: 'eraOut' });
                        gsap.to(cta, { opacity: 1, duration: 1.2, delay: 0.5, ease: 'eraOut' });
                    });
                });
            });
        }

        /* ---------- cloud passage: the whole photo (no pin, no zoom). It first appears with clouds over its sky and
           the buildings below; the clouds stay where they are (only drifting sideways, see lux.css) while the photo scrolls by ---------- */
        {
            const cp = $('.lx-clouds', root);
            if (cp) {
                const tl = gsap.timeline({ scrollTrigger: { trigger: cp, start: 'top 15%', end: () => `+=${innerHeight * 0.7}`, scrub: 0.6, invalidateOnRefresh: true } });
                tl.to($('.cl-fade', cp), { yPercent: -100, opacity: 0, ease: 'power1.in', duration: 0.7 }, 0);
            }
        }

        /* ---------- place: scattered letters assemble ---------- */
        const place = $('.lx-clouds .lx-place', root);
        if (place) {
        const pChars = new SplitText($$('.lx-place .head .disp', place), { type: 'chars', charsClass: 'char' }).chars;
        /* scrubbed with the scroll from start to end: the letters assemble and "you'll" writes itself as the block
           comes up the photo, and run back when scrolling up */
        const headST = { trigger: $('.lx-place .head', place), start: 'top 95%', end: 'top 30%', scrub: 0.6 };
        gsap.fromTo(pChars, { yPercent: () => gsap.utils.random(-80, 120), opacity: 0, rotation: () => gsap.utils.random(-12, 12), scaleY: () => gsap.utils.random(0.6, 1.6) },
            { yPercent: 0, opacity: 1, rotation: 0, scaleY: 1, stagger: { each: 0.035, from: 'random' }, duration: 1.6, ease: 'lux', scrollTrigger: headST });
        $$('.lx-place .head .script', place).forEach((s) => gsap.fromTo(s, { clipPath: 'inset(-60% 100% -70% -20%)' }, { clipPath: 'inset(-60% -20% -70% -20%)', ease: 'none', scrollTrigger: { ...headST, start: 'top 75%', end: 'top 25%' } }));
        /* the heading starts in the blue sky, then stays fixed on screen while the photo scrolls under it, until it
           sits over the buildings; from there it scrolls on with the photo and the content below comes into view */
        const cloudSec = place.closest('.lx-clouds');
        if (cloudSec) {
            mm.add('(min-width: 861px)', () => {
                const head = $('.head', place);
                const travel = () => cloudSec.offsetHeight * 0.12;     // sky (30% of the photo) -> over the building tops (42%), where it then stays
                gsap.fromTo(head, { y: 0 }, { y: travel, ease: 'none', scrollTrigger: { trigger: head, start: 'top 16%', end: () => `+=${travel()}`, scrub: true, invalidateOnRefresh: true } });
            });
            /* the photo loads lazily: re-measure the triggers once its real height is known */
            const ci = $('.cl-scene img', cloudSec);
            if (ci && !ci.complete) ci.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
        }

        /* ---------- video door: the cloud section holds still (pinned at its bottom, nothing below it scrolls) while
           the next page rises over it in the pointed door shape, exactly like the section under the hero ---------- */
        {
            const vdoor = $('.lx-vdoor', root);
            const cpin = $('.lx-clouds', root);
            if (vdoor && cpin) {
                /* while it holds: first the route line draws all the way to the Pallabi office (each stop appears as the
                   line reaches it, D screens of scroll), and only then does the door page rise (one more screen; the
                   door section starts D screens later, see .lx-vdoor margin in lux.css) */
                const D = 0.8;
                const hold = gsap.timeline({ scrollTrigger: { trigger: cpin, start: 'bottom bottom', end: () => `+=${innerHeight * (D + 1)}`, pin: true, pinSpacing: false, scrub: 0.6, invalidateOnRefresh: true } });
                const draw = $('.lx-route .draw', cpin);
                if (draw) {
                    const L = draw.getTotalLength();
                    gsap.set($('.lx-route path', cpin), { strokeDasharray: '4 6', strokeDashoffset: 0 });
                    hold.fromTo(draw, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, ease: 'none', duration: D }, 0);
                    const stops = $$('.lx-stop', cpin);
                    stops.forEach((s, i) => hold.fromTo(s, { opacity: 0, y: 20 }, { opacity: 1, y: 0, ease: 'none', duration: D * 0.12 }, D * 0.88 * (i / Math.max(1, stops.length - 1))));
                }
                hold.to({}, { duration: 1 }, D);
                const dST = { trigger: vdoor, start: 'top top', end: '+=100%', scrub: true };
                gsap.fromTo($('.dome', vdoor), { scaleX: 0.78 }, { scaleX: 1, ease: 'none', scrollTrigger: dST });
                reveal($$('.v-lede, .v-frame', vdoor));
                /* "Crafted for everyday living": the condensed lines rise one after another as the door comes up, the script
                   word is written in from the left; each picture is uncovered from the bottom while its photo settles from a
                   slight zoom and drifts against the scroll, and its caption follows */
                const crT = $('.cr-title', vdoor);
                if (crT && !reduce) {
                    const lines = $$('.cr-line', crT), scr = $('.cr-script', crT);
                    gsap.set(lines, { opacity: 0, yPercent: 60 });
                    gsap.set(scr, { clipPath: 'inset(-20% 100% -20% 0%)' });
                    ScrollTrigger.create({
                        trigger: crT, start: 'top 82%', once: true,
                        onEnter: () => {
                            gsap.to(lines, { opacity: 1, yPercent: 0, duration: 1.3, stagger: 0.14, ease: 'eraOut' });
                            gsap.to(scr, { clipPath: 'inset(-20% 0% -20% 0%)', duration: 1.6, delay: 0.55, ease: 'power2.inOut' });
                        },
                    });
                    $$('.cr-pic', vdoor).forEach((fig) => {
                        const box = $('.cr-img', fig), img = $('img', fig), cap = $('figcaption', fig);
                        gsap.fromTo(box, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: box, start: 'top 92%', end: 'top 45%', scrub: 0.6 } });
                        gsap.fromTo(img, { scale: 1.3, yPercent: -8 }, { scale: 1.05, yPercent: 6, ease: 'none', scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
                        gsap.fromTo(cap, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, ease: 'eraOut', scrollTrigger: { trigger: cap, start: 'top 92%', once: true } });
                    });
                }
            }
        }
        const route = $('.lx-route path', place);
        if (route && !$('.lx-vdoor', root)) {      // with the video door, the route draws during the hold (see above)
            const L = route.getTotalLength();
            gsap.set(route, { strokeDasharray: `4 6`, strokeDashoffset: 0 });
            gsap.fromTo($('.lx-route .draw', place), { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: $('.lx-route', place), start: 'top 85%', end: 'bottom 45%', scrub: true } });
            /* each stop appears in turn as the line reaches it, scrubbed with the scroll */
            $$('.lx-stop', place).forEach((s, i, arr) => gsap.fromTo(s, { opacity: 0, y: 20 }, { opacity: 1, y: 0, ease: 'none', scrollTrigger: { trigger: $('.lx-route', place), start: `top+=${(i / arr.length) * 70}% 85%`, end: `top+=${(i / arr.length) * 70}% 65%`, scrub: 0.6 } }));
        }
        $$('.lx-place .lower > div:first-child', place).forEach((el) => gsap.fromTo(el, { opacity: 0, y: 40 }, { opacity: 1, y: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 60%', scrub: 0.6 } }));
        }
        /* ---------- split picture -> "Contact" (scroll-scrubbed split-panel merge + fullscreen zoom, after ERA): pinned and
           scrubbed. One full-screen photo is drawn as two layers, each clipped to one half (they overlap by 1px, so no seam
           can ever show). At the start both are scaled down and pulled apart into two staggered panels with a gap.
             1. the panels slide vertically into line
             2. the gap closes until they are one continuous picture (it starts while the alignment finishes)
             3. a short hold, then the whole picture scales out until it fills the screen
             4. "Contact" rises on it, and the pin lets go: the full-screen photo simply scrolls on into the contact section
           Every distance is worked out from the screen size and recalculated on resize; only transforms move, so there are
           no layout shifts; scrolling up plays it all back in reverse. ---------- */
        {
            const mg = $('.lx-merge', root);
            if (mg) {
                const l = $('.m-half.l', mg), r = $('.m-half.r', mg), halves = [l, r];
                const shade = $('.m-shade', mg), title = $('.m-title', mg);
                /* each letter in its own mask, so it rises out of an invisible slot */
                const chars = new SplitText(title, { type: 'chars', charsClass: 'split-char', mask: 'chars' }).chars;
                /* responsive geometry: panel scale, half the gap (dx) and half the vertical stagger (dy), in px */
                const g = {};
                const calc = () => {
                    const wide = innerWidth > 860;
                    g.S = wide ? 0.62 : 0.72;
                    g.dx = (wide ? Math.max(28, innerWidth * 0.045) : innerWidth * 0.03);
                    g.dy = innerHeight * (wide ? 0.065 : 0.045);
                };
                calc();
                ScrollTrigger.addEventListener('refreshInit', calc);
                cleanups.push(() => ScrollTrigger.removeEventListener('refreshInit', calc));
                gsap.set(halves, { force3D: true, transformOrigin: '50% 50%' });
                /* the editorial frame around the panels: heading, rules, text + link */
                const headWrap = $('.m-head-wrap', mg), copy = $('.m-copy', mg);
                const hLines = $$('.m-line', mg), ruleH = $('.m-rule.h', mg), ruleV = $('.m-rule.v', mg);
                const copyParts = [$('.m-desc', mg), $('.m-cta', mg)];
                const imgs = halves.map((h) => $('img', h));
                if (reduce) {
                    gsap.set(shade, { opacity: 1 });
                    gsap.set([headWrap, copy], { autoAlpha: 0 });
                } else {
                    /* heading: each line rises out of its mask, one after the other; the rules draw in; the text and the link
                       follow. Plays as the section arrives and rewinds if you scroll back above it */
                    const intro = gsap.timeline({ paused: true })
                        .fromTo(hLines, { yPercent: 112, rotate: 2 }, { yPercent: 0, rotate: 0, duration: 1.3, stagger: 0.14, ease: 'expo.out' }, 0)
                        .fromTo(ruleH, { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'expo.inOut' }, 0.25)
                        .fromTo(ruleV, { scaleY: 0 }, { scaleY: 1, duration: 1.2, ease: 'expo.inOut' }, 0.35)
                        .fromTo(copyParts, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.12, ease: 'expo.out' }, 0.45);
                    ScrollTrigger.create({ trigger: mg, start: 'top 55%', onEnter: () => intro.play(), onLeaveBack: () => intro.reverse() });
                    /* parallax while the section comes up the screen: the two panels drift at slightly different speeds
                       (the left one a little more) and settle exactly as the pin starts */
                    gsap.fromTo(imgs, { yPercent: (i) => (i ? 3 : 5) }, {
                        yPercent: 0, ease: 'none', scrollTrigger: { trigger: mg, start: 'top bottom', end: 'top top', scrub: 0.6 },
                    });
                    gsap.set(imgs, { scale: 1.12, transformOrigin: '50% 50%' });   // room for the parallax; the timeline brings it to 1
                    gsap.set(chars, { yPercent: 115, rotate: 7, opacity: 0, filter: 'blur(10px)', transformOrigin: '0% 100%' });
                    gsap.set(title, { letterSpacing: '0.22em', scale: 1.08 });
                    const tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: mg, start: 'top top', end: () => `+=${innerHeight * 2.6}`, pin: true, scrub: 1.2,
                            anticipatePin: 1, invalidateOnRefresh: true,
                            onUpdate: (st) => { mg.dataset.tone = st.progress > 0.72 ? 'dark' : 'light'; },
                        },
                    });
                    /* the starting state comes from the "from" values (applied at once, and restored when scrolling back up) */
                    tl.fromTo(halves, { scale: () => g.S }, { scale: () => g.S, duration: 0.001, immediateRender: true }, 0)
                    /* the photo inside both panels settles from its slight zoom over the whole merge (identical in both
                       halves, so the join stays seamless), and the editorial frame steps aside as the gap starts closing */
                      .to(imgs, { scale: 1, duration: 2.9, ease: 'none' }, 0)
                      .to(headWrap, { y: () => -innerHeight * 0.05, autoAlpha: 0, duration: 0.6, ease: 'power2.in' }, 0.45)
                      .to(copy, { y: () => innerHeight * 0.05, autoAlpha: 0, duration: 0.6, ease: 'power2.in' }, 0.45)
                    /* 1. vertical alignment: left panel down -> 0, right panel up -> 0 */
                      .fromTo(halves, { y: (i) => (i ? -g.dy : g.dy) }, { y: 0, duration: 1.2, ease: 'power2.inOut', immediateRender: true }, 0)
                    /* 2. close the gap: the panels slide together until they are one picture */
                      .fromTo(halves, { x: (i) => (i ? g.dx : -g.dx) }, { x: 0, duration: 1.4, ease: 'power3.inOut', immediateRender: true }, 0.5)
                    /* 3. after a short hold, the merged picture scales out to fill the screen */
                      .fromTo(halves, { scale: () => g.S }, { scale: 1, duration: 0.85, ease: 'power2.inOut', immediateRender: false }, 2.05)
                    /* 4. the new page: a light shade, then "Contact" while the photo is still settling: each letter rises
                          out of its mask from the middle outwards, untilting and coming into focus, as the word tightens
                          from wide spacing and settles from a slight zoom */
                      .to(shade, { opacity: 1, duration: 0.5, ease: 'none' }, 2.45)
                      .to(chars, { yPercent: 0, rotate: 0, opacity: 1, filter: 'blur(0px)', duration: 0.75, ease: 'expo.out', stagger: { each: 0.06, from: 'center' } }, 2.5)
                      .to(title, { letterSpacing: '0em', scale: 1, duration: 1.0, ease: 'expo.out' }, 2.5)
                      .to({}, { duration: 0.4 });
                }
            }
        }
        /* ---------- footer ---------- */
        const foot = $('.lx-foot', root);
        if (foot) {
        gsap.fromTo($('.lx-foot .ghost', foot), { xPercent: -40 }, { xPercent: -60, ease: 'none', scrollTrigger: { trigger: foot, start: 'top bottom', end: 'bottom bottom', scrub: true } });
        const fChars = new SplitText($('.lx-foot .big .disp', foot), { type: 'chars', charsClass: 'char' }).chars;
        gsap.fromTo(fChars, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: { each: 0.04, from: 'center' }, duration: 1.4, ease: 'lux', scrollTrigger: { trigger: foot, start: 'top 40%' } });
        gsap.fromTo($('.lx-foot .big .script', foot), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.8, delay: 0.5, ease: 'luxSoft', scrollTrigger: { trigger: foot, start: 'top 40%' } });
        reveal($$('.lx-foot .cols > div', foot));
        }

        /* circles draw in when they appear */
        $$('.lx-circle .track', root).forEach((c) => gsap.fromTo(c, { strokeDasharray: 566, strokeDashoffset: 566 }, { strokeDashoffset: 0, duration: 2, ease: 'luxInOut', scrollTrigger: { trigger: c.closest('.lx-circle'), start: 'top 92%' } }));
    }, root);

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

/* =========================================================
   The sections moved from Home to the About page (Step Inside -> FAQ), in the same style and motion.
   initLuxSections(root) -> destroy(). Runs inside the site layout, which already owns the smooth scroll
   (window.__lenis), so it only adds this page's scroll animations.
   ========================================================= */
export function initLuxSections(root) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cleanups = [];
    const scrollToY = (y) => (window.__lenis ? window.__lenis.scrollTo(y, { duration: 1.2 }) : window.scrollTo({ top: y, behavior: 'smooth' }));
    const petalSrc = [1, 2, 3, 4, 5, 6].map((i) => `/images/botanical/petal-${i}.png`);
    const petals = $$('.lx-petals', root).map((c) => {
        const requested = +c.dataset.count || 26;
        return new Petals(c, petalSrc, reduce ? 0 : (isDesktop() ? requested : Math.ceil(requested * 0.55)));
    });
    cleanups.push(() => petals.forEach((p) => p.destroy()));
    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
        /* cursor parallax + perpetual sway of the botanical layers */
        const layers = $$('[data-depth]', root).map((el) => ({ d: +el.dataset.depth, x: gsap.quickTo(el, 'x', { duration: 1.4, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: 1.4, ease: 'power3' }) }));
        const move = (e) => { const mx = e.clientX / innerWidth - 0.5, my = e.clientY / innerHeight - 0.5; layers.forEach((l) => { l.x(mx * l.d * 40); l.y(my * l.d * 26); }); };
        if (isDesktop() && !reduce) { window.addEventListener('mousemove', move); cleanups.push(() => window.removeEventListener('mousemove', move)); }
        $$('.lx-flora .sway', root).forEach((el, i) => {
            const amp = +el.closest('.lx-flora').dataset.sway || 2;
            gsap.to(el, { rotation: amp, y: amp * 2, duration: 4.5 + (i % 3) * 1.3, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: -i * 0.9 });
        });
        const wind = () => { const v = window.__lenis?.velocity || 0; petals.forEach((pt) => { pt.wind += v * 0.004; }); };
        gsap.ticker.add(wind);
        cleanups.push(() => gsap.ticker.remove(wind));

        /* ---------- portal: arched window opens into the tower ---------- */
        const portal = $('.lx-portal', root);
        if (portal) mm.add({ desk: '(min-width: 761px)', mob: '(max-width: 760px)' }, (c) => {
            const start = c.conditions.desk
                ? 'inset(15vh 36vw 8vh 36vw round 32vw 32vw 0vw 0vw)'
                : 'inset(18vh 14vw 10vh 14vw round 40vw 40vw 0vw 0vw)';
            const ringStart = c.conditions.desk ? { l: 36, t: 13.6, b: 8, r: 32 } : { l: 14, t: 16, b: 10, r: 40 };
            const win = $('.lx-portal .window', portal);
            gsap.set(win, { clipPath: start });
            gsap.set($('.lx-portal .window img', portal), { scale: c.conditions.desk ? 1.35 : 1.22 });
            const tl = gsap.timeline({ scrollTrigger: { trigger: portal, start: 'top top', end: '+=220%', pin: true, scrub: 1 } });
            tl.to(win, { clipPath: 'inset(0vh 0vw 0vh 0vw round 0vw 0vw 0vw 0vw)', ease: 'luxSoft', duration: 1 }, 0)
                .to($('.lx-portal .window img', portal), { scale: 1, ease: 'luxSoft', duration: 1 }, 0)
                .fromTo($('.lx-portal .ring', portal), { left: `${ringStart.l}vw`, right: `${ringStart.l}vw`, top: `${ringStart.t}vh`, bottom: `${ringStart.b}vh`, borderRadius: `${ringStart.r}vw ${ringStart.r}vw 0 0` },
                    { left: '-2vw', right: '-2vw', top: '-2vh', bottom: '-2vh', borderRadius: '0vw 0vw 0 0', opacity: 0, ease: 'luxSoft', duration: 1 }, 0)
                .to($('.lx-portal .word.l', portal), { xPercent: -120, opacity: 0, ease: 'power2.in', duration: 0.6 }, 0)
                .to($('.lx-portal .word.r', portal), { xPercent: 120, opacity: 0, ease: 'power2.in', duration: 0.6 }, 0)
                .to($('.lx-portal .sub', portal), { opacity: 0, duration: 0.3 }, 0)
                .to($('.lx-portal .portal-axis', portal), { opacity: 0, scaleY: 1.35, duration: 0.45, ease: 'power2.in' }, 0)
                .to($('.lx-portal .portal-index', portal), { opacity: 0, duration: 0.35 }, 0)
                .to($('.lx-portal .f-left', portal), { xPercent: -60, yPercent: 30, scale: 1.5, ease: 'power1.in', duration: 1 }, 0)
                .to($('.lx-portal .f-right', portal), { xPercent: 60, yPercent: 25, scale: 1.5, ease: 'power1.in', duration: 1 }, 0)
                .to($('.lx-portal .shade', portal), { opacity: 1, duration: 0.4 }, 0.85)
                .fromTo($('.lx-portal .reveal', portal), { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, 0.95)
                .to($('.lx-portal .threshold', portal), { opacity: 1, duration: 0.25 }, 1.02)
                .to($$('.lx-portal .threshold i', portal), { scaleX: 1, duration: 0.35, stagger: 0.08, ease: 'lux' }, 1.04)
                .to({}, { duration: 0.35 });
        });

        /* ---------- collection ---------- */
        linesUp($$('.lx-collection .lead', root));
        reveal($$('.lx-collection .tag', root));
        if ($('.lx-slider', root)) gsap.fromTo($('.lx-slider .frame', root), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'luxInOut', scrollTrigger: { trigger: $('.lx-slider', root), start: 'top 80%' } });

        /* ---------- quote band ---------- */
        if ($('.lx-quote .bg', root)) gsap.fromTo($('.lx-quote .bg', root), { yPercent: -10 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: $('.lx-quote', root), start: 'top bottom', end: 'bottom top', scrub: true } });
        /* side-image version (About): the photo wipes open from the left and settles */
        const qImg = $('.lx-quote .q-img', root);
        if (qImg) {
            gsap.fromTo(qImg, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.4, ease: 'luxInOut', scrollTrigger: { trigger: qImg, start: 'top 80%' } });
            gsap.fromTo($('img', qImg), { scale: 1.25 }, { scale: 1, duration: 1.8, ease: 'lux', scrollTrigger: { trigger: qImg, start: 'top 80%' } });
        }
        linesUp($$('.lx-quote blockquote .disp', root), 0.08);
        reveal($$('.lx-quote blockquote .micro', root));
        $$('.lx-hang .lx-flora', root).forEach((f) => {
            gsap.fromTo(f, { yPercent: -18 }, { yPercent: 14, ease: 'none', scrollTrigger: { trigger: f.parentElement, start: 'top bottom', end: '+=160%', scrub: true } });
            gsap.fromTo(f, { clipPath: `circle(0% at ${f.dataset.anchor})` }, { clipPath: `circle(150% at ${f.dataset.anchor})`, duration: 2.6, ease: 'luxSoft', scrollTrigger: { trigger: f.parentElement, start: 'top 85%' } });
        });

        /* ---------- vision: three rows of type travel horizontally ---------- */
        const vision = $('.lx-vision', root);
        if (vision) {
        const rows = $$('.lx-vision .row', vision);
        const bigs = $$('.lx-vision .big span', vision);
        const countryEl = $('.lx-vision .country', vision);
        const country = countryEl ? new SplitText(countryEl, { type: 'chars', charsClass: 'char' }).chars : [];
        const vt = gsap.timeline({ scrollTrigger: { trigger: vision, start: 'top top', end: '+=180%', pin: true, scrub: 1 } });
        rows.forEach((r, i) => {
            const from = [40, 62, 28][i] || 40;
            vt.fromTo(r, { x: () => innerWidth * from / 100 }, { x: () => -(r.scrollWidth - innerWidth * 0.62), ease: 'none', duration: 1 }, 0);
        });
        /* the decorations are optional (the About page's photo version only keeps the travelling rows) */
        const label = $('.lx-vision .label', vision), note = $('.lx-vision .note', vision), flora = $('.lx-vision .lx-flora', vision);
        if (bigs.length) vt.fromTo(bigs, { xPercent: 60, opacity: 0 }, { xPercent: 0, opacity: 1, stagger: 0.12, ease: 'power2.out', duration: 0.4 }, 0.05);
        if (country.length) vt.fromTo(country, { opacity: 0, y: 14 }, { opacity: 1, y: 0, stagger: 0.03, duration: 0.2 }, 0.3);
        if (label) vt.fromTo(label, { opacity: 0 }, { opacity: 1, duration: 0.15 }, 0);
        if (note) vt.fromTo(note, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.25 }, 0.45);
        if (flora) vt.fromTo(flora, { yPercent: 40, rotation: 6 }, { yPercent: -6, rotation: 0, ease: 'none', duration: 1 }, 0);
        const photo = $('.lx-vision .v-photo img', vision);
        if (photo) vt.fromTo(photo, { scale: 1.12 }, { scale: 1, ease: 'none', duration: 1 }, 0); // slow push-out behind the rows
        }

        /* ---------- "Book a site visit" section: the circle and the drifting photo strip ---------- */
        const placeSec = $('section.lx-place', root);
        if (placeSec) {
        reveal($$('.cta', placeSec));
        gsap.fromTo($('.peek img', placeSec), { xPercent: 0 }, { xPercent: -30, ease: 'none', scrollTrigger: { trigger: placeSec, start: 'top bottom', end: 'bottom top', scrub: true } });
        }

        /* ---------- sky: clouds part over the city ---------- */
        const sky = $('.lx-sky', root);
        if (sky) {
        const st = gsap.timeline({ scrollTrigger: { trigger: sky, start: 'top top', end: '+=170%', pin: true, scrub: 1 } });
        st.fromTo($('.lx-sky .city img', sky), { scale: 1.25 }, { scale: 1, ease: 'none', duration: 1 }, 0)
            .to($('.lx-sky .c0', sky), { yPercent: -68, scale: 1.35, opacity: 0, ease: 'power1.in', duration: 0.8 }, 0)
            .to($('.lx-sky .c1', sky), { xPercent: -85, yPercent: -10, ease: 'power1.in', duration: 0.8 }, 0)
            .to($('.lx-sky .c2', sky), { xPercent: 85, yPercent: -6, ease: 'power1.in', duration: 0.8 }, 0)
            .to($('.lx-sky .c3', sky), { scale: 2.2, yPercent: -40, opacity: 0, ease: 'power1.in', duration: 0.7 }, 0)
            .to($('.lx-sky .c4', sky), { xPercent: -50, yPercent: -60, opacity: 0, ease: 'power1.in', duration: 0.6 }, 0.05)
            .fromTo($('.lx-sky .sky-glow', sky), { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power1.out' }, 0.36)
            .fromTo($('.lx-sky .copy', sky), { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.35 }, 0.45)
            .to({}, { duration: 0.2 });
        }

        /* ---------- services: pinned three-act sequence ---------- */
        const svc = $('.lx-services', root);
        const slides = svc ? $$('.lx-services .slide', svc) : [];
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
                scrollToY(trig.start + (trig.end - trig.start) * ((target + 0.5) / slides.length), { duration: 1.2 });
            };
            const prevB = $('.lx-services .prev', svc), nextB = $('.lx-services .next', svc);
            const pv = () => go(-1), nx = () => go(1);
            prevB.addEventListener('click', pv); nextB.addEventListener('click', nx);
            cleanups.push(() => { prevB.removeEventListener('click', pv); nextB.removeEventListener('click', nx); });
        }

        /* ---------- values: pinned list highlights, then the cream arch rises ---------- */
        const vals = $('.lx-values', root);
        if (vals) {
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
        }

        /* ---------- split: numbers ---------- */
        const split = $('.lx-split', root);
        if (split) {
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
        }

        /* ---------- gallery: staggered horizontal drift ---------- */
        const gal = $('.lx-gallery', root);
        if (gal) {
        const track = $('.lx-gallery .track', gal);
        gsap.fromTo(track, { x: 0 }, { x: () => -(track.scrollWidth - innerWidth * 0.86), ease: 'none', scrollTrigger: { trigger: gal, start: 'top 70%', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
        $$('.lx-gallery .card .img', gal).forEach((c) => gsap.fromTo(c, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.6, ease: 'luxInOut', scrollTrigger: { trigger: gal, start: 'top 75%' } }));
        linesUp($$('.lx-gallery .head .disp', gal));
        $$('.lx-gallery .lx-flora', gal).forEach((f, i) => gsap.fromTo(f, { yPercent: 30 }, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: gal, start: 'top bottom', end: 'bottom top', scrub: true } }));
        }

        /* ---------- faq ---------- */
        reveal($$('.lx-faq details', root));
        linesUp($$('.lx-faq .disp', root));

        /* circles draw in when they appear */
        $$('.lx-circle .track', root).forEach((c) => gsap.fromTo(c, { strokeDasharray: 566, strokeDashoffset: 566 }, { strokeDashoffset: 0, duration: 2, ease: 'luxInOut', scrollTrigger: { trigger: c.closest('.lx-circle'), start: 'top 92%' } }));
    }, root);

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
