import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Facebook, LinkedIn, Office, Phone, Pin, Spark, Units, WhatsApp } from '../../Components/Icons';
import { Btn, ProjectCard, Split, TLink } from '../../Components/Site';
import SiteLayout from '../../Layouts/SiteLayout';
import { gsap, prefersReducedMotion, ScrollTrigger } from '../../lib/motion';
import { fill, isOn, rich, useSection } from '../../lib/cms';
import { withHdImage } from '../../lib/projectImages';

const XIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z" /></svg>
);
const LinkIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" /></svg>
);

/* the gallery's tiles, in order (what each placeholder suggests goes there) */
const GALLERY_SLOTS = ['Main view', 'Exterior', 'Entrance & lobby', 'Living room', 'Bedroom', 'Amenities', 'Neighbourhood'];
const ImageIcon = () => (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="M21 16l-5.2-5.2a1 1 0 00-1.4 0L5 20" /></svg>
);

/* Project detail (inspired by a developer's project page, in PTI colours): name + address; the photo beside a
   "Project Facts" card (status, fact tiles, enquiry + phone, share); "About This Project" with the map and a sticky
   aside ("On this page", "Talk to Our Team"); the project gallery; then Related Projects.
   Every value comes from this project's own record. */
export default function ProjectShow({ project: raw, related }) {
    const { site } = usePage().props;
    const project = withHdImage(raw);
    const features = (project.features || []).filter((f) => f.label);
    const gallery = [...new Set([project.image_url, raw.image_url, ...(project.gallery_urls || [])].filter(Boolean))];
    // location, plus the area when the location doesn't already name it
    const address = project.area && project.location && project.location.toLowerCase().includes(project.area.toLowerCase())
        ? project.location
        : [project.location, project.area].filter(Boolean).join(', ');
    // texts around the project from Admin → Pages → Project detail ({name} {units} {area} = this project's)
    const facts_ = useSection('facts');
    const about = useSection('about');
    const team = useSection('team');
    const gal = useSection('gallery');
    const rel = useSection('related');
    const tok = { name: project.name, units: project.units, area: project.area };
    const t = (text, fallback) => fill(text ?? fallback, tok);
    const slots = [...(gal.slots?.length ? gal.slots : GALLERY_SLOTS), ...GALLERY_SLOTS].slice(0, GALLERY_SLOTS.length);
    const overview = project.description
        || t(about.fallback, '{units} thoughtfully planned residences by PTI Development, with clear pricing, documented paperwork and lasting quality.');
    const tel = `tel:${(site.phone || '').replace(/\s/g, '')}`;

    /* gallery: as it scrolls into view each tile opens upward (clip) one after another, photos settling from a slight
       zoom and placeholders' icon + text rising in */
    const bento = useRef(null);
    useEffect(() => {
        const el = bento.current;
        if (!el || prefersReducedMotion()) return undefined;
        const tiles = [...el.children];
        const ctx = gsap.context(() => {
            gsap.set(tiles, { clipPath: 'inset(100% 0 0 0)' });
            const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 82%', once: true } });
            tl.to(tiles, { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'expo.inOut', stagger: 0.09, clearProps: 'clipPath' }, 0);
            tiles.forEach((t, i) => {
                const img = t.querySelector('img');
                // the photo's CSS hover zoom is paused while GSAP drives it, then handed back
                if (img) tl.fromTo(img, { scale: 1.25, transition: 'none' }, { scale: 1, duration: 1.8, ease: 'expo.out', clearProps: 'transform,transition' }, i * 0.09 + 0.2);
                else tl.fromTo(t.children, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.06 }, i * 0.09 + 0.45);
            });
        }, el);
        ScrollTrigger.refresh();
        return () => ctx.revert();
    }, [gallery.length]);

    /* phones: the "Related Projects" slider can also be dragged sideways with the mouse (click and drag), settling on
       the nearest card; a drag never opens a link. Only while the track is a scroll slider (not the desktop pinned strip). */
    const relTrack = useRef(null);
    useEffect(() => {
        const el = relTrack.current;
        if (!el) return undefined;
        const mq = window.matchMedia('(max-width: 620px)');
        let down = false, moved = false, startX = 0, startLeft = 0;
        const onDown = (e) => {
            if (!mq.matches || e.pointerType !== 'mouse' || e.button !== 0 || el.scrollWidth <= el.clientWidth + 1) return;
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
            const cards = [...el.children];
            const pad = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
            const target = cards.reduce((best, c) => (Math.abs(c.offsetLeft - pad - el.scrollLeft) < Math.abs(best.offsetLeft - pad - el.scrollLeft) ? c : best), cards[0]);
            el.scrollTo({ left: target.offsetLeft - pad, behavior: 'smooth' });
            setTimeout(() => { el.style.scrollSnapType = ''; }, 450);
        };
        const onClick = (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } };
        const noDrag = (e) => e.preventDefault();
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
    }, [related]);
    const facts = [
        [<Pin key="i" />, 'Location', project.location],
        [<Office key="i" />, 'Area', project.area],
        [<Units key="i" />, 'Apartments', project.units ? `${project.units} Units` : null],
        [<Spark key="i" />, 'Stage', project.status],
    ].filter(([, , v]) => v);

    const [copied, setCopied] = useState(false);
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareText = encodeURIComponent(`${project.name} by PTI Development`);
    const shareUrl = encodeURIComponent(pageUrl);
    const shares = [
        ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, <Facebook key="i" />],
        ['X', `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`, <XIcon key="i" />],
        ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`, <LinkedIn key="i" />],
        ['WhatsApp', `https://wa.me/?text=${shareText}%20${shareUrl}`, <WhatsApp key="i" />],
    ];
    const copy = () => {
        navigator.clipboard?.writeText(pageUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => {});
    };

    return (
        <SiteLayout key={project.slug} title={project.name}>
            <section className="pj" data-theme="light" data-floor="Overview">
                <div className="wrap">
                    <div className="pj-head">
                        {project.status && <span className="pj-status">{project.status}</span>}
                        <h1 className="pj-title">{project.name}</h1>
                        {address && <p className="pj-addr"><Pin />{address}</p>}
                    </div>

                    <div className="pj-top">
                        <div className="pj-photo">{project.image_url && <img src={project.image_url} alt={project.name} />}</div>

                        {isOn(facts_) && <div className="pj-facts">
                            <div className="pj-facts-head">
                                <div>
                                    <h2>{facts_.title ?? 'Project Facts'}</h2>
                                    <span>{facts_.subtitle ?? 'At a glance'}</span>
                                </div>
                                {project.status && <span className="pj-pill">{project.status}</span>}
                            </div>
                            <div className="pj-cells">
                                {facts.map(([icon, label, value]) => (
                                    <div className="pj-cell" key={label}>
                                        <span className="pj-ico">{icon}</span>
                                        <span><small>{label}</small><b>{value}</b></span>
                                    </div>
                                ))}
                            </div>
                            {features.length > 0 && (
                                <div className="pj-figures">
                                    <small>{facts_.figures_label ?? 'Key figures'}</small>
                                    <div>{features.map((f) => <span key={f.label}>{f.label}{f.value ? `: ${f.value}` : ''}</span>)}</div>
                                </div>
                            )}
                            <div className="pj-actions">
                                <Btn href={facts_.button?.href || '/contact#contact'} className="dark">{t(facts_.button?.label, 'Enquire About This Project')}</Btn>
                                {site.phone && <a className="pj-phone" href={tel}><Phone />{site.phone}</a>}
                            </div>
                            <div className="pj-share">
                                <small>{facts_.share_label ?? 'Share'}</small>
                                {shares.map(([label, href, icon]) => (
                                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${label}`}>{icon}</a>
                                ))}
                                <button type="button" onClick={copy} aria-label="Copy link">{copied ? <Check /> : <LinkIcon />}</button>
                            </div>
                        </div>}
                    </div>
                </div>
            </section>

            {isOn(about) && <section className="pj-sec" data-theme="light" data-floor="About">
                <div className="wrap pj-body">
                    <div>
                        <div id="project-overview" className="pj-anchor">
                            <h2 className="pj-h2">{rich(t(about.title, 'About *This Project*'), null, 'em')}</h2>
                            <p className="pj-text">{overview}</p>
                        </div>
                        {features.length > 0 && (
                            <div id="key-elements" className="pj-anchor">
                                <h2 className="pj-h2">{rich(t(about.elements_title, 'Key Project *Elements*'), null, 'em')}</h2>
                                <div className="pj-tiles">
                                    {features.map((f) => (
                                        <div className="pj-tile" key={f.label}><span className="pj-tick"><Check /></span><span>{f.label}{f.value ? <b> {f.value}</b> : null}</span></div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div id="location" className="pj-anchor">
                            <h2 className="pj-h2">{rich(t(about.location_title, 'Project *Location*'), null, 'em')}</h2>
                            {address && <p className="pj-addr"><Pin />{address}</p>}
                            <iframe className="map pj-map" title="Project location map" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                                src={`https://www.google.com/maps?q=${encodeURIComponent(project.area + ', Dhaka, Bangladesh')}&output=embed`} />
                        </div>
                    </div>

                    {isOn(team) && <aside className="pj-aside">
                        <div className="pj-team">
                            <h3>{t(team.title, 'Talk to Our Team')}</h3>
                            <p>{t(team.text, 'Interested in {name}? We will walk you through the units, pricing and paperwork.')}</p>
                            {site.phone && <a href={tel}><Phone />{site.phone}</a>}
                            {site.whatsapp && <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer"><WhatsApp />{team.whatsapp_label ?? 'Chat on WhatsApp'}</a>}
                            <Btn href={team.button?.href || '/contact'}>{t(team.button?.label, 'Book a Site Visit')}</Btn>
                        </div>
                    </aside>}
                </div>
            </section>}

            {isOn(gal) && <section className="pj-sec pj-gallery-sec" data-theme="light" data-floor="Gallery" id="gallery">
                <div className="wrap">
                    <h2 className="pj-h2">{rich(t(gal.title, '{name} *in pictures*'), null, 'em')}</h2>
                    {/* fixed layout of GALLERY_SLOTS tiles (one large, four small, two wide): the project's photos fill
                        them in order and any empty tile shows a placeholder, so the final arrangement is always visible */}
                    <div className="pj-gallery pj-bento" ref={bento}>
                        {slots.map((label, i) => (gallery[i]
                            ? (
                                <a key={gallery[i]} href={gallery[i]} target="_blank" rel="noopener noreferrer" className={`pj-shot s${i + 1}`} aria-label={`Open picture ${i + 1} of ${project.name}`}>
                                    <img src={gallery[i]} alt={`${project.name}, picture ${i + 1}`} loading="lazy" />
                                </a>
                            )
                            : (
                                <div key={`ph${i}`} className={`pj-shot pj-ph s${i + 1}`} aria-hidden="true">
                                    <ImageIcon />
                                    <b>{label}</b>
                                    <small>{gal.placeholder ?? 'Photo coming soon'}</small>
                                </div>
                            )))}
                    </div>
                </div>
            </section>}

            {isOn(rel) && related.length > 0 && (
                <section className="section projects-h pj-related" data-theme="light" data-floor="Related">
                    <div className="wrap">
                        <div className="section-head split">
                            <div>
                                <Split>{[<>{rich(t(rel.title, 'Related *Projects*'), 'serif gold')}</>]}</Split>
                            </div>
                            <TLink className="link-arrow" href={rel.link?.href || '/projects'} data-reveal>{rel.link?.label ?? 'All projects'} <ArrowRight /></TLink>
                        </div>
                    </div>
                    <div className="ph-track-wrap">
                        <div className="ph-track" ref={relTrack}>{related.map((p, i) => <ProjectCard key={p.id} project={withHdImage(p)} index={i} total={related.length} />)}</div>
                    </div>
                </section>
            )}
        </SiteLayout>
    );
}
