import type { Metadata } from 'next';
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
          <p className="dame-kicker">Bring Dame to your event</p>
          <h1>Build your event.</h1>
          <p>
            Start with 100 drinks and two hours of service. Move the sliders,
            see your estimate immediately, and request your date with a secure $200 deposit.
          </p>
        </div>
        <div className="dame-catering-base">
          <span>Starting package</span>
          <strong>${CATERING_BASE_PRICE_DOLLARS}</strong>
          <p>100 drinks · 2 hours</p>
        </div>
      </section>

      <section className="dame-catering-builder" aria-labelledby="builder-title">
        <div className="dame-builder-heading">
          <p className="dame-kicker">Your estimate</p>
          <h2 id="builder-title">Tell us what you need.</h2>
          <p>Travel is considered through the event address. Final details are always confirmed personally.</p>
        </div>
        <CateringCalculator />
      </section>

      <section className="dame-catering-explainer">
        <article>
          <span>01</span>
          <h3>Build an estimate</h3>
          <p>Choose the event address, date, drink amount, and hours.</p>
        </article>
        <article>
          <span>02</span>
          <h3>Request the date</h3>
          <p>Pay the $200 deposit securely with Square. It is applied to your final event balance.</p>
        </article>
        <article>
          <span>03</span>
          <h3>We call you</h3>
          <p>We confirm availability, menu, travel, final price, and the remaining balance.</p>
        </article>
      </section>

      <SiteFooter />
    </main>
  );
}
