import type { Metadata } from 'next';
import SiteFooter from '../../components/site-footer';
import SiteHeader from '../../components/site-header';
import RewardsDashboard from './rewards-dashboard';

export const metadata: Metadata = {
  title: 'My Rewards',
  description: 'View your Dame Rewards points, benefits, and member profile.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RewardsAccountPage() {
  return (
    <main className="dame-site dame-inner-page">
      <SiteHeader />
      <RewardsDashboard />
      <SiteFooter beanState={null} />
    </main>
  );
}
