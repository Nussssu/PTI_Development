import { useForm, usePage } from '@inertiajs/react';
import { Arrow, Check, Mail, Office, Phone, WhatsApp } from '../Components/Icons';
import { Cta, Field, PageHero, Split } from '../Components/Site';
import SiteLayout from '../Layouts/SiteLayout';

export default function Contact() {
    const { site, flash } = usePage().props;
    const form = useForm({ first_name: '', last_name: '', email: '', phone: '', message: '', website: '' });
    const bind = (k) => ({ value: form.data[k], onChange: (e) => form.setData(k, e.target.value), error: form.errors[k] });

    const submit = (e) => {
        e.preventDefault();
        form.post('/inquiries', { preserveScroll: true, onSuccess: () => form.reset() });
    };

    return (
        <SiteLayout title="Contact">
            <PageHero crumb="Contact" image="/images/skyline-up.webp" style={{ minHeight: '78svh' }} title={['Connect With', 'PTI Development', <span className="serif">Today</span>]}>
                <p className="lead" data-hero-in>Visit our Mirpur office or WhatsApp us anytime.</p>
            </PageHero>

            <section className="section" data-theme="light" data-floor="Get in touch">
                <div className="wrap contact-grid">
                    <div>
                        <span className="eyebrow" data-reveal>Send a message</span>
                        <Split style={{ margin: '20px 0 48px' }}>{["Let's build", <>your <span className="serif">dream</span></>]}</Split>
                        <form className="form" onSubmit={submit} noValidate data-reveal>
                            <input type="text" name="website" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.data.website} onChange={(e) => form.setData('website', e.target.value)} />
                            <Field id="f1" label="First Name" autoComplete="given-name" {...bind('first_name')} />
                            <Field id="f2" label="Last Name" autoComplete="family-name" {...bind('last_name')} />
                            <Field id="f3" label="Email Address" type="email" autoComplete="email" {...bind('email')} />
                            <Field id="f4" label="Phone" type="tel" autoComplete="tel" {...bind('phone')} />
                            <Field id="f5" label="Message" full textarea {...bind('message')} />
                            <div style={{ gridColumn: '1/-1' }}>
                                <button className="btn dark" type="submit" disabled={form.processing} data-magnetic>
                                    <span>{form.processing ? 'Sending…' : 'Submit'}</span><span className="btn-ico"><Arrow /></span>
                                </button>
                            </div>
                            {flash.success && form.wasSuccessful && <p className="form-success" role="status"><Check /> {flash.success}</p>}
                        </form>
                    </div>
                    <div className="contact-cards">
                        <a className="c-card" href={`tel:${(site.phone || '').replace(/\s/g, '')}`} data-reveal><span className="ico"><Phone /></span><span><small>Call us</small><b>{site.phone}</b></span></a>
                        <a className="c-card" href={`mailto:${site.email}`} data-reveal><span className="ico"><Mail /></span><span><small>Email</small><b>{site.email}</b></span></a>
                        <div className="c-card" data-reveal><span className="ico"><Office /></span><span><small>Office</small><b>{site.address_long}</b></span></div>
                        {site.whatsapp && (
                            <a className="c-card wa" href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener" data-reveal><span className="ico"><WhatsApp /></span><span><small style={{ opacity: 0.8 }}>WhatsApp</small><b>Message us anytime</b></span></a>
                        )}
                    </div>
                </div>
            </section>

            <section className="section" data-theme="white" data-floor="Find us">
                <div className="wrap">
                    <div className="section-head">
                        <span className="eyebrow" data-reveal>Our office</span>
                        <Split>{[<>Pallabi, <span className="serif">Mirpur</span></>]}</Split>
                    </div>
                    <iframe className="map" title="PTI Development office map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" data-reveal
                        src={`https://www.google.com/maps?q=${encodeURIComponent(site.map_query || site.address)}&output=embed`} />
                </div>
            </section>

            <Cta />
        </SiteLayout>
    );
}
