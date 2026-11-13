import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { Mail, Office, Phone, WhatsApp } from '../Components/Icons';
import OfficeMap from '../Components/OfficeMap';
import { PageHero, Split } from '../Components/Site';
import SiteLayout from '../Layouts/SiteLayout';
import { initLuxSections } from '../lib/lux';
import { Faq, HomeContact } from './Home';

/* Contact: the photo hero, the landing page's contact section (same form), "Questions, answered", then the office:
   map on the left, phone / email / office / WhatsApp on the right (each card turns navy under the mouse). Every plain background is the landing page's
   lavender; colours and text selection follow the landing page. */
export default function Contact({ faqs = [] }) {
    const { site } = usePage().props;
    /* the landing-page (lux) sections keep their look and motion */
    const lux = useRef(null);
    useEffect(() => (lux.current ? initLuxSections(lux.current) : undefined), []);

    return (
        <SiteLayout title="Contact" tower={false}>
            <PageHero className="lux-gold hero-min ct-hero" crumb="Contact" image="/images/skyline-up.webp" title={['Connect With', 'PTI Development', <span className="serif">Today</span>]} />

            <div className="lx ct-lux" ref={lux}>
                <HomeContact site={site} image="/images/lets-talk-keys.webp" />
                <Faq faqs={faqs} openFirst />
            </div>

            <section className="section lux-gold ct-find" data-theme="light" data-floor="Find us">
                <div className="wrap">
                    <div className="section-head">
                        <Split>{[<>Our <span className="serif">office</span></>]}</Split>
                    </div>
                    <div className="ct-find-grid">
                        <OfficeMap address={site.address_long || site.address} />
                        <div className="contact-cards">
                            <a className="c-card" href={`tel:${(site.phone || '').replace(/\s/g, '')}`} data-reveal><span className="ico"><Phone /></span><span><small>Call us</small><b>{site.phone}</b></span></a>
                            <a className="c-card" href={`mailto:${site.email}`} data-reveal><span className="ico"><Mail /></span><span><small>Email</small><b>{site.email}</b></span></a>
                            <div className="c-card" data-reveal><span className="ico"><Office /></span><span><small>Office</small><b>{site.address_long}</b></span></div>
                            {site.whatsapp && (
                                <a className="c-card wa" href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener" data-reveal><span className="ico"><WhatsApp /></span><span><small>WhatsApp</small><b>Message us anytime</b></span></a>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
