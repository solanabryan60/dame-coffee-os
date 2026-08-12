import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Bean Studio',
  description: 'A private preview of the Dame Coffee mascot library.',
  robots: { index: false, follow: false },
};

export default function BeanStudioPage() {
  redirect('/admin/bean-studio');
}
