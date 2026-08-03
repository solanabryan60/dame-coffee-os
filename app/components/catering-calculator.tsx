'use client';

import { FormEvent, useMemo, useState } from 'react';
import {
  calculateCateringEstimateDollars,
  CATERING_ADDITIONAL_DRINK_DOLLARS,
  CATERING_ADDITIONAL_HOUR_DOLLARS,
} from '../lib/catering-pricing';
import GoogleMap from './google-map';

function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CateringCalculator() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [drinks, setDrinks] = useState(100);
  const [hours, setHours] = useState(2);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const estimate = useMemo(
    () => calculateCateringEstimateDollars(drinks, hours),
    [drinks, hours],
  );
  const mapHref = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : '';

  async function requestDate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/square/catering-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          address,
          date,
          startTime,
          drinks,
          hours,
          acceptedTerms,
        }),
      });
      const payload = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (!response.ok || !payload.checkoutUrl) {
        throw new Error(payload.error || 'Deposit checkout is temporarily unavailable.');
      }
      window.location.assign(payload.checkoutUrl);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Deposit checkout is temporarily unavailable.');
      setSubmitting(false);
    }
  }

  return (
    <form className="dame-estimator" onSubmit={requestDate}>
      <div className="dame-estimator-fields">
        <label className="dame-field">
          <span>Your name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
        </label>

        <label className="dame-field">
          <span>Email</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
        </label>

        <label className="dame-field dame-field-wide">
          <span>Phone number</span>
          <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" required />
        </label>

        <label className="dame-field dame-field-wide">
          <span>Where is your event?</span>
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Enter the full event address"
            autoComplete="street-address"
            required
          />
          {mapHref ? (
            <a href={mapHref} target="_blank" rel="noreferrer">Preview this address on Google Maps ↗</a>
          ) : null}
        </label>

        <GoogleMap
          address={address}
          title={address ? `Google Map showing ${address}` : 'Google Map for your event address'}
          className="dame-catering-map"
        />

        <label className="dame-field">
          <span>Event date</span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </label>

        <label className="dame-field">
          <span>Start time</span>
          <input
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            required
          />
        </label>
      </div>

      <div className="dame-slider-block">
        <div>
          <span>How many drinks?</span>
          <strong>{drinks}</strong>
        </div>
        <input
          type="range"
          min="100"
          max="600"
          step="50"
          value={drinks}
          onChange={(event) => setDrinks(Number(event.target.value))}
          aria-label="Number of drinks"
        />
        <div className="dame-range-labels"><span>100 minimum</span><span>600</span></div>
      </div>

      <div className="dame-slider-block">
        <div>
          <span>How long do you need us?</span>
          <strong>{hours} hours</strong>
        </div>
        <input
          type="range"
          min="2"
          max="12"
          step="2"
          value={hours}
          onChange={(event) => setHours(Number(event.target.value))}
          aria-label="Hours of service"
        />
        <div className="dame-range-labels"><span>2 hour minimum</span><span>12 hours</span></div>
      </div>

      <aside className="dame-estimate-card" aria-live="polite">
        <p>Estimated event price</p>
        <strong>{money(estimate)}</strong>
        <span>plus applicable tax</span>
        <ul>
          <li>{drinks} drinks</li>
          <li>{hours} hours of service</li>
          <li>Additional drinks are ${CATERING_ADDITIONAL_DRINK_DOLLARS} each</li>
          <li>Additional service is ${CATERING_ADDITIONAL_HOUR_DOLLARS} per hour</li>
          <li>Standard travel included in the estimate</li>
          <li>Cold brew and matcha service</li>
        </ul>
        <p className="dame-estimate-note">
          We&apos;ll call to confirm availability, travel, menu choices, final price,
          and the remaining balance.
        </p>
      </aside>

      <section className="dame-deposit-card" aria-labelledby="deposit-title">
        <div>
          <p className="dame-kicker">Request your date</p>
          <h3 id="deposit-title">$200 deposit</h3>
          <p>
            The deposit is applied to your final event balance. Your date is requested—not
            confirmed—until Dame calls you and approves the event details.
          </p>
          <p>
            If Dame Coffee cannot fulfill your event, we&apos;ll issue a full refund and offer
            alternative dates or service options that may work.
          </p>
        </div>
        <label className="dame-deposit-consent">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            required
          />
          <span>I understand the $200 payment requests the date and does not confirm the event until Dame calls.</span>
        </label>
      </section>

      <div className="dame-estimator-actions">
        {error ? <p className="dame-checkout-error" role="alert">{error}</p> : null}
        <button className="dame-button" type="submit" disabled={submitting}>
          {submitting ? 'Opening Square…' : 'Pay $200 deposit & request date'}
        </button>
        <a className="dame-button dame-button-outline" href="tel:+19094519307">Call with questions</a>
        <p className="dame-square-note">Secure checkout is handled by Square. Dame never receives your card details.</p>
      </div>
    </form>
  );
}
