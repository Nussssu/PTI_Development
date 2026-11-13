import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowRight, Check, Facebook, LinkedIn, Office, Phone, Pin, Spark, Units, WhatsApp } from '../../Components/Icons';
import { Btn, ProjectCard, Split, TLink } from '../../Components/Site';
import SiteLayout from '../../Layouts/SiteLayout';
import { withHdImage } from '../../lib/projectImages';

const XIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z" /></svg>
);
const LinkIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" /></svg>
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
    const overview = project.description
        || `${project.units} thoughtfully planned residences by PTI Development, with clear pricing, documented paperwork and lasting quality.`;
    const tel = `tel:${(site.phone || '').replace(/\s/g, '')}`;
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

                        <div className="pj-facts">
                            <div className="pj-facts-head">
                                <div>
                                    <h2>Project Facts</h2>
                                    <span>At a glance</span>
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
                                    <small>Key figures</small>
                                    <div>{features.map((f) => <span key={f.label}>{f.label}{f.value ? `: ${f.value}` : ''}</span>)}</div>
                                </div>
                            )}
                            <div className="pj-actions">
                                <Btn href="/contact#contact" className="dark">Enquire About This Project</Btn>
                                {site.phone && <a className="pj-phone" href={tel}><Phone />{site.phone}</a>}
                            </div>
                            <div className="pj-share">
                                <small>Share</small>
                                {shares.map(([label, href, icon]) => (
                                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${label}`}>{icon}</a>
                                ))}
                                <button type="button" onClick={copy} aria-label="Copy link">{copied ? <Check /> : <LinkIcon />}</button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="pj-sec" data-theme="light" data-floor="About">
                <div className="wrap pj-body">
                    <div>
                        <div id="project-overview" className="pj-anchor">
                            <h2 className="pj-h2">About <em>This Project</em></h2>
                            <p className="pj-text">{overview}</p>
                        </div>
                        {features.length > 0 && (
                            <div id="key-elements" className="pj-anchor">
                                <h2 className="pj-h2">Key Project <em>Elements</em></h2>
                                <div className="pj-tiles">
                                    {features.map((f) => (
                                        <div className="pj-tile" key={f.label}><span className="pj-tick"><Check /></span><span>{f.label}{f.value ? <b> {f.value}</b> : null}</span></div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div id="location" className="pj-anchor">
                            <h2 className="pj-h2">Project <em>Location</em></h2>
                            {address && <p className="pj-addr"><Pin />{address}</p>}
                            <iframe className="map pj-map" title="Project location map" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                                src={`https://www.google.com/maps?q=${encodeURIComponent(project.area + ', Dhaka, Bangladesh')}&output=embed`} />
                        </div>
                    </div>

                    <aside className="pj-aside">
                        <div className="pj-team">
                            <h3>Talk to Our Team</h3>
                            <p>Interested in {project.name}? We will walk you through the units, pricing and paperwork.</p>
                            {site.phone && <a href={tel}><Phone />{site.phone}</a>}
                            {site.whatsapp && <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer"><WhatsApp />Chat on WhatsApp</a>}
                            <Btn href="/contact">Book a Site Visit</Btn>
                        </div>
                    </aside>
                </div>
            </section>

            <section className="pj-sec pj-gallery-sec" data-theme="light" data-floor="Gallery" id="gallery">
                <div className="wrap">
                    <h2 className="pj-h2">{project.name} <em>in pictures</em></h2>
                    <div className={`pj-gallery n${Math.min(gallery.length, 4)}`}>
                        {gallery.map((g, i) => (
                            <a key={g} href={g} target="_blank" rel="noopener noreferrer" className="pj-shot" aria-label={`Open picture ${i + 1} of ${project.name}`}>
                                <img src={g} alt={`${project.name}, picture ${i + 1}`} loading="lazy" />
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {related.length > 0 && (
                <section className="section projects-h pj-related" data-theme="light" data-floor="Related">
                    <div className="wrap">
                        <div className="section-head split">
                            <div>
                                <Split>{[<>Related <span className="serif gold">Projects</span></>]}</Split>
                            </div>
                            <TLink className="link-arrow" href="/projects" data-reveal>All projects <ArrowRight /></TLink>
                        </div>
                    </div>
                    <div className="ph-track-wrap">
                        <div className="ph-track">{related.map((p, i) => <ProjectCard key={p.id} project={withHdImage(p)} index={i} total={related.length} />)}</div>
                    </div>
                    <div className="wrap"><div className="ph-progress"><i></i></div></div>
                </section>
            )}
        </SiteLayout>
    );
}
