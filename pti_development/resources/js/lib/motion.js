/* =========================================================
   Page motion: smooth scroll + every scroll animation.
   initMotion(root) returns { intro, scrollTo, destroy }.
   ========================================================= */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const $$ = (s, c) => Array.from(c.querySelectorAll(s));
const $ = (s, c) => c.querySelector(s);

export function initMotion(root) {
    const tickers = [];
    let lenis = null;

    if (prefersReducedMotion()) {
        document.documentElement.classList.remove('has-motion');
        return { intro: gsap.timeline({ paused: true }), scrollTo: (el) => el.scrollIntoView(), lenis: null, destroy() {} };
    }
    document.documentElement.classList.add('has-motion');

    // smooth scrolling
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    tickers.push(raf);
    window.__lenis = lenis;

    const mm = gsap.matchMedia();
    let intro;

    const ctx = gsap.context(() => {
        intro = buildIntro(root);

        // split headings: lines slide up
        $$('[data-split]', root).forEach((h) => {
            const lines = $$('.line-mask > span', h);
            gsap.fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 85%' } });
        });

        // generic reveals
        ScrollTrigger.batch($$('[data-reveal]', root), {
            start: 'top 88%',
            onEnter: (els) => gsap.fromTo(els, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.08, ease: 'expo.out', overwrite: true }),
        });

        // image clip reveals
        $$('[data-clip]', root).forEach((m) => {
            gsap.fromTo(m, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: m, start: 'top 80%' } });
            const img = $('img', m);
            if (img) gsap.fromTo(img, { scale: 1.3 }, { scale: 1, duration: 2, ease: 'expo.out', scrollTrigger: { trigger: m, start: 'top 80%' } });
        });

        // parallax
        $$('[data-parallax]', root).forEach((p) => {
            const amt = +p.dataset.parallax || 10;
            gsap.fromTo(p, { yPercent: -amt }, { yPercent: amt, ease: 'none', scrollTrigger: { trigger: p.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
        });

        // statement words light up
        $$('.statement-text', root).forEach((st) => {
            gsap.fromTo($$('.w', st), { opacity: 0.14 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: st, start: 'top 80%', end: 'bottom 45%', scrub: true } });
        });

        // marquee follows scroll direction
        $$('.marquee-track', root).forEach((track) => {
            let x = 0, dir = -1;
            ScrollTrigger.create({ onUpdate: (self) => { dir = self.direction === 1 ? -1 : 1; } });
            const tick = () => {
                const w = track.scrollWidth / 3;
                x += dir * 1.1;
                if (x <= -w) x += w;
                if (x > 0) x -= w;
                track.style.transform = `translate3d(${x}px,0,0)`;
            };
            gsap.ticker.add(tick);
            tickers.push(tick);
        });

        // grid cards
        $$('.projects-grid .p-card', root).forEach((c) => {
            gsap.fromTo($('.p-card-media', c), { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.3, ease: 'expo.inOut', scrollTrigger: { trigger: c, start: 'top 90%' } });
        });

        // scroll-driven stats: the numbers stay in place and their digits spin with the scroll, one after another
        $$('[data-scrub-stats]', root).forEach((sec) => {
            const cards = $$('.num-card, .stat-plain', sec);
            if (!cards.length) return;
            const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 90%', end: 'center 45%', scrub: 0.8 } });
            cards.forEach((card, i) => {
                const at = i * 0.1;
                $$('.odo-col', card).forEach((col, k) => {
                    const d = +col.dataset.d;
                    tl.fromTo(col.firstElementChild, { yPercent: 0 }, { yPercent: -((10 + d) / 20) * 100, ease: 'power2.out', duration: 1 + k * 0.12 }, at);
                });
            });
        });

        // odometers roll like an elevator display
        $$('.num-card', root).forEach((card) => {
            if (card.closest('[data-scrub-stats]')) return;
            ScrollTrigger.create({
                trigger: card, start: 'top 85%', once: true,
                onEnter: () => {
                    card.classList.add('is-rolling');
                    $$('.odo-col', card).forEach((col, k) => {
                        const d = +col.dataset.d;
                        gsap.fromTo(col.firstElementChild, { yPercent: 0 }, {
                            yPercent: -((10 + d) / 20) * 100, duration: 2.2 + k * 0.25, ease: 'expo.inOut', delay: 0.2,
                            onComplete: () => card.classList.remove('is-rolling'),
                        });
                    });
                },
            });
        });

        // video frame opens up
        $$('.video-frame', root).forEach((v) => {
            gsap.fromTo(v, { clipPath: 'inset(14% 16% 14% 16% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 22px)', ease: 'none', scrollTrigger: { trigger: v, start: 'top 95%', end: 'center 55%', scrub: true } });
            gsap.fromTo($('img', v), { scale: 1.35 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: v, start: 'top bottom', end: 'bottom top', scrub: true } });
        });

        // process steps
        $$('.process-step', root).forEach((p, i) => gsap.fromTo(p, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 1, delay: i * 0.12, ease: 'expo.out', scrollTrigger: { trigger: p.parentElement, start: 'top 85%' } }));
        // (footer "PTI Development" stays put so the whole name is always visible)
    }, root);

    // desktop-only: horizontal projects + stacking service cards
    mm.add('(min-width: 1100px)', () => {
        const track = $('.ph-track', root);
        if (!track) return;
        const section = track.closest('.projects-h');
        /* project page "Related Projects": the strip travels exactly until the last card's right edge meets the page
           margin, so it ends on a whole card with nothing cut off at the right */
        const related = section.classList.contains('pj-related');
        const relEnd = () => {
            const last = track.lastElementChild;
            const margin = parseFloat(getComputedStyle(track).paddingLeft) || 0;
            return Math.max(1, last.offsetLeft + last.offsetWidth - (window.innerWidth - margin));
        };
        const dist = () => (related ? relEnd() : track.scrollWidth - window.innerWidth + window.innerWidth * 0.05);
        const tw = gsap.to(track, {
            x: () => (related ? -relEnd() : -dist() + window.innerWidth * 0.3 - 40), ease: 'none',
            scrollTrigger: { trigger: section, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 },
        });
        const bar = $('.ph-progress i', section);
        if (bar) gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: () => '+=' + dist(), scrub: true } });
        $$('.p-card', track).forEach((c) => {
            gsap.fromTo($('.p-card-media', c), { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)', ease: 'expo.out', duration: 1.2, scrollTrigger: { trigger: c, containerAnimation: tw, start: 'left 95%' } });
        });
    });
    mm.add('(min-width: 901px)', () => {
        const svc = $$('.svc-card', root);
        svc.forEach((c, i) => {
            c.style.zIndex = i + 1;
            if (i === svc.length - 1) return;
            gsap.to(c, { scale: 0.92 - (svc.length - i) * 0.01, filter: 'brightness(.8)', ease: 'none', scrollTrigger: { trigger: svc[i + 1], start: 'top bottom', end: 'top 20%', scrub: true } });
        });
    });

    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);
    const refreshTimer = setTimeout(onLoad, 600);

    return {
        intro,
        lenis,
        scrollTo: (el) => lenis.scrollTo(el, { offset: -10 }),
        destroy() {
            clearTimeout(refreshTimer);
            window.removeEventListener('load', onLoad);
            tickers.forEach((t) => gsap.ticker.remove(t));
            mm.revert();
            ctx.revert();
            lenis.destroy();
            if (window.__lenis === lenis) window.__lenis = null;
        },
    };
}

/* Hero entrance (home hero or inner page hero) */
function buildIntro(root) {
    const tl = gsap.timeline({ paused: true });
    const hero = $('.hero', root);
    if (hero) {
        const strokes = $$('.hero-blueprint line, .hero-blueprint rect, .hero-blueprint path', hero);
        const bands = $$('.hero-band', hero).reverse(); // bottom floor first
        gsap.set(strokes, { strokeDasharray: 1, strokeDashoffset: 1 });
        gsap.set(bands, { clipPath: 'inset(100% 0 0 0)' });
        gsap.set($$('h1 .line-mask > span', hero), { yPercent: 110 });
        gsap.set($$('[data-hero-in]', hero), { opacity: 0, y: 30 });
        tl.to(strokes, { strokeDashoffset: 0, duration: 1.2, stagger: { each: 0.006, from: 'end' }, ease: 'power2.inOut' }, 0)
            .to(bands, { clipPath: 'inset(0% 0 0 0)', duration: 0.9, stagger: 0.09, ease: 'expo.inOut' }, 0.5)
            .to($('.hero-blueprint', hero), { opacity: 0.12, duration: 1.2 }, 1.3)
            .to($$('h1 .line-mask > span', hero), { yPercent: 0, duration: 1.3, stagger: 0.1, ease: 'expo.out' }, 0.9)
            .to($$('[data-hero-in]', hero), { y: 0, opacity: 1, duration: 1, stagger: 0.08, ease: 'expo.out' }, 1.3);

        gsap.to($('.hero-media', hero), { yPercent: 18, scale: 1.05, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
        gsap.to($('.hero-content', hero), { yPercent: -20, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: hero, start: '40% top', end: 'bottom top', scrub: true } });
        return tl;
    }

    const ph = $('.page-hero', root);
    if (ph) {
        const img = $('.bg img, .bg video', ph);
        gsap.set($('.bg', ph), { clipPath: 'inset(100% 0 0 0)' });
        gsap.set($$('h1 .line-mask > span', ph), { yPercent: 110 });
        gsap.set($$('[data-hero-in]', ph), { opacity: 0, y: 30 });
        tl.to($('.bg', ph), { clipPath: 'inset(0% 0 0 0)', duration: 1.3, ease: 'expo.inOut' }, 0)
            .fromTo(img, { scale: 1.3 }, { scale: 1, duration: 2, ease: 'expo.out' }, 0.2)
            .to($$('h1 .line-mask > span', ph), { yPercent: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out' }, 0.6)
            .to($$('[data-hero-in]', ph), { y: 0, opacity: 1, duration: 1, stagger: 0.08, ease: 'expo.out' }, 0.9);
        if (img) gsap.to(img, { yPercent: -12, ease: 'none', scrollTrigger: { trigger: ph, start: 'top top', end: 'bottom top', scrub: true } });
    }
    return tl;
}

/* Page change: the same logo preloader as a fresh load (PTI logo in the middle + loading bar). It lives on <body>,
   outside React, so it stays up while Inertia swaps the page and is lifted once the new page is in. */
const PTI_MARK = 'M0.00454068 18.3256H0V73.5928H18.4044V92H36.827V91.9728H73.5949V55.1674V18.3619H73.6085V0H0.00908136V18.3256H0.00454068ZM18.4271 18.3619H55.195V55.1674H36.7997V73.5701H18.4271V18.3619Z';
let navLoader = null, navSafety = 0;
export function coverCurtain(onDone) {
    if (prefersReducedMotion()) return onDone();
    if (navLoader) navLoader.remove();
    navLoader = document.createElement('div');
    navLoader.className = 'lx-pre-host is-nav';
    navLoader.setAttribute('aria-hidden', 'true');
    navLoader.innerHTML = `<div class="lx-pre"><svg class="emblem" viewBox="0 0 74 92"><path d="${PTI_MARK}"/></svg><div class="pre-bar"><i></i></div></div>`;
    document.body.appendChild(navLoader);
    const pre = navLoader.firstChild;
    gsap.fromTo(pre, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out', onComplete: onDone });
    gsap.fromTo($('.emblem', pre), { scale: 0.86 }, { scale: 1, duration: 0.6, ease: 'expo.out' });
    clearTimeout(navSafety);
    navSafety = setTimeout(revealCurtain, 12000);   // never leave the screen covered (e.g. a failed visit)
}

export function revealCurtain() {
    clearTimeout(navSafety);
    const host = navLoader;
    if (!host) return;
    navLoader = null;
    gsap.to(host.firstChild, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: 'expo.inOut', delay: 0.15, onComplete: () => host.remove() });
}

/* the site preloader: the PTI logo fades and scales in at the centre, holds, then the navy cover lifts away and the
   page intro plays */
export function playLoader(loaderEl, onReveal, onGone) {
    const emblem = $('.emblem', loaderEl), bar = $('.pre-bar', loaderEl);
    gsap.set(emblem, { opacity: 0, scale: 0.82 });
    return gsap.timeline({ onComplete: onGone })
        .to(emblem, { opacity: 1, scale: 1, duration: 1.1, ease: 'expo.out' }, 0.1)
        .to([emblem, bar], { opacity: 0, duration: 0.6, ease: 'power2.in' }, 1.5)
        .add(onReveal, 1.8)
        .to(loaderEl, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, 1.7);
}

export { gsap, ScrollTrigger };
