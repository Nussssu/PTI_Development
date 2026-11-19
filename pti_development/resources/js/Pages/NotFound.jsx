import SiteLayout from '../Layouts/SiteLayout';
import { useSection } from '../lib/cms';

/* The 404 page ("page not found"): the big number with "Page not found" under it, centred on the site's lavender.
   No other text, no buttons and no footer. Both texts: Admin → Pages → 404 page. */
export default function NotFound() {
    const c = useSection('content');

    return (
        <SiteLayout title="Page not found" tower={false} footer={false}>
            <section className="nf" data-theme="light" data-floor="404">
                <div className="nf-box">
                    <div className="nf-code" aria-hidden="true">{c.code ?? '404'}</div>
                    <h1 className="nf-title">{c.title ?? 'Page not found'}</h1>
                </div>
            </section>
        </SiteLayout>
    );
}
