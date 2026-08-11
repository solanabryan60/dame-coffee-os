import BeanStateImage from './components/bean-state';

export default function Loading() {
  return (
    <main className="dame-loading-screen" aria-live="polite" aria-busy="true">
      <div className="dame-loading-bean-stage">
        <BeanStateImage state="loading-start" className="dame-loading-bean" priority />
        <BeanStateImage state="loading-sip" className="dame-loading-bean" decorative />
        <BeanStateImage state="loading-ready" className="dame-loading-bean" decorative />
      </div>
      <p className="dame-kicker">The Bean is brewing your page</p>
      <div className="dame-loading-track" aria-hidden="true"><i /></div>
      <span>Arriving. Sipping. Ready.</span>
    </main>
  );
}
