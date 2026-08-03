import SiteFooter from '../../components/site-footer';
import SiteHeader from '../../components/site-header';
import PickupTracker from './pickup-tracker';

export default async function OrderCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; key?: string }>;
}) {
  const query = await searchParams;

  return (
    <main className="dame-site dame-inner-page">
      <SiteHeader />
      <PickupTracker orderId={query.order ?? ''} trackingKey={query.key ?? ''} />
      <SiteFooter />
    </main>
  );
}
