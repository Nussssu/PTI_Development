import { Cta, PageHero, ProjectCard, Split } from '../../Components/Site';
import SiteLayout from '../../Layouts/SiteLayout';
import { isOn, rich, richLines, useSection } from '../../lib/cms';
import { withHdImage } from '../../lib/projectImages';

export default function ProjectsIndex({ projects }) {
    // texts / images from Admin → Pages → Projects (the projects themselves: Collections → Projects)
    const hero = useSection('hero');
    const list = useSection('list');
    const cta = useSection('cta');

    return (
        <SiteLayout title="Projects" tower={false}>
            {isOn(hero) && (
                <PageHero crumb="Projects" className="hero-min proj-hero" image={hero.image || '/images/projects-hero.webp'} imageStyle={{ objectPosition: '50% 60%' }}
                    title={richLines(hero.title ?? 'Towers Rising\nAcross *Dhaka*')} />
            )}

            {isOn(list) && (
                <section className="section pj-list" data-theme="light" data-floor="Portfolio">
                    <div className="wrap">
                        <div className="section-head">
                            <Split>{[<>{rich(list.title ?? 'Our *Projects*')}</>]}</Split>
                        </div>
                        <div className="projects-grid">
                            {projects.map((p, i) => (
                                <ProjectCard key={p.id} project={withHdImage(p)} index={i} total={projects.length} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <div className="pj-list-cta"><Cta c={cta} /></div>
        </SiteLayout>
    );
}
