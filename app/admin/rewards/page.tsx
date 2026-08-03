'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '../admin-header';
import { clearAdminSession, getAdminAccessToken, isAdminSessionError } from '../../lib/admin-session';
import {
  type AdminRewardLookup,
  type RewardPromotion,
  createRewardPromotion,
  listRewardPromotions,
  lookupDameReward,
  redeemDameReward,
  setRewardPromotionActive,
} from '../../lib/dame-rewards';

export default function AdminRewardsPage() {
  const router = useRouter();
  const [rewardCode, setRewardCode] = useState('');
  const [reward, setReward] = useState<AdminRewardLookup | null>(null);
  const [rewardMessage, setRewardMessage] = useState('');
  const [rewardError, setRewardError] = useState('');
  const [checkingReward, setCheckingReward] = useState(false);
  const [promotions, setPromotions] = useState<RewardPromotion[]>([]);
  const [name, setName] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [scope, setScope] = useState<RewardPromotion['scope']>('all');
  const [categories, setCategories] = useState<RewardPromotion['eligible_categories']>([]);
  const [promotionMessage, setPromotionMessage] = useState('');
  const [promotionError, setPromotionError] = useState('');
  const [savingPromotion, setSavingPromotion] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const token = await getAdminAccessToken();
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      try {
        const rows = await listRewardPromotions(token);
        if (active) setPromotions(rows);
      } catch (loadError) {
        if (isAdminSessionError(loadError)) {
          clearAdminSession();
          router.replace('/admin/login');
          return;
        }
        if (active) setPromotionError(loadError instanceof Error ? loadError.message : 'Could not load rewards.');
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  async function checkReward(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await getAdminAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    setCheckingReward(true); setReward(null); setRewardMessage(''); setRewardError('');
    try {
      setReward(await lookupDameReward(token, rewardCode));
    } catch (lookupError) {
      setRewardError(lookupError instanceof Error ? lookupError.message : 'Could not check that reward code.');
    } finally {
      setCheckingReward(false);
    }
  }

  async function markRewardUsed() {
    if (!reward) return;
    const token = await getAdminAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    setCheckingReward(true); setRewardMessage(''); setRewardError('');
    try {
      const result = await redeemDameReward(token, reward.code);
      setReward((current) => current ? { ...current, status: 'redeemed' } : current);
      setRewardMessage(`${result.reward_name} marked used for ${result.first_name}.`);
    } catch (redeemError) {
      setRewardError(redeemError instanceof Error ? redeemError.message : 'Could not redeem that code.');
    } finally {
      setCheckingReward(false);
    }
  }

  function toggleCategory(category: RewardPromotion['eligible_categories'][number]) {
    setCategories((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category]);
  }

  async function addPromotion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await getAdminAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    setPromotionMessage(''); setPromotionError(''); setSavingPromotion(true);
    try {
      if (scope === 'menu_categories' && !categories.length) throw new Error('Choose at least one menu category for this campaign.');
      const begins = new Date(startsAt);
      const ends = new Date(endsAt);
      if (Number.isNaN(begins.getTime()) || Number.isNaN(ends.getTime()) || ends <= begins) throw new Error('Choose an ending time after the campaign begins.');
      const promotion = await createRewardPromotion(token, {
        name: name.trim(), scope, eligible_categories: scope === 'all' ? [] : categories,
        starts_at: begins.toISOString(), ends_at: ends.toISOString(),
      });
      setPromotions((current) => [promotion, ...current]);
      setName(''); setStartsAt(''); setEndsAt(''); setScope('all'); setCategories([]);
      setPromotionMessage('Your 2× points campaign is scheduled.');
    } catch (saveError) {
      setPromotionError(saveError instanceof Error ? saveError.message : 'Could not schedule that campaign.');
    } finally {
      setSavingPromotion(false);
    }
  }

  async function togglePromotion(promotion: RewardPromotion) {
    const token = await getAdminAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    setPromotionMessage(''); setPromotionError(''); setSavingPromotion(true);
    try {
      const updated = await setRewardPromotionActive(token, promotion.id, !promotion.active);
      setPromotions((current) => current.map((item) => item.id === updated.id ? updated : item));
      setPromotionMessage(updated.active ? `${updated.name} is active.` : `${updated.name} is paused.`);
    } catch (saveError) {
      setPromotionError(saveError instanceof Error ? saveError.message : 'Could not update that campaign.');
    } finally {
      setSavingPromotion(false);
    }
  }

  return (
    <main className="admin-shell">
      <AdminHeader title="Dame Rewards" />
      <section className="admin-card admin-rewards-card">
        <div className="admin-section-heading"><div><p className="eyebrow">AT THE CART</p><h2>Redeem a customer code.</h2></div><p>Ask for the eight-character code shown in their rewards account.</p></div>
        <form className="admin-reward-lookup" onSubmit={checkReward}><label>Reward code<input value={rewardCode} onChange={(event) => setRewardCode(event.target.value.toUpperCase())} placeholder="AB12CD34" maxLength={8} autoCapitalize="characters" required /></label><button className="pill solid" type="submit" disabled={checkingReward}>{checkingReward ? 'Checking…' : 'Check code'}</button></form>
        {reward ? <article className={`admin-reward-result is-${reward.status}`}><div><span>{reward.status}</span><h3>{reward.reward_name}</h3><p>{reward.first_name} · {reward.email}</p><small>Code {reward.code} · {reward.points_spent} points</small></div><button className="pill solid" type="button" onClick={markRewardUsed} disabled={checkingReward || reward.status !== 'pending'}>{reward.status === 'pending' ? 'Mark reward used' : 'Already handled'}</button></article> : null}
        {rewardMessage ? <p className="admin-success">{rewardMessage}</p> : null}
        {rewardError ? <p className="admin-error">{rewardError}</p> : null}
      </section>

      <section className="admin-card admin-rewards-card">
        <div className="admin-section-heading"><div><p className="eyebrow">POINTS CAMPAIGNS</p><h2>Schedule a 2× moment.</h2></div><p>Choose when and what earns double points. Overlapping campaigns never stack.</p></div>
        <form className="admin-form admin-grid" onSubmit={addPromotion}>
          <label className="admin-wide">Campaign name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Double Points Saturday" maxLength={80} required /></label>
          <label>Begins<input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required /></label>
          <label>Ends<input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} required /></label>
          <label className="admin-wide">Eligible purchases<select value={scope} onChange={(event) => setScope(event.target.value as RewardPromotion['scope'])}><option value="all">Every eligible purchase</option><option value="menu_categories">Selected menu categories</option></select></label>
          {scope === 'menu_categories' ? <fieldset className="admin-category-options admin-wide"><legend>Choose the categories</legend>{[['basics', 'The Basics'], ['specialty', 'Specialty Drinks'], ['foam', 'Cold Foam Lovers'], ['food', 'Food Items']].map(([value, label]) => <label key={value}><input type="checkbox" checked={categories.includes(value as RewardPromotion['eligible_categories'][number])} onChange={() => toggleCategory(value as RewardPromotion['eligible_categories'][number])} /><span>{label}</span></label>)}</fieldset> : null}
          <button className="pill solid admin-wide" type="submit" disabled={savingPromotion}>{savingPromotion ? 'Scheduling…' : 'Schedule 2× points'}</button>
        </form>
        {promotions.length ? <div className="admin-promotion-list">{promotions.map((promotion) => <article key={promotion.id}><div><span>{promotion.multiplier}× points</span><h3>{promotion.name}</h3><p>{new Date(promotion.starts_at).toLocaleString()} – {new Date(promotion.ends_at).toLocaleString()}</p><small>{promotion.scope === 'all' ? 'Every eligible purchase' : promotion.eligible_categories.join(', ')}</small></div><button className={`toggle ${promotion.active ? 'on' : ''}`} type="button" aria-label={`${promotion.active ? 'Pause' : 'Activate'} ${promotion.name}`} aria-pressed={promotion.active} disabled={savingPromotion} onClick={() => togglePromotion(promotion)}><i /></button></article>)}</div> : <p className="admin-empty-state">No 2× campaigns scheduled yet.</p>}
        {promotionMessage ? <p className="admin-success">{promotionMessage}</p> : null}
        {promotionError ? <p className="admin-error">{promotionError}</p> : null}
      </section>
    </main>
  );
}
