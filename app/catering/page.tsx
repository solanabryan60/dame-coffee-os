import type { Metadata } from 'next';
import BeanStateImage from '../components/bean-state';
import CateringCalculator from '../components/catering-calculator';
import SiteFooter from '../components/site-footer';
import SiteHeader from '../components/site-header';
import { CATERING_BASE_PRICE_DOLLARS } from '../lib/catering-pricing';

export const metadata: Metadata = {
  title: 'Catering',
  description: 'Build a Dame Coffee cold brew and matcha catering estimate for your event.',
};

export default function CateringPage() {
  return (
    <main className="dame-site dame-inner-page">
      <SiteHeader />

      <section className="dame-page-hero dame-catering-hero">
        <div>
          <p className="dame-kicker">Catering · Eventos</p>
          <h1>Bring Dame<br />to your event.</h1>
          <p>Cold brew and matcha, served wherever you gather.</p>
          <p lang="es">Cold brew y matcha para tu celebración.</p>
        </div>
        <div className="dame-catering-base">
          <span>Starting package</span>
          <strong>${CATERING_BASE_PRICE_DOLLARS}</strong>
          <p>100 drinks · 2 hours</p>
          <small>Plus applicable tax</small>
        </div>
      </section>

      <section className="dame-catering-explainer">
        <article>
          <span>01</span>
          <h3>Build an estimate</h3>
          <p>Choose your date, drinks, and service time.</p>
        </article>
        <article>
          <span>02</span>
          <h3>Request the date</h3>
          <p>A $200 deposit requests the date and goes toward your balance.</p>
        </article>
        <article className="dame-catering-arrival">
          <span>03</span>
          <h3>We call you</h3>
          <p>We call to confirm the details.</p>
          <BeanStateImage state="driving" className="dame-catering-page-bean" decorative />
        </article>
      </section>

      <section className="dame-catering-builder" aria-labelledby="builder-title">
        <div className="dame-builder-heading">
          <p className="dame-kicker">Your estimate</p>
          <h2 id="builder-title">Start with the experience.</h2>
          <p>Choose your drinks and time. See the estimate right away.</p>
        </div>
        <CateringCalculator />
      </section>

      <SiteFooter
        beanState="celebrating"
        beanEyebrow="Your date is closer."
        beanMessage="We’ll call you soon."
      />
    </main>
  );
}
