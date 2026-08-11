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
    title: 'Every purchase carries forward',
    text: 'Earn 10 Dame points for every eligible $1, whether you order online or save an in-person receipt afterward.',
  },
  {
    number: '02',
    title: 'Redeem free items',
    text: 'Use points for cold foam, milk upgrades, food items, drinks, and future Dame merch.',
  },
  {
    number: '03',
    title: 'Share the Dame love',
    text: 'Refer a friend. After their first eligible $5 purchase, you earn 500 points and they earn 250.',
  },
  {
    number: '04',
    title: 'Catch a 2× moment',
    text: 'Selected days and menu favorites can earn double points when Dame turns on a special campaign.',
  },
  {
    number: '05',
    title: 'Birthday love',
    text: 'Members will receive a birthday reward because your day deserves something special.',
  },
  {
    number: '06',
    title: 'First to know',
    text: 'Hear about new drinks, pop-ups, special events, and limited releases before everyone else.',
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
            Sip. Earn. Return. Every cup brings you closer to something special.
          </p>
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
          <p className="dame-kicker">Why join?</p>
          <h2 id="benefits-title">Every purchase deserves a little love.</h2>
          <p>
            Earn 10 points per eligible $1, then turn your points into drinks,
            upgrades, food, and special Dame moments.
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
        <RewardsSignup initialReferralCode={referralCode} returnTo={returnTo} />
      </section>

      <SiteFooter beanState={null} />
    </main>
  );
}
