import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import SiteFooter from '../components/site-footer';
import SiteHeader from '../components/site-header';

export const metadata: Metadata = {
  title: 'Merch',
  description: 'Dame Coffee apparel, coffee, and small pieces of Dame are coming soon.',
};

export default function MerchPage() {
  return (
    <main className="dame-site dame-inner-page dame-merch-page">
      <SiteHeader />
      <section className="dame-merch-coming" aria-labelledby="merch-title">
        <div className="dame-merch-copy">
          <p className="dame-kicker dame-kicker-light">Dame Merch</p>
          <h1 id="merch-title">Made to carry<br /><em>Dame with you.</em></h1>
          <p>
            Apparel, coffee, and small pieces of Dame—made with the same care as every cup.
          </p>
          <div className="dame-merch-status" aria-label="Merch launch status">
            <span aria-hidden="true" />
            Coming soon
          </div>
          <Link className="dame-button dame-button-light" href="/rewards">
            Join rewards for first access
          </Link>
        </div>

        <div className="dame-merch-bean" aria-hidden="true">
          <Image
            src="/assets/bean-transparent.png"
            alt=""
            width={1032}
            height={1112}
            priority
          />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
