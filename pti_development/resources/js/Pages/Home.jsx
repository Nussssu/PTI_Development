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

function Hero() {
    return (
        <section className="lx-hero" data-tone="dark">
            <div className="media">
                <div className="hero-window">
                    <div className="scene-frame">
                        <img src="/images/hero-portal-v2.png" alt="PTI residential tower framed by an illuminated architectural entrance" />
                        <div className="scene-grade" />
                    </div>
                    <div className="hero-copy">
                        <div className="micro">PTI Development · Dhaka</div>
                        <h1 className="disp">Shaping dreams<br />into homes</h1>
                        <p>Invest in value. Live in trust.</p>
                    </div>
                    <div className="cta"><Circle href="/projects">View our<br />projects</Circle></div>
                </div>
            </div>
            <div className="hero-cover" aria-hidden="true">
                <div className="cover-frame" />
                <div className="cover-ghost script">Shopno</div>
                <div className="portal-outline"><i /><i /></div>
            </div>
            <div className="hero-scroll micro" aria-hidden="true"><span>Scroll to enter</span><i /></div>
        </section>
    );
}

function Arch({ values, site }) {
    const promises = values.slice(0, 3);
    return (
        <section className="lx-arch" data-tone="light">
            <div className="dome" />
            <svg className="curve" viewBox="0 0 1000 1000" aria-hidden="true">
                <defs><path id="lx-arc" d="M95.9 352.9 A430 430 0 0 1 904.1 352.9" /></defs>
                <text textAnchor="middle" style={{ fontSize: 30 }}><textPath href="#lx-arc" startOffset="50%">Three promises to every PTI family</textPath></text>
            </svg>
            <div className="inner">
                <div className="crest micro"><span>Mirpur</span><Mark /><span>Dhaka</span></div>
                <div className="vline" />
                <p className="micro lede">{site.tagline}</p>
                <div className="lx-promises">
                    {promises.map((v, i) => (
                        <div className="lx-promise" key={v.id}>
                            <div className="n">{pad(i + 1)}</div>
                            <h3>{v.title}</h3>
                            <p className="body">{v.text}</p>
                        </div>
                    ))}
                </div>
            </div>
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

export default function Home({ projects, stats, faqs, services = [], values = [] }) {
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
