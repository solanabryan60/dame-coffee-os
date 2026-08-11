import type { Metadata } from 'next';
import Link from 'next/link';
import BeanStudio from './bean-studio';

export const metadata: Metadata = {
  title: 'Bean Studio',
  description: 'A private preview of the Dame Coffee mascot library.',
  robots: { index: false, follow: false },
};

export default function BeanStudioPage() {
  return (
    <>
      <Link className="dame-bean-studio-back" href="/">← Back to Dame Coffee</Link>
      <BeanStudio />
    </>
  );
}
