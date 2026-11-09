import { useForm, usePage } from '@inertiajs/react';
import { ArrowRight, Check } from '../../Components/Icons';
import { Btn, Cta, Field, HeroTitle, pad, ProjectCard, Split, TLink } from '../../Components/Site';
import SiteLayout from '../../Layouts/SiteLayout';

function SiteVisitForm({ project }) {
    const { flash } = usePage().props;
    const form = useForm({ source: 'site_visit', project_id: project.id, first_name: '', phone: '', message: '', website: '' });
    const submit = (e) => {
        e.preventDefault();
        form.post('/inquiries', { preserveScroll: true, onSuccess: () => form.reset('first_name', 'phone', 'message') });
    };
    return (
        <form className="visit-form" onSubmit={submit} noValidate>
            <input type="text" name="website" value={form.data.website} onChange={(e) => form.setData('website', e.target.value)} className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <Field id="v1" label="Your name" value={form.data.first_name} onChange={(e) => form.setData('first_name', e.target.value)} error={form.errors.first_name} />
            <Field id="v2" label="Phone" type="tel" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} error={form.errors.phone} />
            <button className="btn" type="submit" disabled={form.processing} data-magnetic>
                <span>{form.processing ? 'Sending…' : 'Request a site visit'}</span>
            </button>
            {flash.success && form.wasSuccessful && <p className="form-success" role="status"><Check /> {flash.success}</p>}
        </form>
    );
}

export default function ProjectShow({ project, index, total, related }) {
    const { site } = usePage().props;
    const tel = `tel:${(site.phone || '').replace(/\s/g, '')}`;
    const features = (project.features || []).filter((f) => f.label);
    const gallery = project.gallery_urls || [];

    return (
        <SiteLayout key={project.slug} title={project.name}>
            <section className="page-hero pd-hero" data-theme="dark" data-floor="Overview">
                <div className="bg">{project.image_url && <img src={project.image_url} alt="" />}</div>
                <div className="wrap">
                    <div className="crumbs" data-hero-in><TLink href="/">Home</TLink><span>/</span><TLink href="/projects">Projects</TLink><span>/</span><span>{project.name}</span></div>
                    <span className="eyebrow" data-hero-in style={{ marginBottom: 22 }}>Project {pad(index)} / {pad(total)}</span>
                    <HeroTitle>{[project.name]}</HeroTitle>
                    <p className="lead" data-hero-in>{project.units} Units · {project.location} · {project.status}</p>
                </div>
            </section>

            <section className="section" data-theme="light" data-floor="Key facts">
                <div className="wrap">
                    <div className="pd-facts" data-reveal>
                        <div className="pd-fact"><small>Units</small><b>{project.units} Units</b></div>
                        <div className="pd-fact"><small>Location</small><b>{project.location}</b></div>
                        <div className="pd-fact"><small>Area</small><b>{project.area}</b></div>
                        <div className="pd-fact"><small>Status</small><b>{project.status}</b></div>
                    </div>
                    <div className="pd-body">
                        <div>
                            <div className="pd-gallery" data-clip>{project.image_url && <img src={project.image_url} alt={project.name} />}</div>
                            {project.description && <div className="pd-desc" data-reveal><span className="eyebrow">Description</span><p>{project.description}</p></div>}
                            {features.length > 0 && (
                                <div className="pd-features" data-reveal>
                                    <span className="eyebrow">Key project elements</span>
                                    <dl>{features.map((f, i) => <div key={i}><dt>{f.label}</dt><dd>{f.value || '—'}</dd></div>)}</dl>
                                </div>
                            )}
                            {gallery.length > 0 && (
                                <div className="pd-thumbs" data-reveal>{gallery.map((g) => <img key={g} src={g} alt="" loading="lazy" />)}</div>
                            )}
                        </div>
                        <div className="call-card" data-reveal>
                            <span className="eyebrow">Book a site visit</span>
                            <p style={{ opacity: 0.75 }}>We will show you finished and under construction projects, introduce you to the features of the areas and tell you about the real estate market in Dhaka.</p>
                            <a className="phone" href={tel}>{site.phone}</a>
                            <SiteVisitForm project={project} />
                            <Btn href={tel} className="ghost">Call Now</Btn>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section" data-theme="white" data-floor="Location">
                <div className="wrap">
                    <div className="section-head">
                        <span className="eyebrow" data-reveal>Direction</span>
                        <Split>{[<>Project's <span className="serif">Location</span></>]}</Split>
                    </div>
                    <iframe className="map" title="Project location map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" data-reveal
                        src={`https://www.google.com/maps?q=${encodeURIComponent(project.area + ', Dhaka, Bangladesh')}&output=embed`} />
                </div>
            </section>

            {related.length > 0 && (
                <section className="section projects-h" data-theme="dark" data-floor="Related">
                    <div className="wrap">
                        <div className="section-head split">
                            <div>
                                <span className="eyebrow" data-reveal>Keep exploring</span>
                                <Split style={{ marginTop: 20 }}>{[<>Related <span className="serif gold">Projects</span></>]}</Split>
                            </div>
                            <TLink className="link-arrow" href="/projects" data-reveal>All projects <ArrowRight /></TLink>
                        </div>
                    </div>
                    <div className="ph-track-wrap">
                        <div className="ph-track">{related.map((p, i) => <ProjectCard key={p.id} project={p} index={i} total={related.length} />)}</div>
                    </div>
                    <div className="wrap"><div className="ph-progress"><i></i></div></div>
                </section>
            )}

            <Cta />
        </SiteLayout>
    );
}
