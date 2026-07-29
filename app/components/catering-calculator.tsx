'use client';

import { FormEvent, useMemo, useState } from 'react';

function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function calculateEstimate(drinks: number, hours: number) {
  const drinkUpgrade = ((drinks - 100) / 50) * 150;
  const timeUpgrade = hours === 2 ? 0 : hours === 4 ? 150 : 150 + ((hours - 4) / 2) * 300;
  return 600 + drinkUpgrade + timeUpgrade;
}

export default function CateringCalculator() {
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [drinks, setDrinks] = useState(100);
  const [hours, setHours] = useState(2);

  const estimate = useMemo(() => calculateEstimate(drinks, hours), [drinks, hours]);
  const mapHref = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : '';

  function requestDate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = encodeURIComponent('Dame Coffee catering date request');
    const body = encodeURIComponent(
      [
        'I would like to request Dame Coffee for an event.',
        '',
        `Address: ${address}`,
        `Date: ${date}`,
        `Start time: ${startTime}`,
        `Drink amount: ${drinks}`,
        `Service time: ${hours} hours`,
        `Website estimate: ${money(estimate)} plus tax`,
        '',
        'Please call me to confirm availability, details, final pricing, and the deposit.',
      ].join('\n'),
    );
    window.location.href = `mailto:info@damecoffeeco.com?subject=${subject}&body=${body}`;
  }

  return (
    <form className="dame-estimator" onSubmit={requestDate}>
      <div className="dame-estimator-fields">
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
          <li>Standard travel included in the estimate</li>
          <li>Cold brew and matcha service</li>
        </ul>
        <p className="dame-estimate-note">
          We&apos;ll call to confirm availability, travel, menu choices, final price,
          and the deposit required to hold your date.
        </p>
      </aside>

      <div className="dame-estimator-actions">
        <button className="dame-button" type="submit">Request this date</button>
        <a className="dame-button dame-button-outline" href="tel:+19094519307">Call with questions</a>
      </div>
    </form>
  );
}
