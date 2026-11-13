import { useEffect, useMemo, useRef, useState } from 'react';
import { Cta, PageHero, ProjectCard, Split } from '../../Components/Site';
import SiteLayout from '../../Layouts/SiteLayout';
import { gsap, prefersReducedMotion, ScrollTrigger } from '../../lib/motion';

export default function ProjectsIndex({ projects }) {
    const [filter, setFilter] = useState('*');
    const gridRef = useRef(null);
    const first = useRef(true);
    const areas = useMemo(() => [...new Set(projects.map((p) => p.area))], [projects]);
    const areaList = areas.length > 1 ? areas.join(', ').replace(/, ([^,]*)$/, ' and $1') : areas[0];

    useEffect(() => {
        if (first.current) { first.current = false; return; }
        ScrollTrigger.refresh();
        if (prefersReducedMotion()) return;
        const cards = gridRef.current.querySelectorAll('.p-card');
        gsap.fromTo(cards, { opacity: 0, y: 40 }, { opacity: 1, y: 0, stagger: 0.07, duration: 0.8, ease: 'expo.out', clearProps: 'transform,opacity' });
        cards.forEach((c) => gsap.set(c.querySelector('.p-card-media'), { clipPath: 'inset(0% 0 0 0)' }));
    }, [filter]);

    return (
        <SiteLayout title="Projects" tower={false}>
            <PageHero crumb="Projects" image="/images/hero-night.webp" imageStyle={{ objectPosition: '70% center' }} title={['Towers Rising', <>Across <span className="serif">Dhaka</span></>]}>
                <p className="lead" data-hero-in>{projects.length} residential towers in strategic Dhaka locations{areaList ? `, from ${areaList}` : ''}.</p>
            </PageHero>

            <section className="section" data-theme="light" data-floor="Portfolio" style={{ paddingBottom: 'clamp(140px,14vw,220px)' }}>
                <div className="wrap">
                    <div className="section-head">
                        <span className="eyebrow" data-reveal>Portfolio</span>
                        <Split>{[<>Our <span className="serif">Projects</span></>]}</Split>
                    </div>
                    <div className="filters" data-reveal>
                        <button className={`chip ${filter === '*' ? 'is-active' : ''}`} onClick={() => setFilter('*')}>All<sup>{projects.length}</sup></button>
                        {areas.map((a) => (
                            <button key={a} className={`chip ${filter === a ? 'is-active' : ''}`} onClick={() => setFilter(a)}>
                                {a}<sup>{projects.filter((p) => p.area === a).length}</sup>
                            </button>
                        ))}
                    </div>
                    <div className="projects-grid" ref={gridRef}>
                        {projects.map((p, i) => (filter === '*' || p.area === filter) && (
                            <ProjectCard key={p.id} project={p} index={i} total={projects.length} />
                        ))}
                    </div>
                </div>
            </section>

            <Cta />
        </SiteLayout>
    );
}
