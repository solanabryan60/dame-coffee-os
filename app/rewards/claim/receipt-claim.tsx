'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { getCustomerSession } from '../../lib/customer-session';

const PENDING_CLAIM_KEY = 'dame_pending_receipt_claim';

type PendingClaim = {
  receiptNumber: string;
  purchaseDate: string;
  total: string;
};

function today() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export default function ReceiptClaim() {
  const [receiptNumber, setReceiptNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(today());
  const [total, setTotal] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [accountPrompt, setAccountPrompt] = useState('');
  const accountGateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(PENDING_CLAIM_KEY);
    if (saved) {
      try {
        const claim = JSON.parse(saved) as PendingClaim;
        setReceiptNumber(claim.receiptNumber ?? '');
        setPurchaseDate(claim.purchaseDate || today());
        setTotal(claim.total ?? '');
      } catch {
        window.sessionStorage.removeItem(PENDING_CLAIM_KEY);
      }
    }

    void getCustomerSession().then((session) => {
      setAccessToken(session?.access_token ?? '');
      setCheckingSession(false);
    });
  }, []);

  function rememberClaim() {
    window.sessionStorage.setItem(PENDING_CLAIM_KEY, JSON.stringify({
      receiptNumber,
      purchaseDate,
      total,
    } satisfies PendingClaim));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!accessToken) {
      rememberClaim();
      setAccountPrompt('Create your Dame Rewards account or sign in before claiming these points. Your receipt details are saved here for you.');
      window.requestAnimationFrame(() => {
        accountGateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        accountGateRef.current?.focus({ preventScroll: true });
      });
      return;
    }

    const parsedTotal = Number.parseFloat(total);
    if (!Number.isFinite(parsedTotal) || parsedTotal <= 0) {
      setError('Enter the exact total printed on your receipt.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/rewards/claim-receipt', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiptNumber,
          purchaseDate,
          totalCents: Math.round(parsedTotal * 100),
        }),
      });
      const payload = (await response.json()) as {
        duplicate?: boolean;
        pointsAdded?: number;
        pointsBalance?: number;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || 'We could not save those points.');

      window.sessionStorage.removeItem(PENDING_CLAIM_KEY);
      if (payload.duplicate) {
        setMessage('These points are already safe in your Dame Rewards account.');
      } else {
        setMessage(`${payload.pointsAdded ?? 0} points added. Your Dame balance is now ${payload.pointsBalance ?? 0}.`);
      }
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : 'We could not save those points.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dame-receipt-claim">
      <div
        ref={accountGateRef}
        className={`dame-claim-account-gate${accessToken ? ' is-signed-in' : ''}${accountPrompt ? ' needs-account' : ''}`}
        tabIndex={-1}
      >
        {checkingSession ? (
          <>
            <p className="dame-kicker">Dame Rewards account</p>
            <h3>Checking your account…</h3>
          </>
        ) : accessToken ? (
          <>
            <p className="dame-kicker">Account ready</p>
            <h3>You&apos;re signed in.</h3>
            <p>Your receipt points will be saved to your Dame Rewards account.</p>
          </>
        ) : (
          <>
            <p className="dame-kicker">First, your account</p>
            <h3>Keep your points with Dame.</h3>
            <p>Sign in or create an account before saving the purchase below.</p>
            {accountPrompt ? <p className="dame-claim-gate-alert" role="alert">{accountPrompt}</p> : null}
            <Link
              className="dame-button dame-claim-account-button"
              href="/rewards?claim=1#join"
              onClick={rememberClaim}
            >
              Sign in or sign up
            </Link>
          </>
        )}
      </div>

      <form onSubmit={submit}>
        <label>
          <span>Receipt number</span>
          <input
            value={receiptNumber}
            onChange={(event) => setReceiptNumber(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32))}
            placeholder="The code printed on your receipt"
            autoCapitalize="characters"
            maxLength={32}
            required
          />
        </label>
        <label>
          <span>Purchase date</span>
          <input
            type="date"
            value={purchaseDate}
            onChange={(event) => setPurchaseDate(event.target.value)}
            max={today()}
            required
          />
        </label>
        <label>
          <span>Exact receipt total</span>
          <div className="dame-money-input">
            <b>$</b>
            <input
              value={total}
              onChange={(event) => setTotal(event.target.value.replace(/[^0-9.]/g, '').slice(0, 8))}
              placeholder="0.00"
              inputMode="decimal"
              required
            />
          </div>
          <small>Include tax and tip exactly as shown.</small>
        </label>

        {message ? <p className="dame-rewards-success" role="status">{message}</p> : null}
        {error ? <p className="dame-checkout-error" role="alert">{error}</p> : null}

        <button className="dame-button" type="submit" disabled={submitting || checkingSession}>
          {checkingSession ? 'Checking your account…' : submitting ? 'Saving your points…' : 'Save my points'}
        </button>

        {!checkingSession && accessToken ? (
          <p className="dame-claim-account-note">
            Already saved it? <Link href="/rewards/account">See your rewards account</Link>.
          </p>
        ) : null}
      </form>
    </div>
  );
}
