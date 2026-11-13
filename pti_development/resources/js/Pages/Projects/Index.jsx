import { Cta, PageHero, ProjectCard, Split } from '../../Components/Site';
import SiteLayout from '../../Layouts/SiteLayout';
import { withHdImage } from '../../lib/projectImages';

export default function ProjectsIndex({ projects }) {

    return (
        <SiteLayout title="Projects" tower={false}>
            <PageHero crumb="Projects" className="hero-min proj-hero" image="/images/projects-hero.webp" imageStyle={{ objectPosition: '50% 60%' }} title={['Towers Rising', <>Across <span className="serif">Dhaka</span></>]} />

            <section className="section pj-list" data-theme="light" data-floor="Portfolio">
                <div className="wrap">
                    <div className="section-head">
                        <Split>{[<>Our <span className="serif">Projects</span></>]}</Split>
                    </div>
                    <div className="projects-grid">
                        {projects.map((p, i) => (
                            <ProjectCard key={p.id} project={withHdImage(p)} index={i} total={projects.length} />
                        ))}
                    </div>
                </div>
            </section>

            <div className="pj-list-cta"><Cta /></div>
        </SiteLayout>
    );
}
