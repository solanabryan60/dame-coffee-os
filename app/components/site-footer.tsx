import Image from 'next/image';
import Link from 'next/link';
import BeanStateImage, { type DameBeanState } from './bean-state';
import SeasonalBean from './seasonal-bean';

type SiteFooterProps = {
  beanState?: DameBeanState | 'seasonal' | null;
  beanEyebrow?: string;
  beanMessage?: string;
};

export default function SiteFooter({
  beanState = 'seasonal',
  beanEyebrow = 'Until next time.',
  beanMessage = 'Dame vida.',
}: SiteFooterProps) {
  return (
    <footer className="dame-footer" id="contact">
      {beanState ? (
        <aside className="dame-footer-bean" aria-label="A page-inspired appearance from the Dame Bean">
          {beanState === 'seasonal' ? (
            <SeasonalBean />
          ) : (
            <BeanStateImage state={beanState} decorative />
          )}
          <p><span>{beanEyebrow}</span>{beanMessage}</p>
        </aside>
      ) : null}

      <div className="dame-footer-brand">
        <Image src="/assets/dame-logo-red.jpg" alt="Dame Coffee" width={954} height={843} />
        <p>Made with culture, unity, and love.</p>
      </div>

      <nav aria-label="Footer navigation">
        <p>Explore</p>
        <Link href="/menu">Menu</Link>
        <Link href="/#today">Find us today</Link>
        <Link href="/catering">Catering</Link>
        <Link href="/rewards">Rewards</Link>
        <Link href="/merch">Merch</Link>
        <Link href="/events">Events</Link>
        <Link href="/about">Our story</Link>
        <Link href="/app">Dame App</Link>
      </nav>

      <div className="dame-footer-contact">
        <p>Talk to us</p>
        <a href="tel:+19094519307">(909) 451-9307</a>
        <a href="mailto:info@damecoffeeco.com">info@damecoffeeco.com</a>
        <a href="https://instagram.com/_dame.coffee_" target="_blank" rel="noreferrer">
          @_dame.coffee_
        </a>
      </div>

      <div className="dame-footer-bottom">
        <span>© {new Date().getFullYear()} Dame Coffee Co.</span>
        <span>Santa Ana · Walnut / Diamond Bar · Venice</span>
        <Link href="/admin/login">Private admin</Link>
      </div>
    </footer>
  );
}
