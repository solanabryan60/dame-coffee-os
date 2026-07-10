'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

const menu = [
  { name: 'Mexicano', price: 7, category: 'Specialty Lattes', detail: 'Cinnamon and sugar cane syrup with milk, served with matcha or cold brew.' },
  { name: 'Brown Bear', price: 7, category: 'Specialty Lattes', detail: 'Brown sugar honey syrup with milk, served with matcha or cold brew.' },
  { name: 'Sugar Free Bear', price: 7, category: 'Specialty Lattes', detail: 'Sugar-free vanilla cinnamon with milk, served with matcha or cold brew.' },
  { name: 'Mellow Marsh', price: 8, category: 'Cold Foam Collection', detail: 'Marshmallow fluff, vanilla syrup, milk, matcha or cold brew, finished with cold foam.' },
  { name: 'Cold Brew', price: 6, category: 'Classics', detail: 'Our 16-hour steeped cold brew.' },
  { name: 'Matcha Latte', price: 6.5, category: 'Classics', detail: 'Matcha with simple syrup and milk.' }
];

const mission = `A nurturing communal space with intentionality towards quality. That stays true to Mexican culture through visual beauty. While being at service to the community so that all customers feel valued and at home.`;

function cateringTotal(drinks: number, hours: number) {
  const drinkCharge = 600 + Math.max(0, (drinks - 100) / 50) * 150;
  let timeCharge = 0;
  if (hours > 2 && hours <= 4) timeCharge = 150;
  if (hours > 4) timeCharge = 150 + ((hours - 4) / 2) * 300;
  return drinkCharge + timeCharge;
}

export default function Home() {
  const [drinks, setDrinks] = useState(100);
  const [hours, setHours] = useState(2);
  const [location, setLocation] = useState('Venice — Ocean Front Walk near The Waterfront');
  const total = useMemo(() => cateringTotal(drinks, hours), [drinks, hours]);

  return (
    <main>
      <header className="nav">
        <Image src="/assets/logo.png" alt="Dame Coffee" width={190} height={90} className="wordmark" />
        <nav>
          <a href="#menu">Menu</a>
          <a href="#where">Where We Are</a>
          <a href="#catering">Catering</a>
          <a href="#rewards">Rewards</a>
        </nav>
        <button className="pill solid">Order pickup</button>
      </header>

      <section className="hero">
        <div className="hero-media" aria-label="Dame Coffee cart in action">
          <Image src="/assets/cart-venice.jpg" alt="Dame Coffee cart at Venice Beach" fill priority className="cover" />
          <div className="shade" />
        </div>
        <div className="hero-copy">
          <p className="eyebrow">DAME COFFEE · DAME VIDA</p>
          <h1>We bring a beautiful coffee experience wherever people are.</h1>
          <p>Matcha, cold brew, culture, unity, and love — served from our mobile cart across Southern California.</p>
          <div className="actions">
            <button className="pill solid">Order ahead</button>
            <a href="#where" className="pill ghost">Find us today</a>
          </div>
        </div>
      </section>

      <section id="where" className="live section">
        <div>
          <p className="eyebrow"><span className="dot" /> WE&apos;RE BREWING</p>
          <h2>{location}</h2>
          <p>Open 6:00 AM–4:00 PM · Mobile ordering available while the cart is active.</p>
          <div className="actions">
            <button className="pill solid">Order at this location</button>
            <button className="pill ghost">Open map</button>
          </div>
        </div>
        <div className="location-card">
          <label>Preview location</label>
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            <option>Venice — Ocean Front Walk near The Waterfront</option>
            <option>Walnut / Diamond Bar</option>
            <option>Santa Ana</option>
          </select>
          <p className="small">The final dashboard will let you update this from your phone and turn ordering on or off.</p>
        </div>
      </section>

      <section id="menu" className="section">
        <div className="section-head">
          <div><p className="eyebrow">THE MENU</p><h2>Simple choices. Intentional drinks.</h2></div>
          <p>Whole milk included. Almond or oat milk +$1. Cold foam +$1.</p>
        </div>
        <div className="menu-grid">
          {menu.map((item) => (
            <article className="menu-card" key={item.name}>
              <span>{item.category}</span>
              <h3>{item.name}</h3>
              <p>{item.detail}</p>
              <div><strong>${item.price.toFixed(2)}</strong><button>Add</button></div>
            </article>
          ))}
        </div>
      </section>

      <section className="quote-band"><p>“Good coffee finds good people.”</p></section>

      <section className="mission section">
        <div className="mission-art"><Image src="/assets/bean.png" alt="Dame Coffee bean mascot" fill className="contain" /></div>
        <div><p className="eyebrow">OUR FULL MISSION</p><h2>{mission}</h2><p>Made with culture, unity, and love.</p></div>
      </section>

      <section id="catering" className="section catering">
        <div className="section-head">
          <div><p className="eyebrow">BUILD YOUR EVENT</p><h2>Plan drinks without waiting for a quote.</h2></div>
          <p>Travel is built into the estimate. Final details and price are confirmed by phone.</p>
        </div>
        <div className="builder">
          <div className="controls">
            <label>Event address<input placeholder="Start typing an address" /></label>
            <div className="map-placeholder">Google Maps preview</div>
            <label>Event date<input type="date" /></label>
            <label>Number of drinks <strong>{drinks}</strong><input type="range" min="100" max="600" step="50" value={drinks} onChange={(e) => setDrinks(Number(e.target.value))} /></label>
            <label>Service time <strong>{hours} hours</strong><input type="range" min="2" max="12" step="2" value={hours} onChange={(e) => setHours(Number(e.target.value))} /></label>
          </div>
          <aside className="estimate">
            <Image src="/assets/bean.png" alt="Bean mascot" width={120} height={150} />
            <p>Estimated event total</p>
            <h3>${total.toLocaleString()} <small>+ tax</small></h3>
            <ul>
              <li>{drinks} drinks</li>
              <li>{hours} hours of service</li>
              <li>Travel included in estimate</li>
              <li>100-drink and 2-hour minimum</li>
            </ul>
            <button className="pill solid full">Reserve date with deposit</button>
            <a className="pill ghost full" href="tel:+19094519307">Call now with questions</a>
            <p className="fine">We&apos;ll call to confirm the menu, staffing, availability, travel details, and final price. Events may extend on site for an additional fee.</p>
          </aside>
        </div>
      </section>

      <section id="rewards" className="section rewards">
        <div><p className="eyebrow">DAME REWARDS</p><h2>Come for the drink. Stay part of the story.</h2><p>Customer accounts, points on every order, birthday rewards, Founding Member status, favorites, and order history.</p><button className="pill solid">Join the founding members</button></div>
        <div className="reward-card"><span>FOUNDING MEMBER · 2026</span><h3>1,245 points</h3><p>255 points until your next reward.</p><div className="progress"><i /></div><Image src="/assets/bean.png" alt="Dame Bean" width={100} height={130} /></div>
      </section>

      <section className="gallery section">
        <Image src="/assets/cart-market.jpg" alt="Dame Coffee market cart" width={800} height={1000} />
        <Image src="/assets/cart-team.jpg" alt="Dame Coffee team serving" width={800} height={1000} />
      </section>

      <footer>
        <Image src="/assets/logo.png" alt="Dame Coffee" width={230} height={100} />
        <div><a href="tel:+19094519307">(909) 451-9307</a><a href="mailto:info@damecoffeeco.com">info@damecoffeeco.com</a><a href="https://instagram.com/_dame.coffee_">@_dame.coffee_</a></div>
        <p>Santa Ana · Walnut / Diamond Bar · Venice</p>
      </footer>
    </main>
  );
}
