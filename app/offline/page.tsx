import Image from 'next/image';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <main className="dame-offline">
      <Image src="/dame-icon" alt="Dame Coffee" width={180} height={180} priority unoptimized />
      <p className="dame-kicker">A tiny pause</p>
      <h1>The Bean lost the signal.</h1>
      <p>Reconnect to see today&apos;s location, order pickup, and check your rewards.</p>
      <Link className="dame-button" href="/app">Try again</Link>
    </main>
  );
}
