import Link from 'next/link';
import BeanStateImage from './components/bean-state';

export default function NotFound() {
  return (
    <main className="not-found-page">
      <BeanStateImage state="confused" className="dame-not-found-bean" priority />
      <p className="eyebrow">404 · PAGE NOT FOUND</p>
      <h1>Looks like this page wandered off.</h1>
      <p>The Bean checked everywhere. Let&apos;s get you back to the coffee.</p>
      <Link href="/" className="pill solid">Return home</Link>
    </main>
  );
}
