/* Small building blocks shared by every public page */
import { router } from '@inertiajs/react';
import { Children, Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { coverCurtain, ScrollTrigger } from '../lib/motion';
import { Arrow, Pin, Units } from './Icons';

export const pad = (n) => String(n).padStart(2, '0');

/** Internal link that plays the "floors" curtain before visiting. */
export function TLink({ href, children, onClick, ...rest }) {
    const go = (e) => {
        onClick && onClick(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || rest.target) return;
        e.preventDefault();
        if (href === window.location.pathname) return;
        sessionStorage.setItem('pti-nav', '1');
        document.documentElement.classList.remove('menu-open');
        coverCurtain(() => router.visit(href));
    };
    return <a href={href} onClick={go} {...rest}>{children}</a>;
}

export function Btn({ href, children, className = '', icon = true, external, ...rest }) {
    const inner = (
        <>
            <span>{children}</span>
            {icon && <span className="btn-ico"><Arrow /></span>}
        </>
    );
    const cls = `btn ${className} ${icon ? '' : 'no-ico'}`;
    if (external || href.startsWith('tel:') || href.startsWith('mailto:')) {
        return <a className={cls} href={href} data-magnetic {...rest}>{inner}</a>;
    }
    return <TLink className={cls} href={href} data-magnetic {...rest}>{inner}</TLink>;
}

/** Heading whose lines slide up. Each child is one line. */
export function Split({ as: Tag = 'h2', className = 'h2', children, ...rest }) {
    return (
        <Tag className={className} data-split {...rest}>
            {Children.toArray(children).map((line, i) => (
                <span className="line-mask" key={i}><span>{line}</span></span>
            ))}
        </Tag>
    );
}

/** Hero heading (animated by the page intro, not on scroll). */
export function HeroTitle({ as: Tag = 'h1', className, children }) {
    return (
        <Tag className={className}>
            {Children.toArray(children).map((line, i) => (
                <span className="line-mask" key={i}><span>{line}</span></span>
            ))}
        </Tag>
    );
}

/** Splits text into word spans for the scroll-lit statement. Strings or {serif: "..."} parts. */
export function Words({ parts }) {
    const words = (text, cls, k) =>
        text.split(/(\s+)/).map((t, i) => (/^\s+$/.test(t) || !t ? <Fragment key={`${k}-${i}`}>{t}</Fragment> : <span className={`w ${cls}`} key={`${k}-${i}`}>{t}</span>));
    return <>{parts.map((p, k) => (typeof p === 'string' ? words(p, '', k) : words(p.serif, 'serif', k)))}</>;
}

export function ProjectCard({ project, index, total }) {
    return (
        <TLink className="p-card" href={`/projects/${project.slug}`} data-cursor="View" data-area={project.area}>
            <div className="p-card-media">
                {project.image_url && <img src={project.image_url} alt={project.name} loading="lazy" />}
                <span className="p-index">{pad(index + 1)} / {pad(total)}</span>
                <span className="status">{project.status}</span>
            </div>
            <div className="p-card-body">
                <h3>{project.name}</h3>
                <div className="p-facts">
                    <span><Units />{project.units} Units</span>
                    <span><Pin />{project.location}</span>
                </div>
            </div>
        </TLink>
    );
}

export function Odometer({ value, suffix }) {
    return (
        <div className="odo" aria-label={`${value}${suffix || ''}`}>
            {String(value).split('').map((d, i) => (
                <span className="odo-col" data-d={d} key={i}>
                    <span>{Array.from({ length: 20 }, (_, k) => <span key={k}>{k % 10}</span>)}</span>
                </span>
            ))}
            {suffix ? <sup>{suffix}</sup> : null}
        </div>
    );
}

export function StatCard({ stat, index }) {
    return (
        <div className="num-card" data-reveal>
            {stat.image_url && <img src={stat.image_url} alt="" loading="lazy" />}
            <div className="elev-head"><span>Floor {pad(index + 1)}</span><span className="elev-arrows"><i></i><i></i></span></div>
            <div>
                <Odometer value={stat.value} suffix={stat.suffix} />
                <div className="num-label">{stat.label}</div>
            </div>
        </div>
    );
}

export function FaqList({ faqs }) {
    const [open, setOpen] = useState(0);
    return faqs.map((f, i) => <FaqItem key={f.id} faq={f} n={i} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />);
}

function FaqItem({ faq, n, open, onToggle }) {
    const ref = useRef(null);
    const [h, setH] = useState(open ? 'auto' : 0);
    const first = useRef(true);
    useLayoutEffect(() => {
        if (first.current) { first.current = false; return; }
        const el = ref.current;
        const full = el.scrollHeight;
        if (open) {
            setH(full);
            const t = setTimeout(() => { setH('auto'); ScrollTrigger.refresh(); }, 620);
            return () => clearTimeout(t);
        }
        setH(full);
        requestAnimationFrame(() => requestAnimationFrame(() => setH(0)));
        const t = setTimeout(() => ScrollTrigger.refresh(), 620);
        return () => clearTimeout(t);
    }, [open]);
    return (
        <div className={`faq-item ${open ? 'is-open' : ''}`} data-reveal>
            <button className="faq-q" aria-expanded={open} onClick={onToggle}>
                <span><span className="n">{pad(n + 1)}</span>{faq.question}</span>
                <span className="faq-ico"></span>
            </button>
            <div className="faq-a" ref={ref} style={{ height: h }}><p>{faq.answer}</p></div>
        </div>
    );
}

export function Cta() {
    return (
        <section className="cta" data-theme="dark" data-floor="Book a meeting">
            <div className="cta-bg" data-parallax="12"><img src="/images/skyline-up.webp" alt="" loading="lazy" /></div>
            <div className="wrap cta-inner">
                <div>
                    <span className="eyebrow" data-reveal>Let's talk</span>
                    <Split style={{ marginTop: 22 }} className="">{['Ready to', <>Build Your <span className="serif">Dream?</span></>]}</Split>
                    <p className="lead" data-reveal>We will show you finished and under construction projects, introduce you to the features of the areas and tell you about the real estate market in Dhaka.</p>
                </div>
                <TLink className="cta-badge" href="/contact" data-magnetic data-reveal aria-label="Book the meeting">
                    <svg className="ring" viewBox="0 0 100 100"><defs><path id="cta-c" d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0" /></defs><text><textPath href="#cta-c">Book the meeting · Book the meeting ·</textPath></text></svg>
                    <Arrow size={34} />
                </TLink>
            </div>
        </section>
    );
}

export function PageHero({ crumb, image, imageStyle, children, title, style, className = '' }) {
    return (
        <section className={`page-hero ${className}`} data-theme="dark" data-floor={crumb} style={style}>
            <div className="bg"><img src={image} alt="" style={imageStyle} /></div>
            <div className="wrap">
                <div className="crumbs" data-hero-in><TLink href="/">Home</TLink><span>/</span><span>{crumb}</span></div>
                <HeroTitle>{title}</HeroTitle>
                {children}
            </div>
        </section>
    );
}

/** Field with floating label used by the public forms. */
export function Field({ id, label, error, full, textarea, required = true, ...rest }) {
    const Tag = textarea ? 'textarea' : 'input';
    return (
        <div className={`field ${full ? 'full' : ''} ${error ? 'has-error' : ''}`}>
            <Tag id={id} placeholder=" " required={required} {...rest} />
            <label htmlFor={id}>{label} {required && <em>*</em>}</label>
            {error && <small className="field-error">{error}</small>}
        </div>
    );
}

export function useMounted() {
    const [m, setM] = useState(false);
    useEffect(() => setM(true), []);
    return m;
}
