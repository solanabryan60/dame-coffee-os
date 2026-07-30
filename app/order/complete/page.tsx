import Image from 'next/image';
import Link from 'next/link';
import SiteFooter from '../../components/site-footer';
import SiteHeader from '../../components/site-header';

export default function OrderCompletePage() {
  return (
    <main className="dame-site dame-inner-page">
      <SiteHeader />
      <section className="dame-order-complete">
        <div>
          <p className="dame-kicker">Order received</p>
          <h1>We&apos;re making something good.</h1>
          <p>
            Square will send your receipt. Head to today&apos;s Dame location and ask for
            the pickup name on your order.
          </p>
          <div className="dame-actions">
            <Link className="dame-button" href="/#today">See today&apos;s location</Link>
            <Link className="dame-button dame-button-outline" href="/menu">Back to menu</Link>
          </div>
        </div>
        <Image
          src="/assets/bean.png"
          alt="The Dame Bean celebrating your order"
          width={632}
          height={922}
          priority
        />
      </section>
      <SiteFooter />
    </main>
  );
}
