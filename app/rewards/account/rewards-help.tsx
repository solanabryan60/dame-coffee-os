import Link from 'next/link';
import BeanStateImage from '../../components/bean-state';

const questions = [
  ['How do I earn points?', 'Earn 10 points for each eligible $1 spent. Sign in before ordering online, or save an in-person receipt to your account. Taxes, tips, and refunded amounts do not earn points. Eligible promotions may earn more.'],
  ['I ordered at the cart. Can I still get points?', 'Yes. Open Save an in-person receipt and enter the receipt code, date, and total. We check the purchase against our payment records. A receipt can only be claimed once, and you can claim up to three receipts per day.'],
  ['How do I use a reward?', 'Open Claim rewards to see every reward and its point cost. When you have enough points, choose Use my points. Show your one-time code at the Dame cart within 24 hours. Please check that the item is available before redeeming.'],
  ['What if I do not use my reward code?', 'You can cancel an unused code from your account to return the points. Unused codes expire after 24 hours; the points return when expired rewards are processed. A code that has already been used cannot be cancelled.'],
  ['How do referrals work?', 'Share your referral link or code. Your friend enters it when joining and completes their first eligible purchase of at least $5. They earn 250 bonus points and you earn 500, up to ten successful referrals each month.'],
  ['What about birthday rewards?', 'Save your birthday in My account so you can qualify for a birthday reward. Any birthday points awarded will appear in your recent activity.'],
  ['Why have my points not appeared?', 'Payment must finish before points are added. Tap Refresh points after a moment. For a purchase at the cart, make sure you have saved your receipt. Refunds can reduce points. If something still looks wrong, contact Dame with your receipt—never send your password.'],
  ['Where are my past orders and catering requests?', 'Open Orders & favorites. Orders and catering requests made while signed in appear there, along with your saved menu favorites. A catering deposit requests a date; it does not confirm availability.'],
  ['How do I change my details or password?', 'Edit your name, phone, birthday, and email-update preference in My account, then choose Save profile. To reset your password, sign out and choose Forgot your password? on the sign-in form.'],
];

export default function RewardsHelp() {
  return <section className="dame-rewards-guide">
    <header className="dame-rewards-guide-hero">
      <div>
        <p className="dame-kicker">A little more Dame</p>
        <h2>Earn. Choose.<br /><em>Enjoy.</em></h2>
        <p>Your points, your favorites, and your next treat—all kept together.</p>
      </div>
      <BeanStateImage state="binoculars" className="dame-rewards-guide-bean" decorative />
    </header>
    <div className="dame-rewards-steps">
      <article><span>01</span><h3>Make it yours</h3><p>Sign in when ordering, or save your receipt after visiting the cart.</p></article>
      <article><span>02</span><h3>Watch it grow</h3><p>Earn 10 points per eligible dollar. Your balance and next reward stay right here.</p></article>
      <article><span>03</span><h3>Treat yourself</h3><p>Choose a reward and show your one-time code to our team.</p></article>
    </div>
    <Link className="dame-button" href="/rewards/claim">Save an in-person receipt</Link>
    <div className="dame-rewards-faq-heading">
      <p className="dame-kicker">Questions, answered</p>
      <h2>Good to know.</h2>
    </div>
    <div className="dame-rewards-faq-list">
      {questions.map(([question, answer], index) => <details key={question}><summary><span>{String(index + 1).padStart(2, '0')}</span>{question}</summary><p>{answer}</p></details>)}
    </div>
    <p className="dame-rewards-contact">Still need a hand? <a href="mailto:info@damecoffeeco.com">Email Dame</a> or <a href="tel:+19094519307">call (909) 451-9307</a>.</p>
  </section>;
}
