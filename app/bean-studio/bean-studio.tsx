'use client';

import { useState } from 'react';
import BeanStateImage, {
  beanCopy,
  beanStateGroups,
  type DameBeanState,
} from '../components/bean-state';

type BeanGroup = keyof typeof beanStateGroups;

const groupLabels: Record<BeanGroup, string> = {
  moments: 'Story moments',
  utility: 'Useful poses',
  seasons: 'Seasons',
  holidays: 'Holidays',
};

function stateLabel(state: DameBeanState) {
  return state
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function BeanStudio() {
  const [group, setGroup] = useState<BeanGroup>('moments');
  const [selected, setSelected] = useState<DameBeanState>('walking');
  const [replayKey, setReplayKey] = useState(0);
  const states = beanStateGroups[group];

  function changeGroup(nextGroup: BeanGroup) {
    setGroup(nextGroup);
    setSelected(beanStateGroups[nextGroup][0]);
  }

  return (
    <div className="dame-bean-studio">
      <header className="dame-bean-studio-header">
        <p className="dame-kicker">Private brand room</p>
        <h1>Meet every<br /><em>Dame Bean.</em></h1>
        <p>
          A private place to review the mascot. Customers only see a Bean when the moment calls for one.
        </p>
      </header>

      <section className="dame-bean-studio-showcase" aria-labelledby="selected-bean-title">
        <div className="dame-bean-studio-portrait">
          <BeanStateImage state={selected} priority />
        </div>
        <div>
          <p className="dame-kicker">Selected pose</p>
          <h2 id="selected-bean-title">{stateLabel(selected)}</h2>
          <p>{beanCopy[selected].alt}.</p>
          <p className="dame-bean-studio-note">
            This pose appears only when it supports a status, celebration, season, or helpful message.
          </p>
        </div>
      </section>

      <section className="dame-bean-studio-library" aria-labelledby="bean-library-title">
        <div className="dame-bean-studio-library-heading">
          <div>
            <p className="dame-kicker">The collection</p>
            <h2 id="bean-library-title">Choose a Bean.</h2>
          </div>
          <div className="dame-bean-studio-tabs" role="tablist" aria-label="Bean collections">
            {(Object.keys(beanStateGroups) as BeanGroup[]).map((key) => (
              <button
                type="button"
                role="tab"
                id={`bean-tab-${key}`}
                aria-controls="bean-studio-panel"
                aria-selected={group === key}
                key={key}
                onClick={() => changeGroup(key)}
              >
                {groupLabels[key]}
              </button>
            ))}
          </div>
        </div>

        <div
          className="dame-bean-studio-grid"
          id="bean-studio-panel"
          role="tabpanel"
          aria-labelledby={`bean-tab-${group}`}
        >
          {states.map((state) => (
            <button
              type="button"
              className={selected === state ? 'is-selected' : undefined}
              key={state}
              onClick={() => setSelected(state)}
              aria-pressed={selected === state}
            >
              <BeanStateImage state={state} decorative />
              <span>{stateLabel(state)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="dame-bean-studio-loading" aria-labelledby="loading-preview-title">
        <div>
          <p className="dame-kicker">Loading sequence</p>
          <h2 id="loading-preview-title">Arrive. Sip. Ready.</h2>
          <p>The only full repeating animation: three hand-drawn poses that gently trade places while a page loads.</p>
          <button className="dame-button" type="button" onClick={() => setReplayKey((key) => key + 1)}>
            Replay animation
          </button>
        </div>
        <div className="dame-bean-studio-loading-demo" key={replayKey} aria-label="Animated loading Bean preview">
          <BeanStateImage state="loading-start" decorative />
          <BeanStateImage state="loading-sip" decorative />
          <BeanStateImage state="loading-ready" decorative />
          <span aria-hidden="true"><i /></span>
        </div>
      </section>
    </div>
  );
}
