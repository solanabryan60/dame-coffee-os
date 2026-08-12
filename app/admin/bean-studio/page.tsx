import type { Metadata } from 'next';
import AdminBeanStudio from './admin-bean-studio';

export const metadata: Metadata = {
  title: 'Bean Studio · Admin',
  description: 'Review the private Dame Coffee mascot library.',
  robots: { index: false, follow: false },
};

export default function AdminBeanStudioPage() {
  return <AdminBeanStudio />;
}
