import Link from 'next/link';
import BeanStateImage from '../../components/bean-state';
import SiteFooter from '../../components/site-footer';
import SiteHeader from '../../components/site-header';

export default function CateringDepositCompletePage() {
  return (
    <main className="dame-site dame-inner-page">
      <SiteHeader />
      <section className="dame-catering-complete">
        <div className="dame-catering-complete-copy">
          <p className="dame-kicker">Deposit received</p>
          <h1>We&apos;re packing up.</h1>
          <p>
            Your date has been requested. We&apos;ll call soon to confirm availability,
            your menu, travel, timing, final price, and the remaining balance.
          </p>
          <div className="dame-deposit-promise">
            <strong>Your $200 deposit is protected.</strong>
            <p>
              If Dame Coffee cannot fulfill your event, we&apos;ll refund the deposit in full and
              contact you with alternative dates or service options that may work.
            </p>
          </div>
          <div className="dame-actions">
            <Link className="dame-button" href="/">Return home</Link>
            <a className="dame-button dame-button-outline" href="tel:+19094519307">Call Dame</a>
          </div>
        </div>
        <BeanStateImage state="driving" className="dame-catering-complete-bean" priority />
      </section>
      <SiteFooter />
    </main>
  );
}
