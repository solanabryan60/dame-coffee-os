import type { UpcomingEvent } from '../lib/supabase-rest';

function eventDateLabel(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}

function timeLabel(value: string | null) {
  if (!value) return '';
  const [hour, minute] = value.split(':').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(2026, 0, 1, hour, minute));
}

export default function UpcomingEvents({ events, compact = false }: { events: UpcomingEvent[]; compact?: boolean }) {
  if (!events.length) return null;

  return (
    <section className={`dame-upcoming-events ${compact ? 'is-compact' : ''}`} aria-labelledby={`upcoming-events-${compact ? 'app' : 'site'}`}>
      <header>
        <div>
          <p className="dame-kicker">Meet us out there</p>
          <h2 id={`upcoming-events-${compact ? 'app' : 'site'}`}>Upcoming events.</h2>
        </div>
        <p>Markets, pop-ups, and the special places Dame is headed next.</p>
      </header>
      <div className="dame-event-list">
        {events.map((event) => {
          const start = timeLabel(event.start_time);
          const end = timeLabel(event.end_time);
          return (
            <article key={event.id}>
              <time dateTime={event.event_date}>{eventDateLabel(event.event_date)}</time>
              <div>
                <h3>{event.title}</h3>
                <p>{event.address}</p>
                {event.details ? <small>{event.details}</small> : null}
              </div>
              <div className="dame-event-meta">
                {start ? <span>{start}{end ? `–${end}` : ''}</span> : null}
                {event.maps_url ? (
                  <a href={event.maps_url} target="_blank" rel="noreferrer">Directions <span>↗</span></a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
