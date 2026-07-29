'use client';

import { FormEvent, useState } from 'react';

export default function RewardsSignup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = encodeURIComponent('Join Dame Rewards');
    const body = encodeURIComponent(
      `Please add me to the Dame Rewards launch list.\n\nName: ${name}\nEmail: ${email}`,
    );
    window.location.href = `mailto:info@damecoffeeco.com?subject=${subject}&body=${body}`;
  }

  return (
    <form className="dame-rewards-form" onSubmit={submit}>
      <div>
        <label htmlFor="rewards-name">First name</label>
        <input
          id="rewards-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="given-name"
          placeholder="Your name"
          required
        />
      </div>
      <div>
        <label htmlFor="rewards-email">Email</label>
        <input
          id="rewards-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </div>
      <button className="dame-button" type="submit">Join the launch list</button>
      <p>
        Rewards are launching soon. This signs you up for the first announcement;
        no points are active yet.
      </p>
    </form>
  );
}
