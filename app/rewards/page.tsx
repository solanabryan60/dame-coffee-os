import type { Metadata } from 'next';
import BeanStateImage from '../components/bean-state';
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
    title: '10 points per $1',
    text: 'Earn online or save an in-person receipt afterward.',
  },
  {
    number: '02',
    title: 'Free Dame favorites',
    text: 'Use points for upgrades, drinks, food, and future merch.',
  },
  {
    number: '03',
    title: 'Bring a friend',
    text: 'You get 500 points. They get 250 after their first eligible $5 purchase.',
  },
  {
    number: '04',
    title: '2× days',
    text: 'Watch for double-point days and special drinks.',
  },
  {
    number: '05',
    title: 'Birthday reward',
    text: 'A little something from Dame on your day.',
  },
  {
    number: '06',
    title: 'First to know',
    text: 'New drinks, pop-ups, and limited releases.',
  },
];

type RewardsPageProps = {
  searchParams: Promise<{ ref?: string | string[]; claim?: string | string[] }>;
};

export default async function RewardsPage({ searchParams }: RewardsPageProps) {
  const params = await searchParams;
  const rawReferral = Array.isArray(params.ref) ? params.ref[0] : params.ref;
  const referralCode = rawReferral?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) ?? '';
  const rawClaim = Array.isArray(params.claim) ? params.claim[0] : params.claim;
  const returnTo = rawClaim === '1' ? '/rewards/claim' : '/rewards/account';

  return (
    <main className="dame-site dame-inner-page">
      <SiteHeader />

      <section className="dame-rewards-hero">
        <div className="dame-rewards-copy">
          <p className="dame-kicker dame-kicker-light">Dame Rewards</p>
          <h1>More flavor.<br />More life.<br />Más Dame.</h1>
          <p>
            Earn points. Enjoy more Dame.
          </p>
          <p lang="es">Gana puntos. Disfruta más Dame.</p>
          <div className="dame-actions">
            <a className="dame-button dame-button-light" href="#join">Join Dame Rewards</a>
            <a className="dame-inline-link dame-inline-link-light" href="/rewards/account">
              My account <span aria-hidden="true">→</span>
            </a>
            <a className="dame-inline-link dame-inline-link-light" href="/rewards/claim">
              Save receipt points <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        <div className="dame-rewards-bean">
          <BeanStateImage state="rewards" priority />
        </div>
      </section>

      <section className="dame-benefits" aria-labelledby="benefits-title">
        <div className="dame-benefits-heading">
          <p className="dame-kicker">Why join? · ¿Por qué unirte?</p>
          <h2 id="benefits-title">Points become Dame.</h2>
          <p>10 points per eligible $1. Redeem them for the things you love.</p>
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
          <p className="dame-kicker">Join us · Únete</p>
          <h2>Join Dame Rewards.</h2>
          <p>Create an account. See your points. Choose your rewards.</p>
        </div>
        <RewardsSignup initialReferralCode={referralCode} returnTo={returnTo} />
      </section>

      <SiteFooter
        beanState="celebrating"
        beanEyebrow="Every purchase matters."
        beanMessage="Your next reward is waiting."
      />
    </main>
  );
}
