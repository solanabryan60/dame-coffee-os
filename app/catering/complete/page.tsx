import type { Metadata } from 'next';
import SiteFooter from '../../components/site-footer';
import SiteHeader from '../../components/site-header';
import DepositConfirmation from './deposit-confirmation';

export const metadata: Metadata = { title: 'Your catering request', robots: { index: false, follow: false }, referrer: 'no-referrer' };

export default async function CateringDepositCompletePage({ searchParams }: { searchParams: Promise<{ request?: string }> }) {
  const { request } = await searchParams;
  return (
    <main className="dame-site dame-inner-page">
      <SiteHeader />
      <DepositConfirmation requestId={request || ''} />
      <SiteFooter beanState={null} />
    </main>
  );
}
