import { useEffect, useRef } from 'react';
import { Cta, pad, PageHero, Split, StatCard } from '../Components/Site';
import SiteLayout from '../Layouts/SiteLayout';
import { initLuxSections } from '../lib/lux';
import { Collection, Faq, Gallery, Numbers, Place, Portal, Quote, Services, Sky, Values, Vision } from './Home';

export default function About({ values, stats, team, projects = [], services = [], faqs = [], homeStats = [] }) {
    /* the sections moved here from Home keep their own style and scroll motion */
    const lux = useRef(null);
    useEffect(() => (lux.current ? initLuxSections(lux.current) : undefined), []);
    return (
        <SiteLayout title="About">
            <PageHero crumb="About" image="/images/rooftop-dusk.webp" title={['Our Legacy of', 'Construction', <span className="serif">Excellence</span>]}>
                <p className="lead" data-hero-in>From modern property development to land share investment and full legal support, PTI delivers end-to-end solutions for Dhaka's real estate market.</p>
            </PageHero>

            <section className="section" data-theme="light" data-floor="Our story">
                <div className="wrap story-grid">
                    <div className="story-media" data-clip>
                        <img src="/images/projectimage.webp" alt="PTI construction site" />
                        <div className="stamp"><span><b>9+</b>years building Dhaka</span></div>
                    </div>
                    <div className="story-copy">
                        <span className="eyebrow" data-reveal>Our story</span>
                        <Split style={{ marginTop: 20 }}>{['We build trusted', <>homes and <span className="serif">workspaces.</span></>]}</Split>
                        <p data-reveal>PTI Development's journey began with a clear vision: to elevate living and working spaces in Dhaka through uncompromising quality and integrity. From our first residential project to our expansive mixed-use developments, our journey has been fueled by a commitment to our clients' aspirations and the sustainable growth of our communities. Every project is a milestone in our legacy of excellence.</p>
                        <p data-reveal>Led by <span className="leader">Md. Ruhul Amin</span>, a visionary entrepreneur, we are shaping Dhaka's skyline with projects that combine affordability, transparency, and world-class design. Every square foot we build is a commitment: to trust, to safety, and to the dreams of our clients.</p>
                    </div>
                </div>
            </section>

            {values.length > 0 && (
                <section className="section" data-theme="dark" data-floor="What we stand for">
                    <div className="blueprint-grid"></div>
                    <div className="wrap" style={{ position: 'relative' }}>
                        <div className="section-head split">
                            <div>
                                <span className="eyebrow" data-reveal>What we stand for</span>
                                <Split style={{ marginTop: 20 }}>{['Recognized for', <>Excellence and <span className="serif gold">Integrity</span></>]}</Split>
                            </div>
                            <p className="lead" data-reveal style={{ maxWidth: '34ch' }}>Principles poured into every foundation we lay.</p>
                        </div>
                        <div className="values-grid">
                            {values.map((v, i) => (
                                <div className="value" data-reveal key={v.id}>
                                    {v.image_url && <img src={v.image_url} alt="" loading="lazy" />}
                                    <span className="vn">{pad(i + 1)}</span>
                                    <div><h3>{v.title}</h3><p>{v.text}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {stats.length > 0 && (
                <section className="section" data-theme="light" data-floor="In numbers">
                    <div className="wrap">
                        <div className="section-head">
                            <span className="eyebrow" data-reveal>Milestones</span>
                            <Split>{['Built floor', <>by <span className="serif">floor</span></>]}</Split>
                        </div>
                        <div className="numbers-grid">{stats.map((s, i) => <StatCard key={s.id} stat={s} index={i} />)}</div>
                    </div>
                </section>
            )}

            {team.length > 0 && (
                <section className="section" data-theme="white" data-floor="Our people">
                    <div className="wrap">
                        <div className="section-head split">
                            <div>
                                <span className="eyebrow" data-reveal>Leadership &amp; team</span>
                                <Split style={{ marginTop: 20 }}>{['Meet Our', <span className="serif">Visionaries</span>]}</Split>
                            </div>
                            <p className="lead" data-reveal style={{ maxWidth: '36ch' }}>The people who turn blueprints into homes, from the boardroom to the building site.</p>
                        </div>
                        <div className="team-grid">
                            {team.map((m, i) => (
                                <div className={`member ${i < 2 ? 'lead-member' : ''}`} data-reveal key={m.id}>
                                    <div className="member-photo">{m.photo_url && <img src={m.photo_url} alt={m.name} loading="lazy" />}</div>
                                    <div><h3>{m.name}</h3><small>{m.role}</small></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <Cta />

            {/* moved from the Home page (Step Inside -> FAQ), same look and motion as there */}
            <div className="lx lx-moved" ref={lux}>
                <Portal />
                {projects.length > 0 && <Collection projects={projects} />}
                <Quote />
                <Vision />
                <Place />
                <Sky />
                <Services services={services} />
                <Values values={values} />
                <Numbers stats={homeStats} />
                {projects.length > 0 && <Gallery projects={projects} />}
                <Faq faqs={faqs} />
            </div>
        </SiteLayout>
    );
}
