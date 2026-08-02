import type { Metadata } from 'next';
import DameAppHome from './dame-app-home';

export const metadata: Metadata = {
  title: 'Dame App',
  description: 'Your Dame location, pickup ordering, menu, and rewards in one place.',
};

export default function DameAppPage() {
  return <DameAppHome />;
}
