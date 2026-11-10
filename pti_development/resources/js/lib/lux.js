/* =========================================================
   Landing page motion system
   initLux(root, { skipIntro }) -> destroy()
   ========================================================= */
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { createVine } from './vine3d';

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
    const petals = $$('.lx-petals', root).map((c) => {
        const requested = +c.dataset.count || 26;
        const count = reduce ? 0 : (isDesktop() ? requested : Math.ceil(requested * 0.55));
        return new Petals(c, petalSrc, count);
    });
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
                /* data-tone-offset="screen": the section's first screen is transparent (it overlaps the hero) */
                const off = s.dataset.toneOffset === 'screen' ? innerHeight : 0;
                if (r.top + off <= 90 && r.bottom > 90) { tone = s.dataset.tone; }
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
        const eyebrowLines = $$('.lx-hero .t-eyebrow i', root);
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
        gsap.set(eyebrowLines, { scaleX: 0 });
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
            .to(eyebrowLines, { scaleX: 1, ease: 'power3.out', duration: 1.2 }, ZOOM_AT + 0.15)
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

        /* ---------- the concept: ERA reveals + flowers drifting with the scroll and swaying in the wind ---------- */
        {
            const cs = $('.lx-concept', root);
            if (cs) {
                const chars = new SplitText($('[data-c="h"]', cs), { type: 'words,chars', wordsClass: 'split-word', charsClass: 'split-char' }).chars;
                const lines = new SplitText($('[data-c="p"]', cs), { type: 'lines', linesClass: 'split-line', mask: 'lines' }).lines;
                const ctn = $$('[data-c="ctn"]', cs);
                gsap.set(chars, { opacity: 0, yPercent: 50, rotateY: 90 });
                gsap.set(lines, { yPercent: 110 });
                gsap.set(ctn, { opacity: 0, y: 48 });
                ScrollTrigger.create({
                    trigger: $('.c-inner', cs), start: 'top 78%', once: true,
                    onEnter: () => {
                        gsap.to(ctn[0], { opacity: 1, y: 0, duration: 1.2, delay: 0.2, ease: 'eraOut' });
                        gsap.to(chars, { opacity: 1, yPercent: 0, rotateY: 0, duration: 1.2, delay: 0.3, stagger: 0.012, ease: 'eraOut' });
                        gsap.to(lines, { yPercent: 0, duration: 1.2, delay: 1.0, stagger: 0.1, ease: 'eraOut' });
                        gsap.to(ctn[1], { opacity: 1, y: 0, duration: 1.2, delay: 1.3, ease: 'eraOut' });
                    },
                });
                /* real-time 3D vines: wind runs in their vertex shader (see lib/vine3d.js) */
                $$('.c-vine', cs.closest('.lx-hscroll') || cs).forEach((cv) => {
                    try {
                        cleanups.push(createVine(cv, { seed: +cv.dataset.seed || 7, flip: cv.dataset.flip === '1', shape: cv.dataset.shape || 'corner', reduce }));
                    } catch (e) { cv.style.display = 'none'; }      // no WebGL: leave the corner empty
                });
            }
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
                const whole = { trigger: hs, start: 'top top', end: () => `+=${dist()}`, scrub: 0.25, invalidateOnRefresh: true };
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
                /* the bridging flower drifts while the strip moves (ERA xPercent 0 -> -25) */
                const bridge = $('.c-flower.bridge', hs);
                $$('.h-panel', hs).forEach((p) => {
                    const once = (fn) => ScrollTrigger.create({ trigger: p, containerAnimation: tween, start: 'left 85%', once: true, onEnter: fn });
                    const img = $('.h-img', p), lines = $$('.h-line', p), cta = [$('.h-cta', p), $('.h-meta', p)].filter(Boolean);
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
           the buildings below; scrolling on lifts the clouds away, then the rest of the photo scrolls by normally ---------- */
        {
            const cp = $('.lx-clouds', root);
            if (cp) {
                const tl = gsap.timeline({ scrollTrigger: { trigger: cp, start: 'top 15%', end: () => `+=${innerHeight * 0.7}`, scrub: 0.6, invalidateOnRefresh: true } });
                tl.to($('.cl-fade', cp), { yPercent: -100, opacity: 0, ease: 'power1.in', duration: 0.7 }, 0)
                    .to($('.cl-layer.back', cp), { yPercent: -140, opacity: 0, ease: 'power1.in', duration: 1 }, 0)
                    .to($('.cl-layer.extra', cp), { yPercent: -160, opacity: 0, ease: 'power1.in', duration: 1 }, 0)
                    .to($('.cl-layer.mid', cp), { yPercent: -190, opacity: 0, ease: 'power1.in', duration: 1 }, 0)
                    .to($('.cl-layer.low', cp), { yPercent: -220, opacity: 0, ease: 'power1.in', duration: 1 }, 0)
                    .to($('.cl-layer.front', cp), { yPercent: -260, opacity: 0, ease: 'power1.in', duration: 1 }, 0);
            }
        }

        /* ---------- portal: arched window opens into the tower ---------- */
        const portal = $('.lx-portal', root);
        mm.add({ desk: '(min-width: 761px)', mob: '(max-width: 760px)' }, (c) => {
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
            .to($('.lx-sky .c0', sky), { yPercent: -68, scale: 1.35, opacity: 0, ease: 'power1.in', duration: 0.8 }, 0)
            .to($('.lx-sky .c1', sky), { xPercent: -85, yPercent: -10, ease: 'power1.in', duration: 0.8 }, 0)
            .to($('.lx-sky .c2', sky), { xPercent: 85, yPercent: -6, ease: 'power1.in', duration: 0.8 }, 0)
            .to($('.lx-sky .c3', sky), { scale: 2.2, yPercent: -40, opacity: 0, ease: 'power1.in', duration: 0.7 }, 0)
            .to($('.lx-sky .c4', sky), { xPercent: -50, yPercent: -60, opacity: 0, ease: 'power1.in', duration: 0.6 }, 0.05)
            .fromTo($('.lx-sky .sky-glow', sky), { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power1.out' }, 0.36)
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
