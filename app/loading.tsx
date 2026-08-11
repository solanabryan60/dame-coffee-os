import BeanStateImage from './components/bean-state';

export default function Loading() {
  return (
    <main className="dame-loading-screen" aria-live="polite" aria-busy="true">
      <BeanStateImage state="walking" className="dame-loading-bean" priority />
      <p className="dame-kicker">The Bean is on the way</p>
      <div className="dame-loading-track" aria-hidden="true"><i /></div>
      <span>Bringing Dame to you.</span>
    </main>
  );
}
