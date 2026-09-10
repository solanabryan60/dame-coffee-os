'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import BeanStateImage from '../../components/bean-state';

type Status = 'checking' | 'paid' | 'pending' | 'refunded' | 'refund_pending' | 'cancelled' | 'error';

export default function DepositConfirmation({ requestId }: { requestId: string }) {
  const [status, setStatus] = useState<Status>('checking');
  const [message, setMessage] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let checks = 0;
    setStatus('checking');
    async function check() {
      try {
        if (!requestId) throw new Error('No deposit request was supplied. A payment has not been verified on this page.');
        const response = await fetch(`/api/square/catering-status?request=${encodeURIComponent(requestId)}`, { cache: 'no-store', signal: controller.signal });
        const payload = await response.json() as { status?: Status; error?: string };
        if (!response.ok || !payload.status) throw new Error(payload.error || 'Could not verify your deposit.');
        if (controller.signal.aborted) return;
        if (payload.status === 'pending' && ++checks < 8) {
          timer = setTimeout(() => void check(), 3000);
        } else { setStatus(payload.status); }
      } catch (error) {
        if (!controller.signal.aborted) { setStatus('error'); setMessage(error instanceof Error ? error.message : 'Could not check your payment.'); }
      }
    }
    void check();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [requestId, attempt]);

  const paid = status === 'paid';
  const closed = ['refunded', 'refund_pending', 'cancelled'].includes(status);
  return <section className="dame-catering-complete">
    <div className="dame-catering-complete-copy" aria-live="polite">
      <p className="dame-kicker">{paid ? '$200 deposit received' : status === 'checking' ? 'Back at Dame' : 'Your deposit request'}</p>
      <h1>{paid ? 'Let’s make it a Dame day.' : status === 'checking' ? 'Checking your deposit…' : closed ? 'Your request has an update.' : 'Let’s check before celebrating.'}</h1>
      {paid ? <>
        <p>Your payment is confirmed and your date request is saved. Here’s what happens next.</p>
        <ol className="dame-deposit-next-steps">
          <li><strong>We’ll reach out.</strong><span>Our team will call to confirm availability, your menu, timing, and travel.</span></li>
          <li><strong>We confirm your date together.</strong><span>Your deposit requests the date; the event is not booked until Dame approves the details.</span></li>
          <li><strong>Your final invoice comes later.</strong><span>The $200 goes toward your event total. Dame will send the remaining balance with applicable tax separately.</span></li>
        </ol>
        <div className="dame-deposit-promise"><strong>Your deposit is protected.</strong><p>If Dame cannot fulfill your event, we’ll refund the full $200 and offer other dates or options that may work.</p></div>
      </> : status === 'checking' ? <p>We’re confirming the payment with our checkout provider. This usually takes a moment.</p>
        : closed ? <p>{status === 'refunded' ? 'This deposit has been refunded.' : status === 'refund_pending' ? 'A refund is being reviewed or processed for this deposit.' : 'This request has been cancelled.'} Contact Dame for details or other date options.</p>
          : <p>{message || 'Your payment has not been confirmed yet. If you already paid, do not pay again—check once more or contact Dame with your receipt.'}</p>}
      {requestId ? <p className="dame-request-reference">Request reference: {requestId}</p> : null}
      <div className="dame-actions">
        {(status === 'pending' || status === 'error') && requestId ? <button className="dame-button" type="button" onClick={() => setAttempt((value) => value + 1)}>Check payment again</button> : null}
        <Link className="dame-button" href="/">Return home</Link>
        <a className="dame-button dame-button-outline" href="tel:+19094519307">Call Dame</a>
      </div>
    </div>
    <BeanStateImage state={paid ? 'celebrating' : closed ? 'waving' : 'driving'} className="dame-catering-complete-bean" priority />
  </section>;
}
