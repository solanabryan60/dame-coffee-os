import type { Metadata } from 'next';
import CateringCalculator from '../components/catering-calculator';
import SiteFooter from '../components/site-footer';
import SiteHeader from '../components/site-header';

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
            see your estimate immediately, and request your date when it feels right.
          </p>
        </div>
        <div className="dame-catering-base">
          <span>Starting package</span>
          <strong>$600</strong>
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
          <p>Send the details to Dame without starting over or doing the math yourself.</p>
        </article>
        <article>
          <span>03</span>
          <h3>We call you</h3>
          <p>We confirm availability, menu, travel, final price, and the deposit.</p>
        </article>
      </section>

      <SiteFooter />
    </main>
  );
}
