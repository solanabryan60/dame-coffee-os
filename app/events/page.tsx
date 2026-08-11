'use client';

import { useEffect, useState } from 'react';
import NotificationOptIn from '../components/notification-opt-in';
import SiteFooter from '../components/site-footer';
import SiteHeader from '../components/site-header';
import UpcomingEvents from '../components/upcoming-events';
import { readUpcomingEvents, type UpcomingEvent } from '../lib/supabase-rest';

export default function EventsPage() {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    readUpcomingEvents()
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <main className="dame-site dame-inner-page dame-events-page">
      <SiteHeader />
      <section className="dame-events-hero" aria-labelledby="events-title">
        <p className="dame-kicker">Follow the cart</p>
        <h1 id="events-title">Where Dame<br /><em>is headed next.</em></h1>
        <p>Markets, pop-ups, and the places we cannot wait to serve.</p>
      </section>
      {events.length ? (
        <UpcomingEvents events={events} />
      ) : loaded ? (
        <section className="dame-events-empty">
          <p className="dame-kicker">No dates posted yet</p>
          <h2>The next stop is brewing.</h2>
          <p>Turn on notifications and we’ll let you know when a new event is added.</p>
        </section>
      ) : null}
      <NotificationOptIn />
      <SiteFooter
        beanState="binoculars"
        beanEyebrow="Follow the cart."
        beanMessage="See you at the next stop."
      />
    </main>
  );
}
