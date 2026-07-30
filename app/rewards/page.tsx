import type { Metadata } from 'next';
import Image from 'next/image';
import SiteFooter from '../components/site-footer';
import SiteHeader from '../components/site-header';
import RewardsSignup from '../components/rewards-signup';

export const metadata: Metadata = {
  title: 'Rewards',
  description: 'Join Dame Rewards to earn points, unlock free items, and receive member benefits.',
};

const benefits = [
  {
    number: '01',
    title: 'Earn on every visit',
    text: 'Your eligible Dame purchases will move you closer to free drinks and food.',
  },
  {
    number: '02',
    title: 'Redeem free items',
    text: 'Use points for cold foam, milk upgrades, food items, drinks, and future Dame merch.',
  },
  {
    number: '03',
    title: 'Birthday love',
    text: 'Members will receive a birthday reward because your day deserves something good.',
  },
  {
    number: '04',
    title: 'First to know',
    text: 'Hear about new drinks, pop-ups, special events, and limited releases before everyone else.',
  },
];

export default function RewardsPage() {
  return (
    <main className="dame-site dame-inner-page">
      <SiteHeader />

      <section className="dame-rewards-hero">
        <div className="dame-rewards-copy">
          <p className="dame-kicker dame-kicker-light">Dame Rewards</p>
          <h1>More flavor.<br />More life.<br />Más Dame.</h1>
          <p>
            Sip. Earn. Return. Every cup brings you closer to something special.
          </p>
          <div className="dame-actions">
            <a className="dame-button dame-button-light" href="#join">Join Dame Rewards</a>
            <a className="dame-inline-link dame-inline-link-light" href="/rewards/account">
              My account <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        <div className="dame-rewards-bean">
          <Image src="/assets/bean.png" alt="The Dame Bean welcoming rewards members" width={632} height={922} priority />
        </div>
      </section>

      <section className="dame-benefits" aria-labelledby="benefits-title">
        <div className="dame-benefits-heading">
          <p className="dame-kicker">Why join?</p>
          <h2 id="benefits-title">Every purchase deserves a little love.</h2>
          <p>
            Earn points as you sip, then turn them into drinks, upgrades, and
            special Dame moments.
          </p>
        </div>
        <div className="dame-benefit-grid">
          {benefits.map((benefit) => (
            <article key={benefit.number}>
              <span>{benefit.number}</span>
              <h3>{benefit.title}</h3>
              <p>{benefit.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="join" className="dame-rewards-join">
        <div>
          <p className="dame-kicker">Be there from the beginning</p>
          <h2>Join Dame Rewards.</h2>
          <p>
            Create your member account, keep your profile in one place, and see
            your points and available rewards whenever you come back.
          </p>
        </div>
        <RewardsSignup />
      </section>

      <SiteFooter />
    </main>
  );
}
