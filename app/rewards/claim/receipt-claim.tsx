'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
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
      setError('Your receipt is saved here. Join or sign in, then come back to finish claiming the points.');
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

        {!checkingSession && !accessToken ? (
          <p className="dame-claim-account-note">
            New to Dame Rewards? <Link href="/rewards?claim=1#join" onClick={rememberClaim}>Join or sign in</Link>—your receipt details will be waiting here.
          </p>
        ) : (
          <p className="dame-claim-account-note">
            Already saved it? <Link href="/rewards/account">See your rewards account</Link>.
          </p>
        )}
      </form>
    </div>
  );
}
