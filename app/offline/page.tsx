import Link from 'next/link';
import BeanStateImage from '../components/bean-state';

export default function OfflinePage() {
  return (
    <main className="dame-offline">
      <BeanStateImage state="confused" className="dame-offline-bean" priority />
      <p className="dame-kicker">A tiny pause</p>
      <h1>The Bean lost the signal.</h1>
      <p>Reconnect to see today&apos;s location, order pickup, and check your rewards.</p>
      <Link className="dame-button" href="/app">Try again</Link>
    </main>
  );
}
