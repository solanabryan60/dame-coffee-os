import type { Metadata } from 'next';
import BeanStateImage from '../../components/bean-state';
import SiteFooter from '../../components/site-footer';
import SiteHeader from '../../components/site-header';
import ReceiptClaim from './receipt-claim';

export const metadata: Metadata = {
  title: 'Save Receipt Points',
  description: 'Save the Dame Rewards points from a recent in-person purchase.',
};

export default function ReceiptClaimPage() {
  return (
    <main className="dame-site dame-inner-page">
      <SiteHeader />
      <section className="dame-claim-hero">
        <div>
          <p className="dame-kicker dame-kicker-light">Keep what you earned</p>
          <h1>Don&apos;t let your<br /><em>points go to waste.</em></h1>
          <p>
            Ordered at the cart before joining or signing in? Save the purchase
            to your Dame Rewards account within 30 days.
          </p>
        </div>
        <ol>
          <li><span>01</span><p>Find the receipt number and exact total.</p></li>
          <li><span>02</span><p>Join or sign in to Dame Rewards.</p></li>
          <li><span>03</span><p>Save the purchase and watch your points land.</p></li>
        </ol>
      </section>

      <section className="dame-claim-builder">
        <div>
          <p className="dame-kicker">Your receipt</p>
          <h2>A little love,<br />saved for later.</h2>
          <p>
            Each completed receipt can be claimed once. Catering deposits and
            refunded amounts do not earn points. Members can save up to three
            receipts per day.
          </p>
          <BeanStateImage state="walking" className="dame-claim-page-bean" decorative />
        </div>
        <ReceiptClaim />
      </section>
      <SiteFooter
        beanState="rewards"
        beanEyebrow="Points saved."
        beanMessage="A little love, kept."
      />
    </main>
  );
}
