import { Check } from '../Components/Icons';
import { Btn, Cta, pad, PageHero, Split } from '../Components/Site';
import SiteLayout from '../Layouts/SiteLayout';

const STEPS = [
    ['Meet & explore', 'We show you finished and under construction projects and the features of each area.'],
    ['Choose with clarity', 'Transparent pricing and verified land titles, all clear and documented.'],
    ['Secure & sign', 'Detailed contract reviews, proper documentation and no hidden fees.'],
    ['Build & hand over', 'Transparent project updates and handovers as promised.'],
];

export default function Services({ services }) {
    return (
        <SiteLayout title="Services">
            <PageHero crumb="Services" image={services[0]?.image_url || '/images/rooftop-dusk.webp'} title={['Services Built on', <>Trust &amp; <span className="serif">Expertise</span></>]}>
                <p className="lead" data-hero-in>From modern property development to land share investment and full legal support, PTI delivers end-to-end solutions for Dhaka's real estate market.</p>
            </PageHero>

            <section className="section" data-theme="light" data-floor="What we do">
                <div className="wrap">
                    <div className="section-head split">
                        <div>
                            <span className="eyebrow" data-reveal>{services.length === 3 ? 'Three pillars' : 'What we do'}</span>
                            <Split style={{ marginTop: 20 }}>{['One partner,', <>every <span className="serif">step</span></>]}</Split>
                        </div>
                        <p className="lead" data-reveal style={{ maxWidth: '36ch' }}>Development, land share and legal support, stacked together like the floors of a well-built tower.</p>
                    </div>
                    <div className="svc-stack">
                        {services.map((s, i) => (
                            <article className="svc-card" key={s.id}>
                                <div>
                                    <span className="svc-num">{pad(i + 1)} / {pad(services.length)}</span>
                                    <h2>{s.title}</h2>
                                    <p className="lead">{s.description}</p>
                                    <ul className="svc-list">{(s.points || []).map((p) => <li key={p}><Check />{p}</li>)}</ul>
                                    <Btn href="/projects" className={i % 3 === 1 ? '' : 'dark'}>Our Projects</Btn>
                                </div>
                                <div className="svc-media">{s.image_url && <img src={s.image_url} alt={s.title} loading="lazy" />}</div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section" data-theme="dark" data-floor="How it works">
                <div className="blueprint-grid"></div>
                <div className="wrap" style={{ position: 'relative' }}>
                    <div className="section-head">
                        <span className="eyebrow" data-reveal>Your journey with PTI</span>
                        <Split>{['From first visit', <>to <span className="serif gold">handover</span></>]}</Split>
                    </div>
                    <div className="process">
                        {STEPS.map(([t, d], i) => (
                            <div className="process-step" key={t}><span className="pn">{pad(i + 1)}</span><h3>{t}</h3><p>{d}</p></div>
                        ))}
                    </div>
                </div>
            </section>

            <Cta />
        </SiteLayout>
    );
}
