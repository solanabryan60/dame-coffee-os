import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import BeanStateImage from '../components/bean-state';
import SiteFooter from '../components/site-footer';
import SiteHeader from '../components/site-header';
import { missionStatement } from '../site-config';

export const metadata: Metadata = {
  title: 'Our Story',
  description: 'Meet Dame Coffee: a mobile cold brew and matcha bar rooted in Mexican culture, community, and care.',
};

const values = [
  {
    number: '01',
    title: 'Our roots, always.',
    copy: 'Mexican culture guides our flavors, our hospitality, and every detail.',
  },
  {
    number: '02',
    title: 'Made with care.',
    copy: 'Our cold brew steeps for 20 hours for a deeper, smoother cup. Our matcha is whisked until silky and balanced.',
  },
  {
    number: '03',
    title: 'Made to gather.',
    copy: 'Markets, neighborhoods, and celebrations. Wherever people come together, Dame feels at home.',
  },
];

export default function AboutPage() {
  return (
    <main className="dame-site dame-about-page">
      <SiteHeader overlay />

      <section className="dame-about-hero" aria-labelledby="about-title">
        <Image
          src="/assets/cart-team.jpg"
          alt="The Dame Coffee team serving from the mobile cart"
          fill
          priority
          sizes="100vw"
        />
        <div className="dame-about-hero-shade" />
        <div>
          <p className="dame-kicker dame-kicker-light">Our story · Nuestra historia</p>
          <h1 id="about-title">A little coffee.<br /><em>A lot of cultura.</em></h1>
        </div>
      </section>

      <section className="dame-about-intro" aria-labelledby="about-intro-title">
        <p className="dame-kicker">Dame Coffee · Dame Vida</p>
        <div>
          <h2 id="about-intro-title">Dame Coffee, made to move.</h2>
          <p>
            We are a mobile cold brew and matcha bar serving Southern California.
            Our Mexican roots shape the flavors, the hospitality, and the feeling.
          </p>
          <p lang="es">Una barra móvil de cold brew y matcha, hecha con raíces mexicanas.</p>
        </div>
        <BeanStateImage state="waving" className="dame-about-page-bean" decorative priority />
      </section>

      <section className="dame-about-mission" aria-labelledby="mission-title">
        <div className="dame-about-mission-photo">
          <Image
            src="/assets/cart-market.jpg"
            alt="The Dame Coffee cart at a community market"
            fill
            sizes="(max-width: 820px) 100vw, 45vw"
          />
        </div>
        <div>
          <p className="dame-kicker">Our full mission</p>
          <h2 id="mission-title">{missionStatement}</h2>
          <p>Made with culture, unity, and love.</p>
        </div>
      </section>

      <section className="dame-about-values" aria-labelledby="values-title">
        <header>
          <p className="dame-kicker">What guides us · Lo que nos guía</p>
          <h2 id="values-title">Simple things, done well.</h2>
        </header>
        <div>
          {values.map((value) => (
            <article key={value.number}>
              <span>{value.number}</span>
              <h3>{value.title}</h3>
              <p>{value.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dame-about-gallery" aria-label="Dame Coffee in the community">
        <div><Image src="/assets/cart-venice.jpg" alt="A Dame Coffee drink at Venice Beach" fill sizes="50vw" /></div>
        <div><Image src="/assets/cart-team.jpg" alt="Dame Coffee serving guests from the cart" fill sizes="50vw" /></div>
      </section>

      <section className="dame-about-cta">
        <p className="dame-kicker">Come say hello</p>
        <h2>Find Dame.<br /><em>Feel at home.</em></h2>
        <div className="dame-actions">
          <Link className="dame-button dame-button-light" href="/#today">See today’s location</Link>
          <Link className="dame-inline-link dame-inline-link-light" href="/menu">View the menu <span>↗</span></Link>
        </div>
      </section>

      <SiteFooter
        beanState="walking"
        beanEyebrow="Come as you are."
        beanMessage="There’s room for you."
      />
    </main>
  );
}
