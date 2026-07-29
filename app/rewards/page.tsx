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
          <h1>Come back.<br />Get something good.</h1>
          <p>
            A straightforward rewards program built around points, free items,
            birthday treats, and the people who keep showing up for Dame.
          </p>
          <a className="dame-button dame-button-light" href="#join">Join the launch list</a>
        </div>
        <div className="dame-rewards-bean">
          <Image src="/assets/bean.png" alt="The Dame Bean welcoming rewards members" width={632} height={922} priority />
        </div>
      </section>

      <section className="dame-benefits" aria-labelledby="benefits-title">
        <div className="dame-benefits-heading">
          <p className="dame-kicker">Why join?</p>
          <h2 id="benefits-title">The benefits stay simple.</h2>
          <p>No passport. No chasing locations. Just rewards for choosing Dame.</p>
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
            Add your name to the launch list. We&apos;ll let you know when points
            and member accounts are ready.
          </p>
        </div>
        <RewardsSignup />
      </section>

      <SiteFooter />
    </main>
  );
}
