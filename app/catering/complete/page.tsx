import Link from 'next/link';
import SiteFooter from '../../components/site-footer';
import SiteHeader from '../../components/site-header';

export default function CateringDepositCompletePage() {
  return (
    <main className="dame-site dame-inner-page">
      <SiteHeader />
      <section className="dame-catering-complete">
        <p className="dame-kicker">Deposit received</p>
        <h1>Your date has been requested.</h1>
        <p>
          Thank you for trusting Dame with your event. We&apos;ll call to confirm availability,
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
      </section>
      <SiteFooter />
    </main>
  );
}
