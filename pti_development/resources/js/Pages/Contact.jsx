import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { Mail, Office, Phone, WhatsApp } from '../Components/Icons';
import OfficeMap from '../Components/OfficeMap';
import { PageHero, Split } from '../Components/Site';
import SiteLayout from '../Layouts/SiteLayout';
import { isOn, rich, richLines, useSection } from '../lib/cms';
import { initLuxSections } from '../lib/lux';
import { Faq, HomeContact } from './Home';

/* Contact: the photo hero, the landing page's contact section (same form), "Questions, answered", then the office:
   map on the left, phone / email / office / WhatsApp on the right (each card turns navy under the mouse). Every plain background is the landing page's
   lavender; colours and text selection follow the landing page. Texts / images: Admin → Pages → Contact; the contact
   details themselves come from Settings. */
export default function Contact() {
    const { site } = usePage().props;
    const hero = useSection('hero');
    const contact = useSection('contact');
    const faq = useSection('faq');
    const faqs = (faq?.items || []).filter((f) => f.question && f.answer).map((f, i) => ({ ...f, id: i }));
    const office = useSection('office');
    const luxOn = isOn(contact) || isOn(faq);
    /* the landing-page (lux) sections keep their look and motion */
    const lux = useRef(null);
    useEffect(() => (lux.current ? initLuxSections(lux.current) : undefined), [luxOn]);

    return (
        <SiteLayout title="Contact" tower={false}>
            {isOn(hero) && (
                <PageHero className="lux-gold hero-min ct-hero" crumb="Contact" image={hero.image || '/images/skyline-up.webp'}
                    title={richLines(hero.title ?? 'Connect With\nPTI Development\n*Today*')} />
            )}

            {luxOn && (
                <div className="lx ct-lux" ref={lux}>
                    {isOn(contact) && <HomeContact site={site} image="/images/lets-talk-keys.webp" c={contact} />}
                    {isOn(faq) && <Faq faqs={faqs} openFirst c={faq} />}
                </div>
            )}

            {isOn(office) && (
                <section className="section lux-gold ct-find" data-theme="light" data-floor="Find us">
                    <div className="wrap">
                        <div className="section-head">
                            <Split>{[<>{rich(office.title ?? 'Our *office*')}</>]}</Split>
                        </div>
                        <div className="ct-find-grid">
                            <OfficeMap address={site.address_long || site.address} />
                            <div className="contact-cards">
                                <a className="c-card" href={`tel:${(site.phone || '').replace(/\s/g, '')}`} data-reveal><span className="ico"><Phone /></span><span><small>{office.call_label ?? 'Call us'}</small><b>{site.phone}</b></span></a>
                                <a className="c-card" href={`mailto:${site.email}`} data-reveal><span className="ico"><Mail /></span><span><small>{office.email_label ?? 'Email'}</small><b>{site.email}</b></span></a>
                                <div className="c-card" data-reveal><span className="ico"><Office /></span><span><small>{office.office_label ?? 'Office'}</small><b>{site.address_long}</b></span></div>
                                {site.whatsapp && (
                                    <a className="c-card wa" href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener" data-reveal><span className="ico"><WhatsApp /></span><span><small>{office.whatsapp_label ?? 'WhatsApp'}</small><b>{office.whatsapp_text ?? 'Message us anytime'}</b></span></a>
                                )}
                                {/* more WhatsApp numbers (Admin → Settings → Social links) */}
                                {(site.whatsapp_more || []).map((w) => (
                                    <a className="c-card wa" key={w.number} href={`https://wa.me/${w.number}`} target="_blank" rel="noopener" data-reveal><span className="ico"><WhatsApp /></span><span><small>{w.label || (office.whatsapp_label ?? 'WhatsApp')}</small><b>+{w.number}</b></span></a>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </SiteLayout>
    );
}
