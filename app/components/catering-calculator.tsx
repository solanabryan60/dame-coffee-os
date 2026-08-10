'use client';

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import { calculateCateringEstimateDollars } from '../lib/catering-pricing';
import { getCustomerSession } from '../lib/customer-session';
import GoogleMap from './google-map';

type AddressSuggestion = {
  placeId: string;
  fullText: string;
  mainText: string;
  secondaryText: string;
};

function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CateringCalculator() {
  const addressListId = useId();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [eventSetting, setEventSetting] = useState<'indoor' | 'outdoor' | 'both' | 'unsure'>('outdoor');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [drinks, setDrinks] = useState(100);
  const [hours, setHours] = useState(2);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [addressFocused, setAddressFocused] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressSearchLoading, setAddressSearchLoading] = useState(false);
  const [highlightedAddress, setHighlightedAddress] = useState(-1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const estimate = useMemo(
    () => calculateCateringEstimateDollars(drinks, hours),
    [drinks, hours],
  );
  const mapHref = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : '';

  useEffect(() => {
    const input = address.trim();
    if (!addressFocused || input.length < 4) {
      setAddressSuggestions([]);
      setAddressSearchLoading(false);
      setHighlightedAddress(-1);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setAddressSearchLoading(true);
      try {
        const response = await fetch(
          `/api/places/autocomplete?input=${encodeURIComponent(input)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as { suggestions?: AddressSuggestion[] };
        setAddressSuggestions(response.ok ? (payload.suggestions ?? []) : []);
        setHighlightedAddress(-1);
      } catch (searchError) {
        if ((searchError as { name?: string }).name !== 'AbortError') {
          setAddressSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) setAddressSearchLoading(false);
      }
    }, 320);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [address, addressFocused]);

  function chooseAddress(suggestion: AddressSuggestion) {
    setAddress(suggestion.fullText);
    setAddressSuggestions([]);
    setAddressFocused(false);
    setHighlightedAddress(-1);
  }

  function handleAddressKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!addressSuggestions.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedAddress((current) =>
        current >= addressSuggestions.length - 1 ? 0 : current + 1,
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedAddress((current) =>
        current <= 0 ? addressSuggestions.length - 1 : current - 1,
      );
    } else if (event.key === 'Enter' && highlightedAddress >= 0) {
      event.preventDefault();
      chooseAddress(addressSuggestions[highlightedAddress]);
    } else if (event.key === 'Escape') {
      setAddressSuggestions([]);
      setHighlightedAddress(-1);
    }
  }

  async function requestDate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const session = await getCustomerSession();
      const response = await fetch('/api/square/catering-deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          company,
          guestCount: guestCount ? Number(guestCount) : null,
          eventSetting,
          budgetDollars: budget ? Number(budget) : null,
          notes,
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

        <label className="dame-field">
          <span>Company or organization · optional</span>
          <input value={company} onChange={(event) => setCompany(event.target.value)} autoComplete="organization" maxLength={160} />
        </label>

        <label className="dame-field">
          <span>Estimated guests · optional</span>
          <input type="number" min="1" max="5000" inputMode="numeric" value={guestCount} onChange={(event) => setGuestCount(event.target.value)} placeholder="150" />
        </label>

        <div className="dame-field dame-field-wide">
          <label htmlFor="dame-event-address">Where is your event?</label>
          <div
            className="dame-address-autocomplete"
            onFocus={() => setAddressFocused(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setAddressFocused(false);
              }
            }}
          >
            <input
              id="dame-event-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              onKeyDown={handleAddressKeyDown}
              placeholder="Start typing the event address"
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={addressFocused && (addressSearchLoading || addressSuggestions.length > 0)}
              aria-controls={addressListId}
              aria-activedescendant={highlightedAddress >= 0 ? `${addressListId}-${highlightedAddress}` : undefined}
              aria-describedby="dame-address-help"
              required
            />
            {addressFocused && (addressSearchLoading || addressSuggestions.length > 0) ? (
              <div id={addressListId} className="dame-address-suggestions" role="listbox">
                {addressSearchLoading ? (
                  <p className="dame-address-loading">Finding addresses…</p>
                ) : null}
                {addressSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.placeId}
                    id={`${addressListId}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={highlightedAddress === index}
                    className={highlightedAddress === index ? 'is-highlighted' : ''}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseAddress(suggestion)}
                  >
                    <strong>{suggestion.mainText}</strong>
                    <span>{suggestion.secondaryText}</span>
                  </button>
                ))}
                <span className="dame-address-attribution">Powered by Google</span>
              </div>
            ) : null}
          </div>
          <small id="dame-address-help">Choose a suggestion to fill in the complete address.</small>
          {mapHref ? (
            <a href={mapHref} target="_blank" rel="noreferrer">Preview this address on Google Maps ↗</a>
          ) : null}
        </div>

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

        <label className="dame-field">
          <span>Event setting</span>
          <select value={eventSetting} onChange={(event) => setEventSetting(event.target.value as typeof eventSetting)}>
            <option value="outdoor">Outdoor</option>
            <option value="indoor">Indoor</option>
            <option value="both">Indoor and outdoor</option>
            <option value="unsure">Not sure yet</option>
          </select>
        </label>

        <label className="dame-field">
          <span>Budget · optional</span>
          <div className="dame-money-input"><b>$</b><input type="number" min="0" max="1000000" step="50" inputMode="numeric" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder={String(estimate)} /></div>
        </label>

        <label className="dame-field dame-field-wide">
          <span>Anything we should know? · optional</span>
          <textarea rows={4} maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Venue access, event type, timing, or anything that will help us prepare." />
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
