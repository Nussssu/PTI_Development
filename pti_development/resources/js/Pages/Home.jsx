import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import '../../css/lux.css';
import { gsap } from 'gsap';
import { initLux } from '../lib/lux';
import { claimPreloader, Field, MenuDropdown, navigate, SiteFooter } from '../Components/Site';

const MARK = 'M0.00454068 18.3256H0V73.5928H18.4044V92H36.827V91.9728H73.5949V55.1674V18.3619H73.6085V0H0.00908136V18.3256H0.00454068ZM18.4271 18.3619H55.195V55.1674H36.7997V73.5701H18.4271V18.3619Z';
const Mark = ({ className }) => <svg className={className} viewBox="0 0 74 92" aria-hidden="true"><path d={MARK} /></svg>;
const B = '/images/botanical/';
const pad = (n) => String(n).padStart(2, '0');

/* internal navigation: the same logo preloader as every other page change */
const go = (href) => (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    navigate(href);
};
/* link for the shared header menu / footer on this page */
const HomeLink = ({ href, onClick, ...rest }) => <a href={href} onClick={(e) => { onClick?.(e); go(href)(e); }} {...rest} />;

function Circle({ href, children, className = '', onClick }) {
    return (
        <a className={`lx-circle ${className}`} href={href} onClick={onClick || (href?.startsWith('/') ? go(href) : undefined)}>
            <svg viewBox="0 0 180 180" aria-hidden="true">
                <circle className="track" cx="90" cy="90" r="89.5" />
                <circle className="arc" cx="90" cy="90" r="89.5" />
            </svg>
            <span className="micro">{children}</span>
        </a>
    );
}

/** One botanical sprite: outer layer gets scroll/cursor motion, inner .sway sways. */
function Flora({ src, className = '', style, anchor = '0% 0%', origin = '0% 0%', depth = 1, sway = 2, turn = 0, soft = false }) {
    return (
        <div className={`lx-flora ${soft ? 'soft' : ''} ${className}`} style={style} data-anchor={anchor} data-depth={depth} data-sway={sway} data-turn={turn}>
            <div className="sway" style={{ '--ox': origin.split(' ')[0], '--oy': origin.split(' ')[1] }}>
                <img src={src} alt="" loading="eager" draggable="false" />
            </div>
        </div>
    );
}

const chars = (text) => text.split('').map((c, i) => <span className="char" key={i}>{c === ' ' ? ' ' : c}</span>);

/* ---------------- sections ---------------- */
function Chrome() {
    return (
        <div className="lx-chrome">
            <a className="lx-badge" href="/" onClick={(e) => { e.preventDefault(); window.__lenis?.scrollTo(0, { duration: 2 }); }} aria-label="PTI Development, back to top">
                <svg className="ring" viewBox="0 0 120 120" aria-hidden="true">
                    <defs><path id="lx-ring" d="M60 60 m-47 0 a47 47 0 1 1 94 0 a47 47 0 1 1 -94 0" /></defs>
                    <text><textPath href="#lx-ring">PTI DEVELOPMENT · SHAPING DREAMS · DHAKA ·</textPath></text>
                </svg>
                <Mark className="mark" />
            </a>
            <MenuDropdown Link={HomeLink} />
        </div>
    );
}

function Preloader({ show }) {
    if (!show) return null;
    return (
        <div className="lx-pre" aria-hidden="true">
            <svg className="frame" viewBox="0 0 1000 1000" preserveAspectRatio="none">
                <path d="M24 0 H976 L1000 24 V976 L976 1000 H24 L0 976 V24 Z" />
            </svg>
            <div className="ghost script">Shopno</div>
            <Mark className="emblem" />
            <div className="side l spaced">Mirpur</div>
            <div className="center">
                <div className="disp t1">PTI</div>
                <div className="disp t2">Development</div>
                <div className="script sc">Dhaka</div>
            </div>
            <div className="side r spaced">Bangladesh</div>
            <div className="vline" />
            <div className="cap micro">PTI Development Ltd.<br />Invest in value. Live in trust.</div>
        </div>
    );
}

/**
 * Hero: plays by itself on load. A pointed (gothic) arch rises out of a navy cover and opens to
 * full screen; as it opens, the scene eases from zoomed-in to fitted while the eyebrow, headline and
 * subtext reveal in the centre (staggered), all at once. The scene itself never scrolls:
 * the hero stays pinned while the next section rises over it. Motion lives in lib/lux.js.
 */
/* one line, stretched to the width of "a Better Life" (see .t-sub in lux.css) */
const HERO_SUB = 'Thoughtfully designed for comfort and modern living.';

function Hero() {
    return (
        <>
            <section className="lx-hero" data-tone="dark">
                <div className="hero-stage">
                    <div className="hero-tower">
                        <img src="/images/hero-tower-dusk.webp" alt="PTI residential tower at dusk, rising above flowering trees, palms and a lit swimming pool" fetchpriority="high" draggable="false" />
                        <div className="tower-grade" />
                    </div>
                </div>
                <div className="hero-title">
                    <div className="t-eyebrow"><span className="w"><span className="word">Premium living in Dhaka</span></span></div>
                    <h1 className="t-main" aria-label="Homes for a Better Life">
                        {[['Homes', 'for'], ['a', 'Better', 'Life']].map((line, li) => (
                            <span className="ln" key={li} aria-hidden="true">
                                {line.map((w) => <span className="w" key={w}>{chars(w)}</span>)}
                            </span>
                        ))}
                    </h1>
                    <p className="t-sub" aria-label={HERO_SUB}>
                        {HERO_SUB.split(' ').map((w, i) => (
                            <span className="w" key={i} aria-hidden="true"><span className="word">{w}</span></span>
                        ))}
                    </p>
                </div>
            </section>
            <div className="lx-hero-runway" aria-hidden="true" />
        </>
    );
}

/* images for the three promises (same order as the values: craftsmanship, transparency, investment) */
const PROMISE_IMG = ['/images/hd/construction.webp', '/images/hd/skyline.webp', '/images/hd/land.webp'];
/* one-line descriptions under the slider image, sized to the image width (admin text is the fallback) */
const PROMISE_LINE = {
    'Quality Craftsmanship': 'Precise, durable and high-standard construction.',
    Transparency: 'Clear, documented pricing and honest paperwork.',
    'Halal Investment': 'Ethical practices with safe and halal ownership.',
};

/**
 * Section 2 (after the hero): the lavender gothic dome rises over the hero with the curved title, crest
 * and tagline; below them the three promises run as a slider in the ERA "boutique concept" layout
 * (big centred title, framed image, description, caption, auto-advancing pager). Motion lives in lib/lux.js.
 */
function Arch({ values, site }) {
    const promises = values.slice(0, 3);
    return (
        <section className="lx-arch" data-tone="light" data-tone-offset="screen">
            {/* the dome uses the same pointed (gothic) door shape as the hero portal */}
            <svg className="gothic-defs" width="0" height="0" aria-hidden="true" focusable="false">
                <clipPath id="lx-gothic" clipPathUnits="objectBoundingBox">
                    <path d="M0 1 L0 0.58 A0.5864 0.5864 0 0 1 0.5 0 A0.5864 0.5864 0 0 1 1 0.58 L1 1 Z" />
                </clipPath>
            </svg>
            <div className="dome" />
            <svg className="curve" viewBox="0 0 1000 1000" aria-hidden="true">
                <defs><path id="lx-arc" d="M110 522 A457 457 0 0 1 500 70 A457 457 0 0 1 890 522" /></defs>
                <text textAnchor="middle" style={{ fontSize: 30 }}><textPath href="#lx-arc" startOffset="50%">Built On Trust</textPath></text>
            </svg>
            <div className="inner">
                <div className="crest micro"><span>Mirpur</span><Mark /><span>Dhaka</span></div>
                <div className="vline" />
                <p className="micro lede">{site.tagline}</p>
                {/* the three promises, where the 01/02/03 cards used to be */}
                <div className="lx-bslider">
                <div className="b-slides">
                    {promises.map((v, i) => (
                        <article className={`b-slide${i === 0 ? ' is-active' : ''}`} key={v.id} aria-hidden={i !== 0}>
                            <h3 className="disp b-title" data-b="h">{v.title}</h3>
                            <div className="b-img" data-b="img"><img src={PROMISE_IMG[i % PROMISE_IMG.length]} alt={v.title} loading="lazy" /></div>
                        </article>
                    ))}
                </div>
                <div className="b-pager micro" data-b="ctn">
                    <button type="button" className="prev" aria-label="Previous promise">‹</button>
                    <span className="cur">1</span>
                    <span className="bar"><i /></span>
                    <span className="nxt">{promises.length > 1 ? 2 : 1}</span>
                    <button type="button" className="next" aria-label="Next promise">›</button>
                </div>
                {/* description of each promise, under the image + pager; switches with the slide */}
                <div className="b-descs">
                    {promises.map((v, i) => (
                        <p className="b-desc" key={v.id} aria-hidden={i !== 0}>{PROMISE_LINE[v.title] || v.text}</p>
                    ))}
                </div>
                </div>
            </div>
        </section>
    );
}

/**
 * "What our clients say" (ERA quote-section layout): the background fades into the exact sky colour of the
 * scene below it and the scene's top edge melts into that colour, so the picture and the page read as one
 * surface. The quote sits in that sky. Testimonials come from the admin panel. Motion lives in lib/lux.js.
 */
/* shown when the admin panel has no real testimonials yet (placeholder "Lorem ipsum" entries are skipped) */
const CLIENT_SAYS = [
    { id: 'cs1', name: 'Tanvir Ahmed', role: 'Apartment owner, PTI Dream Tower-1', photo_url: null,
      quote: 'From the first site visit to the day we got our keys, PTI kept every promise. The paperwork was clear, the handover was on time, and the building feels even better than the plans.' },
    { id: 'cs2', name: 'Farhana Rahman', role: 'Homeowner, Mirpur', photo_url: null,
      quote: 'What we valued most was the honesty. Every cost was explained up front, and the team was always there to answer our questions. Our family finally has a home we are proud of.' },
    { id: 'cs3', name: 'Mahmudul Hasan', role: 'Land owner & joint-venture partner', photo_url: null,
      quote: 'I handed over my family land with a lot of worry. PTI built with real care for quality, shared updates at every stage and delivered exactly what was agreed.' },
];

function Says({ testimonials: fromAdmin }) {
    const real = fromAdmin.filter((t) => t.quote && !/lorem ipsum/i.test(t.quote));
    const testimonials = real.length ? real : CLIENT_SAYS;
    return (
        <section className="lx-says" data-tone="light">
            <div className="s-band">
                <div className="s-head">
                    <div className="micro s-eyebrow" data-s="ctn">What our clients say</div>
                    <svg className="s-ico" data-s="ctn" viewBox="0 0 48 36" aria-hidden="true">
                        <path d="M0 36V21.6C0 9.9 6.2 2.7 18.4 0l2 4.3C13.6 6.4 10.2 10.4 9.8 16.6H19V36H0Zm28.6 0V21.6C28.6 9.9 34.8 2.7 47 0l2 4.3c-6.8 2.1-10.2 6.1-10.6 12.3h9.2V36H28.6Z" />
                    </svg>
                </div>
                <div className="s-quotes">
                    {testimonials.map((t, i) => (
                        <figure className={`s-quote${i === 0 ? ' is-active' : ''}`} key={t.id} aria-hidden={i !== 0}>
                            <blockquote className="disp s-text" data-s="p"><span className="red-line" aria-hidden="true" />{t.quote}</blockquote>
                            <figcaption className="s-author">
                                <span className="s-avatar" data-s="ctn">
                                    {t.photo_url ? <img src={t.photo_url} alt={t.name} loading="lazy" /> : <b>{t.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</b>}
                                </span>
                                <span className="s-who">
                                    <span className="micro s-name" data-s="p">{t.name}</span>
                                    {t.role && <span className="micro s-role" data-s="p">{t.role}</span>}
                                </span>
                            </figcaption>
                        </figure>
                    ))}
                    {testimonials.length > 1 && (
                        <div className="s-pager micro" data-s="ctn">
                            <button type="button" className="prev" aria-label="Previous testimonial">‹</button>
                            <span className="cur">1</span><span className="sep">/</span><span>{testimonials.length}</span>
                            <button type="button" className="next" aria-label="Next testimonial">›</button>
                        </div>
                    )}
                </div>
            </div>
            <div className="s-scene">
                <img src="/images/says-scene.webp" srcSet="/images/says-scene.webp 1672w, /images/says-scene@2x.webp 3344w" sizes="100vw" alt="PTI residences at dusk: glass building, flowering gardens and a lit pool" width="1672" height="1121" decoding="async" />
                <div className="s-shade" />
            </div>
        </section>
    );
}

/**
 * "We are in numbers" (after the auras-staging.webflow.io intro): the heading rises in, the four cards arrive one by
 * one as a small, tight row in the middle, then all of them grow together and spread into the full-size row of cards,
 * where the figures roll up like a counter over each photo. Figures and labels come from the admin panel (home stats).
 * Motion lives in lib/lux.js.
 */
/* the four photos behind the figures (PTI towers) */
const NUM_IMAGES = ['/images/faq.jpg', '/images/projects-hd/Project5.webp', '/images/projects-hd/Project1.webp', '/images/projects-hd/Project4.webp'];
/* a rolling counter: each digit is a strip of 0-9 three times over; lux.js rolls it with the scroll and it stops on the
   digit after two full turns. It is drawn at its final figure, so without motion it simply shows the number. */
const ODO_TURNS = 2;
function Odo({ value }) {
    return (
        <span className="n-odo" aria-hidden="true">
            {String(value).split('').map((d, i) => (
                <span className="n-dig" key={i}>
                    <span className="n-strip" data-d={d} style={{ transform: `translateY(${-((ODO_TURNS * 10 + +d) / 30) * 100}%)` }}>
                        {Array.from({ length: 30 }, (_, k) => <span key={k}>{k % 10}</span>)}
                    </span>
                </span>
            ))}
        </span>
    );
}

function InNumbers({ stats }) {
    if (!stats.length) return null;
    return (
        <section className="lx-innum" data-tone="light">
            <div className="n-wrap">
                <h2 className="n-title" data-n="h">We are in numbers</h2>
                <div className="n-row">
                    {stats.slice(0, 4).map((s, i) => (
                        <div className="n-card" key={s.id}>
                            <div className="n-img"><img src={NUM_IMAGES[i % NUM_IMAGES.length]} alt="" loading="lazy" /></div>
                            <div className="n-over">
                                <div className="n-val" aria-label={`${s.value}${s.suffix || ''}`}><Odo value={s.value} />{s.suffix}</div>
                                <div className="n-label">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/**
 * "Our Projects" from above (after belgradearbor.rs "View from above"): a top-down photo of the neighbourhood fills the
 * first page of the horizontal track (flipped so the side with more road is at the top, under the title), and the
 * title and the photo each slide at their own pace as the strip moves. Motion lives in lib/lux.js.
 */
function Aerial() {
    return (
        <section className="lx-aerial" data-tone="dark" aria-label="Our projects">
            <div className="a-img"><img src="/images/aerial-roundabout.webp" alt="Aerial view of a tree-lined neighbourhood around a roundabout" /></div>
            <h2 className="disp a-title" data-a="h">Our Projects</h2>
        </section>
    );
}

/* split a project name into up to three title lines (extra words join the last line) */
const titleLines = (name) => {
    const w = name.split(/\s+/);
    return w.length <= 3 ? w : [w[0], w[1], w.slice(2).join(' ')];
};
const hdImage = (p) => (p.image ? `/images/projects-hd/${p.image.split('/').pop()}` : p.image_url);

/** One ERA "location intro" panel: spaced caption, staggered 3-line title over a tall image, details bottom-right,
 *  a circle button half off the right edge. */
function TrackPanel({ cap, lines, img, alt, head, text, meta, href, cta, children, last = false }) {
    return (
        <section className={`h-panel${last ? ' h-last' : ''}`}>
            {children}
            {cap && <div className="h-cap spaced" aria-hidden="true">{cap}</div>}
            <h3 className="h-title disp" aria-label={lines.join(' ')}>
                {lines.map((l, i) => <span className={`h-line l${i + 1}`} key={i} aria-hidden="true">{l}</span>)}
            </h3>
            <div className="h-img"><img src={img} alt={alt} loading="lazy" onError={(e) => { const f = e.currentTarget.dataset.fallback; if (f && e.currentTarget.src.indexOf(f) < 0) e.currentTarget.src = f; }} /></div>
            <div className="h-desc">
                <h4 className="disp h-head" data-h="p">{head}</h4>
                <p className="h-text" data-h="p">{text}</p>
                {meta && <div className="micro h-meta">{meta}</div>}
            </div>
            {cta && <Circle className="h-cta" href={href}>{cta}</Circle>}
        </section>
    );
}

/**
 * Horizontal track (ERA "location" structure): "Our Projects" seen from above, in the clouds -> one panel per
 * project (the last one has a flower in the top-right corner). Vertical scroll moves the whole strip sideways on
 * desktop; on phones the panels stack. Motion lives in lib/lux.js.
 */
function Showcase({ projects: all }) {
    const projects = all.slice(0, 3);          // three projects, in order
    /* first panel shows Airman Tower (name + HD photo) in this section */
    if (projects[0]) projects[0] = { ...projects[0], name: 'Airman Tower', image: null, image_url: '/images/projects-hd/airman-tower.webp' };
    /* second panel shows PTI Shopno Tower-2 (name + HD photo) in this section */
    if (projects[1]) projects[1] = { ...projects[1], name: 'PTI Shopno Tower-2', image: null, image_url: '/images/projects-hd/pti-shopno-tower-2.webp' };
    /* Darul Fazle Tower: its new HD photo in this section */
    projects.forEach((p, i) => { if (/darul\s*fazle/i.test(p.name)) projects[i] = { ...p, image: null, image_url: '/images/projects-hd/darul-fazle-tower.webp' }; });
    const last = projects.length - 1;
    /* phones: the project slider can also be dragged sideways with the mouse (click and drag); a drag never opens a link */
    const slides = useRef(null);
    useEffect(() => {
        const el = slides.current;
        if (!el) return undefined;
        let down = false, moved = false, startX = 0, startLeft = 0;
        const isSlider = () => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).display === 'flex';
        const onDown = (e) => {
            if (e.pointerType !== 'mouse' || e.button !== 0 || !isSlider()) return;
            down = true; moved = false; startX = e.clientX; startLeft = el.scrollLeft;
            el.style.scrollSnapType = 'none';
            el.style.cursor = 'grabbing';
        };
        const onMove = (e) => {
            if (!down) return;
            const dx = e.clientX - startX;
            if (Math.abs(dx) > 4) moved = true;
            el.scrollLeft = startLeft - dx;
            e.preventDefault();
        };
        const onUp = () => {
            if (!down) return;
            down = false;
            el.style.cursor = '';
            /* settle on the nearest project, then hand the snapping back to the browser */
            const panels = [...el.children];
            const pad = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
            const target = panels.reduce((best, p) => (Math.abs(p.offsetLeft - pad - el.scrollLeft) < Math.abs(best.offsetLeft - pad - el.scrollLeft) ? p : best), panels[0]);
            el.scrollTo({ left: target.offsetLeft - pad, behavior: 'smooth' });
            setTimeout(() => { el.style.scrollSnapType = ''; }, 450);
        };
        const onClick = (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } };
        const noDrag = (e) => e.preventDefault();   // stop the browser's own image drag
        el.addEventListener('pointerdown', onDown);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        el.addEventListener('click', onClick, true);
        el.addEventListener('dragstart', noDrag);
        return () => {
            el.removeEventListener('pointerdown', onDown);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            el.removeEventListener('click', onClick, true);
            el.removeEventListener('dragstart', noDrag);
        };
    }, []);
    return (
        <div className="lx-hscroll" data-tone="light">
            <div className="h-track">
                <Aerial />
                {/* phones: the projects sit in a sideways swipe slider; desktop: this wrapper is layout-neutral (display: contents) */}
                <div className="h-slides" ref={slides}>
                {projects.map((p, i) => (
                    <TrackPanel key={p.id} lines={titleLines(p.name)} img={hdImage(p)} alt={p.name}
                        head={p.location}
                        text={p.description || `${p.units} thoughtfully planned residences by PTI Development, with clear pricing, documented paperwork and lasting quality.`}
                        meta={<><span>{p.units} units</span><span>{p.status}</span></>}
                        href="/projects" last={i === last} cta={i === last ? <>View all<br />projects</> : null}>
                        {i === last && <div className="c-flower tr" aria-hidden="true"><canvas className="c-flora" data-src={`${B}projects-tr-white.webp`} data-anchor="top" data-side="-1" data-pads="0.09,0,0,0.09" /></div>}
                    </TrackPanel>
                ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Cloud passage (ERA "loc-w" clouds): after the horizontal track, banks of cloud drift endlessly across the
 * cream page and spill into the sky of a full-bleed photo below. Motion lives in lib/lux.js and lux.css.
 */
function CloudPass({ projects, site }) {
    return (
        <section className="lx-clouds" data-tone="light" aria-label="PTI towers under a cloudy sky">
            <div className="cl-scene"><img src="/images/clouds-scene.webp" alt="Glass towers and gardens under a bright cloudy sky" loading="lazy" /></div>
            <div className="cl-fade" aria-hidden="true" />
            {/* three depths of torn cloud bank hanging from the cream page into the sky; each strip tiles seamlessly, repeated 3x for an endless drift */}
            {/* 2nd layer (['mid', 1]) taken out for now */}
            {[['back', 3], ['front', 2]].map(([n, b]) => (
                <div className={`cl-layer ${n}`} key={n} aria-hidden="true">
                    <div className="cl-track">{[0, 1, 2].map((k) => <img key={k} src={`/images/clouds/bank-${b}.webp`} alt="" draggable="false" />)}</div>
                </div>
            ))}
            {/* "The city you'll call home" content, set on the lower part of the photo below the clouds */}
            <PlaceContent projects={projects} site={site} />
        </section>
    );
}

/**
 * Video door (after the clouds): the cloud section holds still while this page rises over it in the same pointed
 * door shape and colour as the section under the hero. Inside: "Crafted for everyday living", the film right under
 * it (a YouTube embed, YT_ID, in a laptop frame), then two pictures, each with its caption and a short description
 * beside it (Architecture on the left, Living space crossing to the right, lower). Motion lives in lib/lux.js.
 */
const YT_ID = '2C9NmA_p-6Q';   /* youtu.be/2C9NmA_p-6Q */
function VideoDoor() {
    return (
        <section className="lx-arch lx-vdoor" data-tone="light" data-tone-offset="screen">
            <div className="dome" />
            <div className="inner">
                {/* ERA "The space to live in": a tall, condensed title inside the door with the last word in script */}
                <h2 className="cr-title" aria-label="Crafted for everyday living">
                    <span className="disp cr-line" aria-hidden="true">Crafted</span>
                    <span className="disp cr-line" aria-hidden="true">For</span>
                    <span className="disp cr-line" aria-hidden="true">Everyday</span>
                    <span className="script cr-script" aria-hidden="true">Living</span>
                </h2>
                <p className="micro v-lede">Our story</p>
                {/* the film plays inside a laptop, framed like the ERA (videinfra.com/work/era) presentation shot */}
                <div className="v-frame lx-laptop">
                    <div className="lid">
                        <div className="screen">
                            <iframe
                                src={`https://www.youtube-nocookie.com/embed/${YT_ID}?autoplay=1&mute=1&loop=1&playlist=${YT_ID}&rel=0&modestbranding=1&playsinline=1`}
                                title="PTI Development: our story on film"
                                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                                allowFullScreen
                                loading="lazy"
                            />
                        </div>
                    </div>
                    <div className="base"><i /></div>
                </div>
                <div className="cr-pics">
                    <figure className="cr-pic arch">
                        <div className="cr-img"><img src="/images/craft-architecture.webp" alt="Scaffolding around a building under construction" loading="lazy" /></div>
                        <figcaption className="cr-txt">
                            <h3 className="micro cr-cap">Architecture</h3>
                            <p>Every PTI tower starts with a sound structure: engineered foundations, tested materials and on-site supervision on every floor, so the building stands as strong as it looks.</p>
                        </figcaption>
                    </figure>
                    <figure className="cr-pic living">
                        <div className="cr-img"><img src="/images/craft-living.webp" alt="PTI residential tower lit up at night" loading="lazy" /></div>
                        <figcaption className="cr-txt">
                            <h3 className="micro cr-cap">Living space</h3>
                            <p>Bright, well-planned homes with natural light, cross ventilation and green balconies, designed around the way Dhaka families live every day.</p>
                        </figcaption>
                    </figure>
                </div>
            </div>
        </section>
    );
}

/**
 * Split picture -> "Contact" (scroll-triggered split image merge & zoom, after the ERA "two pictures" section, without the
 * flowers). One full-screen photo is shown as two layers, each clipped to one half; at the start both are scaled down
 * and pulled apart (left half lower, right half higher), so they read as two pictures. The scroll slowly slides them
 * together into one picture, then quickly zooms it to fill the screen, and "Contact" rises on it, like a new page.
 * Because both halves are always the same image, they meet without a seam. Motion lives in lib/lux.js.
 */
function Merge() {
    return (
        <section className="lx-merge" data-tone="light" aria-label="Contact">
            <div className="m-half l" aria-hidden="true"><img src="/images/merge-skyline.webp" alt="" /></div>
            <div className="m-half r"><img src="/images/merge-skyline.webp" alt="Glass and brick towers seen from the street, looking up at a clear sky" /></div>
            {/* editorial frame around the two panels (ERA): the heading in the space above the left panel, a short text and
                link under the right one, with fine rules; it all steps aside as the panels start to join */}
            <div className="m-head-wrap">
                <h2 className="disp m-head" aria-label="Designed to inspire">
                    <span className="m-mask" aria-hidden="true"><span className="m-line">Designed</span></span>
                    <span className="m-mask" aria-hidden="true"><span className="m-line">to Inspire</span></span>
                </h2>
                <span className="m-rule h" aria-hidden="true" />
            </div>
            <div className="m-copy">
                <span className="m-rule v" aria-hidden="true" />
                <p className="m-desc">Every PTI home starts with light, air and the street around it: calm proportions, honest materials and spaces planned to be lived in for generations.</p>
                <a className="micro m-cta" href="/about#vision" onClick={go('/about#vision')}><span>Explore our vision</span><i aria-hidden="true" /></a>
            </div>
            <div className="m-shade" aria-hidden="true" />
            <h2 className="disp m-title">Contact</h2>
        </section>
    );
}

/* contact form under the full-page picture (same fields and endpoint as the Contact page), then the footer */
function HomeContact({ site, image = '/images/contact-keys.webp' }) {
    const form = useForm({ first_name: '', last_name: '', email: '', phone: '', message: '', website: '' });
    const [sent, setSent] = useState(false);
    const [toast, setToast] = useState(null);
    useEffect(() => {
        if (!toast) return undefined;
        const t = setTimeout(() => setToast(null), 4500);
        return () => clearTimeout(t);
    }, [toast]);
    const bind = (k) => ({ value: form.data[k], onChange: (e) => form.setData(k, e.target.value), error: form.errors[k] });
    const submit = (e) => {
        e.preventDefault();
        form.post('/inquiries', {
            preserveScroll: true,
            onSuccess: (page) => {
                form.reset();
                setSent(true);
                setToast(page.props.flash?.success || 'Thank you! Your message has been sent. We will be in touch shortly.');
            },
        });
    };
    return (
        <section className="lx-contact" data-tone="light" id="contact">
            <div className="k-pic"><img src={image} alt="A PTI agent handing the keys of a new home to a couple" loading="lazy" /></div>
            <div className="k-main">
            <div className="k-head">
                <div className="micro k-eyebrow">Get in touch</div>
                <h2 className="disp k-title">Let&rsquo;s build <span className="script">your home</span></h2>
            </div>
            {sent ? (
                <div className="k-sent" role="status">
                    <p className="k-sent-title">Message sent.</p>
                    <p className="k-sent-text">Thank you for reaching out. Our team will get back to you shortly.</p>
                    <button className="k-btn" type="button" onClick={() => { setSent(false); form.clearErrors(); }}>Send another message</button>
                </div>
            ) : (
            <form className="form k-form" onSubmit={submit} noValidate>
                <input type="text" name="website" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.data.website} onChange={(e) => form.setData('website', e.target.value)} />
                <Field id="k1" label="First Name" autoComplete="given-name" {...bind('first_name')} />
                <Field id="k2" label="Last Name" autoComplete="family-name" {...bind('last_name')} />
                <Field id="k3" label="Email Address" type="email" autoComplete="email" {...bind('email')} />
                <Field id="k4" label="Phone" type="tel" autoComplete="tel" {...bind('phone')} />
                <Field id="k5" label="Message" full textarea {...bind('message')} />
                <div className="k-send">
                    <button className="k-btn" type="submit" disabled={form.processing}>{form.processing ? 'Sending…' : 'Send message'}</button>
                </div>
            </form>
            )}
            </div>
            {toast && (
                <div className="k-toast" role="status" aria-live="polite">
                    <span className="k-toast-ico" aria-hidden="true">✓</span>
                    <span>{toast}</span>
                    <button type="button" aria-label="Close" onClick={() => setToast(null)}>×</button>
                </div>
            )}
        </section>
    );
}

function Portal() {
    return (
        <section className="lx-portal" data-tone="light">
            <div className="window">
                <img src="/images/hd/dusk-tower.webp" alt="PTI residential tower at dusk" />
                <div className="shade" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(7,26,48,0) 35%, rgba(7,26,48,.75))', opacity: 0 }} />
            </div>
            <div className="ring" />
            <div className="portal-axis" aria-hidden="true"><i /><span>PTI</span><i /></div>
            <div className="portal-index micro" aria-hidden="true"><span>Architecture</span><b>02</b><span>Dhaka</span></div>
            <div className="disp word l">Step</div>
            <div className="disp word r">Inside</div>
            <Flora src={`${B}krishnachura-spray.webp`} className="f-left" style={{ left: '8vw', bottom: '-6vh', width: '34vw', zIndex: 4 }} anchor="0% 100%" origin="0% 100%" depth={0.8} sway={1.6} />
            <Flora src={`${B}krishnachura-rise.webp`} className="f-right" style={{ right: '6vw', bottom: '-18vh', width: '26vw', zIndex: 4 }} anchor="100% 100%" origin="100% 100%" depth={1} sway={1.8} />
            <canvas className="lx-petals" data-count="14" />
            <div className="sub micro">A residential tower by PTI Development · Dhaka</div>
            <div className="threshold" aria-hidden="true"><i /><span className="micro">Cross the threshold</span><i /></div>
            <div className="reveal">
                <div className="micro">Our legacy</div>
                <p className="disp">Every project is a milestone in our legacy of excellence.</p>
            </div>
        </section>
    );
}

function Collection({ projects }) {
    const [i, setI] = useState(0);
    const frame = useRef(null);
    const name = useRef(null);
    const n = projects.length;
    const p = projects[i];

    const show = (k) => {
        const next = (k + n) % n;
        if (next === i) return;
        const dir = k > i ? 1 : -1;
        gsap.to(name.current.querySelectorAll('.char'), { yPercent: -110 * dir, opacity: 0, stagger: 0.012, duration: 0.45, ease: 'power3.in', onComplete: () => setI(next) });
    };
    useEffect(() => {
        if (!frame.current) return;
        const img = frame.current.querySelector('img.cur');
        gsap.fromTo(img, { clipPath: 'inset(100% 0 0 0)', scale: 1.25 }, { clipPath: 'inset(0% 0 0 0)', scale: 1, duration: 1.4, ease: 'luxInOut' });
        gsap.fromTo(name.current.querySelectorAll('.char'), { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.025, duration: 1.1, ease: 'lux' });
    }, [i]);
    useEffect(() => {
        const t = setInterval(() => { if (!document.hidden) show(i + 1); }, 6500);
        return () => clearInterval(t);
    });
    if (!p) return null;
    return (
        <section className="lx-collection" data-tone="light">
            <p className="lead">From modern property development to land share investment and full legal support, PTI delivers end-to-end solutions for Dhaka's real estate market.</p>
            <div className="tag micro">Building homes and commercial<br />spaces you can trust</div>
            <div className="lx-slider">
                <div className="frame" ref={frame}>
                    {projects.map((q, k) => k === i && <img key={q.id} className="cur" src={q.image_url} alt={q.name} />)}
                </div>
                <h2 className="disp name" ref={name} key={`n${i}`}>{chars(p.name)}</h2>
                <div className="meta micro"><span>{p.units} units</span><span>{p.location}</span><span>{p.status}</span></div>
                <div className="lx-pager micro">
                    <button onClick={() => show(i - 1)} aria-label="Previous project">‹</button>
                    <span>{pad(i + 1)}</span>
                    <span className="p"><i style={{ transform: `scaleX(${(i + 1) / n})` }} /></span>
                    <span>{pad(n)}</span>
                    <button onClick={() => show(i + 1)} aria-label="Next project">›</button>
                </div>
                <Circle className="view" href={`/projects/${p.slug}`}>View this<br />project</Circle>
            </div>
        </section>
    );
}

function Quote({ flower = true, sideImage }) {
    return (
        <>
            <section className={`lx-quote${sideImage ? ' lx-quote--side' : ''}`} data-tone={sideImage ? 'light' : 'dark'}>
                {sideImage
                    ? <div className="q-img"><img src={sideImage} alt="Building under construction with tower cranes" loading="lazy" /></div>
                    : <div className="bg"><img src="/images/hd/construction.webp" alt="" /></div>}
                <blockquote>
                    <p className="disp">Every square foot we build is a commitment, to trust, to safety, and to the dreams of our clients.</p>
                    <div className="micro">Md. Ruhul Amin<br />Chairman, PTI Development</div>
                </blockquote>
            </section>
            {flower && (
                <div className="lx-hang">
                    <Flora src={`${B}krishnachura-corner.webp`} style={{ top: '-16vh', left: '-6vw', width: '56vw' }} anchor="0% 0%" origin="0% 0%" depth={0.5} sway={1.4} />
                </div>
            )}
        </>
    );
}

function Vision() {
    return (
        <section className="lx-vision" data-tone="light">
            <div className="label micro">The vision</div>
            <div className="rows disp">
                <div className="row">PTI is shaping Dhaka's skyline with projects</div>
                <div className="row">that combine affordability, transparency</div>
                <div className="row">and world-class design, square foot by square foot</div>
            </div>
            <div className="big disp" aria-hidden="true"><span>New</span><span>Dhaka</span></div>
            <div className="country spaced">Bangladesh</div>
            <div className="note">
                <p className="body">PTI Development's journey began with a clear vision: to elevate living and working spaces in Dhaka through uncompromising quality and integrity.</p>
                <Mark />
            </div>
            <Flora src={`${B}krishnachura-rise.webp`} style={{ right: '-4vw', bottom: '-30vh', width: '38vw' }} anchor="100% 100%" origin="100% 100%" depth={0.7} sway={1.6} />
        </section>
    );
}

/** "The city you'll call home": heading, text and route (shown on the cloud photo; same classes, fonts and motion). */
function PlaceContent({ projects, site }) {
    const stops = useMemo(() => {
        const seen = new Map();
        projects.forEach((p) => {
            const m = /(\d+\s*min)\s*to\s*(.+)/i.exec(p.location);
            const label = m ? m[2] : p.location;
            const k = label.toLowerCase();
            if (!seen.has(k)) seen.set(k, { label, time: m ? m[1] : 'Project site', count: 0 });
            seen.get(k).count += 1;
        });
        const list = [...seen.values()].map((s) => ({ ...s, sub: `${s.time} · ${s.count} ${s.count > 1 ? 'projects' : 'project'}` }));
        list.push({ label: 'Pallabi office', sub: 'Mirpur, Dhaka-1216', office: true });
        return list;
    }, [projects]);
    const pts = stops.map((s, i) => {
        const x = 6 + (88 * i) / Math.max(1, stops.length - 1);
        const y = 62 + Math.sin(i * 1.3) * 22;
        return { ...s, x, y };
    });
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x * 10} ${p.y * 2.6}`).join(' ');
    return (
        <div className="lx-place cl-place">
            <div className="head">
                <div className="disp l1">The city</div>
                <div className="script s1">you'll</div>
                <div className="disp l2">Call home</div>
            </div>
            <div className="lower">
                <div>
                    <h3>Minutes from what matters</h3>
                    <p className="body">Our projects are in strategic Dhaka locations, minutes from ECB Chattar and the Kalshi Flyover, as well as Kawla and Manikdi Bazar. Visit us at {site.address}.</p>
                </div>
                <div className="lx-route">
                    <svg viewBox="0 0 1000 260" preserveAspectRatio="none" aria-hidden="true">
                        <path d={d} />
                        <path className="draw" d={d} style={{ stroke: 'rgba(11,38,68,.75)', strokeDasharray: 'none' }} />
                    </svg>
                    {pts.map((s) => (
                        <div className={`lx-stop ${s.office ? 'office' : ''}`} key={s.label} style={{ left: `${s.x}%`, top: `${s.y}%` }}>
                            <b>{s.label}</b><small>{s.sub}</small><i />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* the original section keeps the photo strip and the "Book a site visit" circle */
function Place() {
    return (
        <section className="lx-place" data-tone="light">
            <div className="peek"><img src="/images/hd/skyline.webp" alt="" /></div>
            <Circle className="cta" href="/contact">Book a<br />site visit</Circle>
        </section>
    );
}

function Sky() {
    return (
        <section className="lx-sky" data-tone="dark">
            <div className="city"><img src="/images/hd/skyline.webp" alt="City skyline" /></div>
            <div className="sky-glow" aria-hidden="true" />
            <div className="cloud c0" style={{ left: '-8vw', top: '-34vh', width: '116vw', opacity: 0.82 }}><img src={`${B}cloud-2.webp`} alt="" /></div>
            <div className="cloud c4" style={{ left: '20vw', top: '-12vh', width: '70vw', opacity: 0.9 }}><img src={`${B}cloud-3.webp`} alt="" /></div>
            <div className="cloud c1" style={{ left: '-22vw', top: '8vh' }}><img src={`${B}cloud-1.webp`} alt="" /></div>
            <div className="cloud c2" style={{ right: '-26vw', top: '14vh' }}><img src={`${B}cloud-2.webp`} alt="" /></div>
            <div className="cloud c3" style={{ left: '5vw', top: '34vh', width: '95vw' }}><img src={`${B}cloud-3.webp`} alt="" /></div>
            <div className="copy">
                <div className="micro">Homes with a wider horizon</div>
                <div className="disp">Above the city</div>
                <div className="script">a new skyline</div>
            </div>
        </section>
    );
}

function Services({ services }) {
    if (!services.length) return null;
    return (
        <section className="lx-services" data-tone="light">
            {services.map((s, i) => (
                <div className="slide" key={s.id}>
                    <div className="pic">{s.image_url && <img src={s.image_url} alt={s.title} />}</div>
                    <div className="titles"><h2 className="disp">{chars(s.title)}</h2></div>
                    <div className="detail">
                        <p className="body">{s.description}</p>
                        <ul>{(s.points || []).map((pt) => <li key={pt}>{pt}</li>)}</ul>
                    </div>
                </div>
            ))}
            <div className="pager">
                <div className="lx-pager micro">
                    <button className="prev" aria-label="Previous service">‹</button>
                    <span className="idx">1</span>
                    <span className="p"><i style={{ transform: `scaleX(${1 / services.length})` }} /></span>
                    <span>{services.length}</span>
                    <button className="next" aria-label="Next service">›</button>
                </div>
            </div>
        </section>
    );
}

function Values({ values, image = '/images/hd/rooftop.webp' }) {
    return (
        <section className="lx-values" data-tone="dark">
            <div className="bg"><img src={image} alt="" /></div>
            <ul className="list">{values.map((v) => <li key={v.id}>{v.title}</li>)}</ul>
            <div className="text">
                <div className="micro">What we stand for</div>
                <div style={{ position: 'relative' }}>{values.map((v) => <p className="disp" key={v.id}>{v.text}</p>)}</div>
            </div>
            <div className="rise" />
        </section>
    );
}

function Numbers({ stats }) {
    return (
        <section className="lx-split" data-tone="light">
            <div className="panel" data-tone="dark">
                <div className="photo"><img src="/images/hd/land.webp" alt="Land share project site" /></div>
                <Flora src={`${B}krishnachura-bloom.webp`} style={{ right: '-12vw', top: '8vh', width: '30vw', zIndex: 5 }} anchor="50% 50%" origin="50% 60%" depth={1.2} sway={2.2} />
            </div>
            <div className="copy">
                <p className="disp">We take pride in delivering precise, durable and high-standard homes, with pricing and paperwork that is clear and documented.</p>
                <div className="lx-stats">
                    {stats.map((s) => (
                        <div className="lx-stat" key={s.id}>
                            <div className="v"><b data-v={s.value}>0</b>{s.suffix ? <sup>{s.suffix}</sup> : null}</div>
                            <div className="micro">{s.label}</div>
                        </div>
                    ))}
                </div>
                <Circle className="cta" href="/about">Our<br />story</Circle>
            </div>
        </section>
    );
}

function Gallery({ projects }) {
    return (
        <section className="lx-gallery" data-tone="light">
            <div className="head">
                <h2 className="disp">Towers rising<br />across Dhaka</h2>
                <Circle href="/projects">All<br />projects</Circle>
            </div>
            <div className="track">
                {projects.map((p) => (
                    <a className="card" key={p.id} href={`/projects/${p.slug}`} onClick={go(`/projects/${p.slug}`)}>
                        <div className="img"><img src={p.image_url} alt={p.name} loading="lazy" /></div>
                        <h3>{p.name}</h3>
                        <div className="micro">{p.units} units · {p.location}</div>
                    </a>
                ))}
            </div>
            <Flora src={`${B}krishnachura-spray.webp`} style={{ left: '-8vw', bottom: '-8vh', width: '36vw', transform: 'scaleX(-1)' }} anchor="0% 100%" origin="0% 100%" depth={0.8} sway={1.5} />
            <Flora src={`${B}krishnachura-rise.webp`} style={{ right: '-6vw', bottom: '-30vh', width: '28vw' }} anchor="100% 100%" origin="100% 100%" depth={1} sway={1.8} />
        </section>
    );
}

/* one answer open at a time, all closed at first */
const closeOthers = (e) => {
    if (!e.currentTarget.open) return;
    e.currentTarget.parentElement.querySelectorAll('details[open]').forEach((d) => { if (d !== e.currentTarget) d.open = false; });
};

function Faq({ faqs, openFirst = false }) {
    if (!faqs.length) return null;
    return (
        <section className="lx-faq" data-tone="light">
            <h2 className="disp">Questions,<br />answered</h2>
            <div>
                {faqs.map((f, i) => (
                    <details key={f.id} name="faq" open={openFirst && i === 0} onToggle={closeOthers}>
                        <summary>{f.question}</summary>
                        <p className="body">{f.answer}</p>
                    </details>
                ))}
            </div>
        </section>
    );
}

/* The landing page's preloader is always its own door: the hero's pointed arch rising out of the navy cover
   (lib/lux.js), on every visit. The logo preloader of the inner pages never covers it, so on a fresh load here we
   only mark the load as done (the next inner page then opens without its preloader). */
export default function Home({ projects, stats, faqs, services = [], values = [], testimonials = [] }) {
    const { site } = usePage().props;
    const root = useRef(null);

    useEffect(() => {
        claimPreloader();
        document.documentElement.classList.remove('has-motion', 'menu-open');
        document.documentElement.classList.add('no-tower'); // no Rising Tower here: the footer uses the full width
        const destroy = initLux(root.current, { skipIntro: true });
        return () => { destroy?.(); document.documentElement.classList.remove('no-tower'); };
    }, []);

    return (
        <div className="lx" ref={root}>
            <Head title="Shaping Dreams into Homes" />
            <Chrome />
            <Hero />
            <Arch values={values} site={site} />
            <Says testimonials={testimonials} />
            <InNumbers stats={stats} />
            <Showcase projects={projects} />
            <CloudPass projects={projects} site={site} />
            <VideoDoor />
            <Merge />
            <HomeContact site={site} image="/images/lets-talk-keys.webp" />
            {/* the sections that followed (Step Inside -> FAQ) now live on the About page (see About.jsx) */}
            <SiteFooter site={site} Link={HomeLink} data-tone="dark" />
        </div>
    );
}

/* sections shown on the About page, below its own content */
export { Portal, Collection, Quote, Vision, Place, Sky, Services, Values, Numbers, Gallery, Faq, HomeContact };
