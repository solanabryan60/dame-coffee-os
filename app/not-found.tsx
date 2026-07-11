import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="not-found-page">
      <Image src="/assets/bean.png" alt="Dame Bean looking for the missing page" width={210} height={260} />
      <p className="eyebrow">404 · PAGE NOT FOUND</p>
      <h1>Looks like this page wandered off.</h1>
      <p>The Bean checked everywhere. Let&apos;s get you back to the coffee.</p>
      <Link href="/" className="pill solid">Return home</Link>
    </main>
  );
}
