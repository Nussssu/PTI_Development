import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import '../../css/lux.css';
import { gsap } from 'gsap';
import { initLux } from '../lib/lux';

const MARK = 'M0.00454068 18.3256H0V73.5928H18.4044V92H36.827V91.9728H73.5949V55.1674V18.3619H73.6085V0H0.00908136V18.3256H0.00454068ZM18.4271 18.3619H55.195V55.1674H36.7997V73.5701H18.4271V18.3619Z';
const Mark = ({ className }) => <svg className={className} viewBox="0 0 74 92" aria-hidden="true"><path d={MARK} /></svg>;
const B = '/images/botanical/';
const pad = (n) => String(n).padStart(2, '0');

/* internal navigation (landing page has its own chrome, so a plain visit) */
const go = (href) => (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    router.visit(href);
};

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
            <nav className="lx-nav" aria-label="Main">
                <a className="primary" href="/projects" onClick={go('/projects')}><span>Our</span><span>Projects</span></a>
                <div className="links">
                    <a href="/contact" onClick={go('/contact')}>Book a visit</a>
                    <a href="/about" onClick={go('/about')}>About</a>
                    <a href="/services" onClick={go('/services')}>Services</a>
                    <a href="/contact" onClick={go('/contact')}>Contact</a>
                </div>
            </nav>
            <div className="lx-meter" aria-hidden="true">
                <div className="bar"><i /></div>
                <div className="num">00</div>
                <div className="bar"><i style={{ transform: 'scaleY(1)', opacity: 0.25 }} /></div>
                <div className="lbl">Scroll</div>
                <div className="arrow" />
            </div>
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
function Hero() {
    return (
        <>
            <section className="lx-hero" data-tone="dark">
                <div className="hero-stage">
                    <div className="hero-tower">
                        <img src="/images/hero-scene.webp" srcSet="/images/hero-scene.webp 1672w, /images/hero-scene@2x.webp 3344w" sizes="max(100vw, 178svh)" alt="PTI residential tower at dusk, rising above palms and a lit swimming pool" fetchpriority="high" draggable="false" />
                        <div className="tower-grade" />
                    </div>
                </div>
                <div className="hero-title">
                    <div className="t-eyebrow"><i /><span className="w"><span className="word">Premium living in Dhaka</span></span><i /></div>
                    <h1 className="t-main" aria-label="Homes for a Better Life">
                        {[['Homes', 'for'], ['a', 'Better', 'Life']].map((line, li) => (
                            <span className="ln" key={li} aria-hidden="true">
                                {line.map((w) => <span className="w" key={w}>{chars(w)}</span>)}
                            </span>
                        ))}
                    </h1>
                    <p className="t-sub" aria-label="Thoughtfully designed residences that bring comfort, nature, and modern living together.">
                        {'Thoughtfully designed residences that bring comfort, nature, and modern living together.'.split(' ').map((w, i) => (
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
                        <p className="b-desc" key={v.id} aria-hidden={i !== 0}>{v.text}</p>
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
function Says({ testimonials }) {
    if (!testimonials.length) return null;
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
 * "The concept" (ERA layout): cream page, a big centred statement, a short paragraph and the mark, with real-time
 * 3D purple vines (lib/vine3d.js) in the top-left and bottom-right corners, swaying in the wind.
 * Motion lives in lib/lux.js.
 */
function Concept() {
    return (
        <section className="lx-concept" data-tone="light">
            <div className="c-flower tl" aria-hidden="true"><canvas className="c-vine" data-seed="7" /></div>
            <div className="c-inner">
                <div className="micro c-eyebrow" data-c="ctn">PTI Development · Dhaka</div>
                <h2 className="disp c-title c-big" data-c="h">Our Projects</h2>
                <p className="c-text" data-c="p">Inspired by the city&rsquo;s rising skyline, every project pairs contemporary architecture with natural light, green spaces and carefully planned homes.</p>
                <div className="c-mark" data-c="ctn"><Mark /></div>
            </div>
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
            <div className="h-cap spaced" aria-hidden="true">{cap}</div>
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
 * Horizontal track (ERA "location" structure): The concept (narrower than the screen, flower top-left) ->
 * "Our projects" intro (a flower straddling the two pages at the bottom) -> one panel per project
 * (the last one has a flower in the top-right corner). Vertical scroll moves the whole strip sideways on
 * desktop; on phones the panels stack. Motion lives in lib/lux.js.
 */
function Showcase({ projects: all }) {
    const projects = all.slice(0, 3);          // three projects, in order
    const last = projects.length - 1;
    return (
        <div className="lx-hscroll" data-tone="light">
            <div className="h-track">
                <Concept />
                {projects.map((p, i) => (
                    <TrackPanel key={p.id} cap="Dhaka" lines={titleLines(p.name)} img={hdImage(p)} alt={p.name}
                        head={p.location}
                        text={p.description || `${p.units} thoughtfully planned residences by PTI Development, with clear pricing, documented paperwork and lasting quality.`}
                        meta={<><span>{pad(i + 1)} / {pad(projects.length)}</span><span>{p.units} units</span><span>{p.status}</span></>}
                        href="/projects" last={i === last} cta={i === last ? <>View all<br />projects</> : null}>
                        {i === 0 && <div className="c-flower bridge" aria-hidden="true"><canvas className="c-vine" data-seed="23" data-flip="1" data-shape="center" /></div>}
                        {i === last && <div className="c-flower tr" aria-hidden="true"><canvas className="c-vine" data-seed="31" /></div>}
                    </TrackPanel>
                ))}
            </div>
        </div>
    );
}

/**
 * Cloud passage (ERA "loc-w" clouds): after the horizontal track, banks of cloud drift endlessly across the
 * cream page and spill into the sky of a full-bleed photo below. Motion lives in lib/lux.js and lux.css.
 */
function CloudPass() {
    return (
        <section className="lx-clouds" data-tone="light" aria-label="PTI towers under a cloudy sky">
            <div className="cl-scene"><img src="/images/clouds-scene.webp" alt="Glass towers and gardens under a bright cloudy sky" loading="lazy" /></div>
            <div className="cl-fade" aria-hidden="true" />
            {[['back', 'back'], ['mid', 'mid'], ['front', 'front'], ['extra', 'back'], ['low', 'mid']].map(([n, src]) => (
                <div className={`cl-layer ${n}`} key={n} aria-hidden="true">
                    <div className="cl-track">{[0, 1, 2].map((k) => <img key={k} src={`/images/clouds-${src}.webp`} alt="" draggable="false" />)}</div>
                </div>
            ))}
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

function Quote() {
    return (
        <>
            <section className="lx-quote" data-tone="dark">
                <div className="bg"><img src="/images/hd/construction.webp" alt="" /></div>
                <blockquote>
                    <p className="disp">Every square foot we build is a commitment, to trust, to safety, and to the dreams of our clients.</p>
                    <div className="micro">Md. Ruhul Amin<br />Chairman, PTI Development</div>
                </blockquote>
            </section>
            <div className="lx-hang">
                <Flora src={`${B}krishnachura-corner.webp`} style={{ top: '-16vh', left: '-6vw', width: '56vw' }} anchor="0% 0%" origin="0% 0%" depth={0.5} sway={1.4} />
            </div>
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

function Place({ projects, site }) {
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
        <section className="lx-place" data-tone="light">
            <div className="peek"><img src="/images/hd/skyline.webp" alt="" /></div>
            <div className="head">
                <div className="disp l1">The city</div>
                <div className="script s1">you'll</div>
                <div className="disp l2">Call home</div>
            </div>
            <Circle className="cta" href="/contact">Book a<br />site visit</Circle>
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

function Values({ values }) {
    return (
        <section className="lx-values" data-tone="dark">
            <div className="bg"><img src="/images/hd/rooftop.webp" alt="" /></div>
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

function Faq({ faqs }) {
    if (!faqs.length) return null;
    return (
        <section className="lx-faq" data-tone="light">
            <h2 className="disp">Questions,<br />answered</h2>
            <div>
                {faqs.map((f, i) => (
                    <details key={f.id} open={i === 0}>
                        <summary>{f.question}</summary>
                        <p className="body">{f.answer}</p>
                    </details>
                ))}
            </div>
        </section>
    );
}

function Footer({ site }) {
    const tel = `tel:${(site.phone || '').replace(/\s/g, '')}`;
    return (
        <footer className="lx-foot" data-tone="dark">
            <div className="dome" />
            <div className="ghost script" aria-hidden="true">Shopno</div>
            <div className="big">
                <div className="disp">Book a visit</div>
                <div className="script">we'll show you around</div>
            </div>
            <div className="cols">
                <div><div className="micro">Call</div><a href={tel}>{site.phone}</a>{site.whatsapp && <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener">WhatsApp us</a>}</div>
                <div><div className="micro">Write</div><a href={`mailto:${site.email}`}>{site.email}</a></div>
                <div><div className="micro">Visit</div><p>{site.address_long}</p></div>
                <div><div className="micro">Explore</div>
                    {[['/projects', 'Projects'], ['/about', 'About'], ['/services', 'Services'], ['/contact', 'Contact']].map(([h, t]) => <a key={h} href={h} onClick={go(h)}>{t}</a>)}
                </div>
            </div>
            <div className="legal micro"><span>© {new Date().getFullYear()} {site.company}</span><span>{site.tagline}</span></div>
        </footer>
    );
}

export default function Home({ projects, stats, faqs, services = [], values = [], testimonials = [] }) {
    const { site } = usePage().props;
    const root = useRef(null);

    useEffect(() => {
        document.documentElement.classList.remove('has-motion', 'menu-open');
        const destroy = initLux(root.current, { skipIntro: true });
        return destroy;
    }, []);

    return (
        <div className="lx" ref={root}>
            <Head title="Shaping Dreams into Homes" />
            <Chrome />
            <Hero />
            <Arch values={values} site={site} />
            <Says testimonials={testimonials} />
            <Showcase projects={projects} />
            <CloudPass />
            <Portal />
            <Collection projects={projects} />
            <Quote />
            <Vision />
            <Place projects={projects} site={site} />
            <Sky />
            <Services services={services} />
            <Values values={values} />
            <Numbers stats={stats} />
            <Gallery projects={projects} />
            <Faq faqs={faqs} />
            <Footer site={site} />
        </div>
    );
}
