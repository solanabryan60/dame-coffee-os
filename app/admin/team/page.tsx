'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '../admin-header';
import {
  clearAdminSession,
  getAdminAccessToken,
  isAdminSessionError,
} from '../../lib/admin-session';
import {
  clockInForAdmin,
  clockOutForAdmin,
  createEmployeeResourceForAdmin,
  createStaffShiftForAdmin,
  deleteEmployeeResourceForAdmin,
  deleteStaffShiftForAdmin,
  listCateringRequestsForAdmin,
  listEmployeeResourcesForAdmin,
  listEmployeeTimeEntriesForAdmin,
  listStaffProfilesForAdmin,
  listStaffShiftsForAdmin,
  listUpcomingEventsForAdmin,
  readAuthUser,
  updateStaffProfileForAdmin,
  type CateringRequest,
  type EmployeeResource,
  type EmployeeTimeEntry,
  type StaffProfile,
  type StaffShift,
  type UpcomingEvent,
} from '../../lib/supabase-rest';

function localDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function clockTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function TeamWorkspacePage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  const [entries, setEntries] = useState<EmployeeTimeEntry[]>([]);
  const [resources, setResources] = useState<EmployeeResource[]>([]);
  const [catering, setCatering] = useState<CateringRequest[]>([]);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [shiftUserId, setShiftUserId] = useState('');
  const [shiftDate, setShiftDate] = useState(localDateKey());
  const [shiftStart, setShiftStart] = useState('06:00');
  const [shiftEnd, setShiftEnd] = useState('14:00');
  const [shiftLocation, setShiftLocation] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');

  const [resourceType, setResourceType] = useState<EmployeeResource['resource_type']>('recipe');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceContent, setResourceContent] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');

  useEffect(() => {
    let active = true;
    void (async () => {
      const token = await getAdminAccessToken();
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      setAccessToken(token);
      try {
        const [user, staffRows, shiftRows, timeRows, resourceRows, cateringRows, eventRows] = await Promise.all([
          readAuthUser(token),
          listStaffProfilesForAdmin(token),
          listStaffShiftsForAdmin(token),
          listEmployeeTimeEntriesForAdmin(token),
          listEmployeeResourcesForAdmin(token),
          listCateringRequestsForAdmin(token),
          listUpcomingEventsForAdmin(token),
        ]);
        if (!active) return;
        setCurrentUserId(user.id);
        setProfiles(staffRows);
        setShiftUserId(staffRows.find((profile) => profile.user_id === user.id)?.user_id ?? staffRows[0]?.user_id ?? '');
        setShifts(shiftRows);
        setEntries(timeRows);
        setResources(resourceRows);
        setCatering(cateringRows);
        setEvents(eventRows);
      } catch (loadError) {
        if (isAdminSessionError(loadError)) {
          clearAdminSession();
          router.replace('/admin/login');
          return;
        }
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load the team workspace.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [router]);

  const today = localDateKey();
  const openEntry = entries.find((entry) => entry.user_id === currentUserId && !entry.clocked_out_at) ?? null;
  const upcomingShifts = shifts.filter((shift) => shift.shift_date >= today).slice(0, 20);
  const todayCatering = catering.filter((request) => request.event_date === today && !['cancelled', 'refunded'].includes(request.status));
  const todayEvents = events.filter((event) => event.event_date === today && event.is_published);
  const profileById = useMemo(() => new Map(profiles.map((profile) => [profile.user_id, profile])), [profiles]);

  async function toggleClock() {
    if (!accessToken || !currentUserId) return;
    setWorking('clock'); setMessage(''); setError('');
    try {
      if (openEntry) {
        const updated = await clockOutForAdmin(accessToken, openEntry.id);
        setEntries((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
        setMessage('Clocked out. Your time is saved.');
      } else {
        const created = await clockInForAdmin(accessToken, currentUserId);
        setEntries((current) => [created, ...current]);
        setMessage('Clocked in. Have a beautiful service.');
      }
    } catch (clockError) {
      setError(clockError instanceof Error ? clockError.message : 'Could not update the time clock.');
    } finally { setWorking(''); }
  }

  async function addShift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || !shiftUserId) return;
    setWorking('shift'); setMessage(''); setError('');
    try {
      const shift = await createStaffShiftForAdmin(accessToken, {
        user_id: shiftUserId,
        shift_date: shiftDate,
        starts_at: shiftStart,
        ends_at: shiftEnd,
        location: shiftLocation,
        notes: shiftNotes,
      });
      setShifts((current) => [...current, shift].sort((a, b) => `${a.shift_date}${a.starts_at}`.localeCompare(`${b.shift_date}${b.starts_at}`)));
      setShiftNotes('');
      setMessage('Shift added to the team schedule.');
    } catch (shiftError) {
      setError(shiftError instanceof Error ? shiftError.message : 'Could not add that shift.');
    } finally { setWorking(''); }
  }

  async function removeShift(shiftId: string) {
    if (!accessToken) return;
    setWorking(shiftId); setMessage(''); setError('');
    try {
      await deleteStaffShiftForAdmin(accessToken, shiftId);
      setShifts((current) => current.filter((shift) => shift.id !== shiftId));
      setMessage('Shift removed.');
    } catch (shiftError) {
      setError(shiftError instanceof Error ? shiftError.message : 'Could not remove that shift.');
    } finally { setWorking(''); }
  }

  async function saveMember(profile: StaffProfile) {
    if (!accessToken) return;
    setWorking(profile.user_id); setMessage(''); setError('');
    try {
      const updated = await updateStaffProfileForAdmin(accessToken, profile.user_id, profile);
      setProfiles((current) => current.map((item) => item.user_id === updated.user_id ? updated : item));
      setMessage(`${updated.display_name}'s team profile is updated.`);
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : 'Could not update that team member.');
    } finally { setWorking(''); }
  }

  async function addResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    setWorking('resource'); setMessage(''); setError('');
    try {
      const resource = await createEmployeeResourceForAdmin(accessToken, {
        resource_type: resourceType,
        title: resourceTitle,
        content: resourceContent,
        media_url: resourceUrl || null,
      });
      setResources((current) => [...current, resource]);
      setResourceTitle(''); setResourceContent(''); setResourceUrl('');
      setMessage('Team resource added.');
    } catch (resourceError) {
      setError(resourceError instanceof Error ? resourceError.message : 'Could not add that resource.');
    } finally { setWorking(''); }
  }

  async function removeResource(resourceId: string) {
    if (!accessToken) return;
    setWorking(resourceId); setMessage(''); setError('');
    try {
      await deleteEmployeeResourceForAdmin(accessToken, resourceId);
      setResources((current) => current.filter((resource) => resource.id !== resourceId));
      setMessage('Team resource removed.');
    } catch (resourceError) {
      setError(resourceError instanceof Error ? resourceError.message : 'Could not remove that resource.');
    } finally { setWorking(''); }
  }

  return (
    <main className="admin-shell admin-team-shell">
      <AdminHeader title="Team workspace" />
      {message ? <p className="admin-success" role="status">{message}</p> : null}
      {error ? <p className="admin-error" role="alert">{error}</p> : null}
      {loading ? <section className="admin-card"><p>Opening the team workspace…</p></section> : null}

      {!loading ? <>
        <section className="admin-card admin-team-clock">
          <div><p className="eyebrow">TIME CLOCK</p><h2>{openEntry ? `Clocked in since ${clockTime(openEntry.clocked_in_at)}` : 'Ready when you are.'}</h2><p>One tap keeps today&apos;s hours together.</p></div>
          <button className="pill solid" type="button" disabled={working === 'clock'} onClick={() => void toggleClock()}>{working === 'clock' ? 'Saving…' : openEntry ? 'Clock out' : 'Clock in'}</button>
        </section>

        <section className="admin-card">
          <div className="admin-section-heading"><div><p className="eyebrow">TODAY AT DAME</p><h2>Everyone starts with the same plan.</h2></div><p>Today&apos;s public event and confirmed catering details stay visible to the team.</p></div>
          <div className="admin-team-today-grid">
            {todayEvents.map((event) => <article key={event.id}><span>Public event</span><strong>{event.title}</strong><p>{event.start_time?.slice(0, 5) || 'Time TBD'} · {event.address}</p></article>)}
            {todayCatering.map((request) => <article key={request.id}><span>Catering</span><strong>{request.name}{request.company ? ` · ${request.company}` : ''}</strong><p>{request.start_time.slice(0, 5)} · {request.drinks} drinks · {request.address}</p></article>)}
            {!todayEvents.length && !todayCatering.length ? <p className="admin-empty-state">No public or catering events are scheduled for today.</p> : null}
          </div>
        </section>

        <section className="admin-card">
          <div className="admin-section-heading"><div><p className="eyebrow">SCHEDULE</p><h2>Know who&apos;s where.</h2></div><p>Add the next shift and keep the whole team aligned.</p></div>
          <form className="admin-form admin-team-shift-form" onSubmit={addShift}>
            <label>Team member<select value={shiftUserId} onChange={(event) => setShiftUserId(event.target.value)} required>{profiles.filter((profile) => profile.active).map((profile) => <option key={profile.user_id} value={profile.user_id}>{profile.display_name}</option>)}</select></label>
            <label>Date<input type="date" value={shiftDate} onChange={(event) => setShiftDate(event.target.value)} required /></label>
            <label>Starts<input type="time" value={shiftStart} onChange={(event) => setShiftStart(event.target.value)} required /></label>
            <label>Ends<input type="time" value={shiftEnd} onChange={(event) => setShiftEnd(event.target.value)} required /></label>
            <label>Location<input value={shiftLocation} onChange={(event) => setShiftLocation(event.target.value)} maxLength={200} placeholder="Walnut / Diamond Bar" /></label>
            <label>Notes<input value={shiftNotes} onChange={(event) => setShiftNotes(event.target.value)} maxLength={500} placeholder="Bring extra matcha" /></label>
            <button className="pill solid" type="submit" disabled={working === 'shift'}>{working === 'shift' ? 'Adding…' : 'Add shift'}</button>
          </form>
          <div className="admin-team-shift-list">
            {upcomingShifts.map((shift) => <article key={shift.id}><div><strong>{profileById.get(shift.user_id)?.display_name ?? 'Team member'}</strong><span>{shortDate(shift.shift_date)} · {shift.starts_at.slice(0, 5)}–{shift.ends_at.slice(0, 5)}</span><p>{shift.location || 'Location TBD'}{shift.notes ? ` · ${shift.notes}` : ''}</p></div><button type="button" disabled={working === shift.id} onClick={() => void removeShift(shift.id)}>Remove</button></article>)}
            {!upcomingShifts.length ? <p className="admin-empty-state">No upcoming shifts yet.</p> : null}
          </div>
        </section>

        <section className="admin-card">
          <div className="admin-section-heading"><div><p className="eyebrow">TEAM ACCESS</p><h2>Roles stay clear.</h2></div><p>Approved Dame OS accounts can be labeled as owner, manager, or barista.</p></div>
          <div className="admin-team-members">
            {profiles.map((profile) => <article key={profile.user_id}><input value={profile.display_name} onChange={(event) => setProfiles((current) => current.map((item) => item.user_id === profile.user_id ? { ...item, display_name: event.target.value } : item))} aria-label="Team member name" /><select value={profile.role} onChange={(event) => setProfiles((current) => current.map((item) => item.user_id === profile.user_id ? { ...item, role: event.target.value as StaffProfile['role'] } : item))}><option value="owner">Owner</option><option value="manager">Manager</option><option value="barista">Barista</option></select><label><input type="checkbox" checked={profile.active} onChange={(event) => setProfiles((current) => current.map((item) => item.user_id === profile.user_id ? { ...item, active: event.target.checked } : item))} /> Active</label><button type="button" disabled={working === profile.user_id} onClick={() => void saveMember(profile)}>Save</button></article>)}
          </div>
        </section>

        <section className="admin-card">
          <div className="admin-section-heading"><div><p className="eyebrow">RECIPES + TRAINING</p><h2>Teach it once. Keep it here.</h2></div><p>Add recipe notes, opening standards, or a training-video link.</p></div>
          <form className="admin-form admin-team-resource-form" onSubmit={addResource}>
            <label>Type<select value={resourceType} onChange={(event) => setResourceType(event.target.value as EmployeeResource['resource_type'])}><option value="recipe">Recipe</option><option value="training">Training</option></select></label>
            <label>Title<input value={resourceTitle} onChange={(event) => setResourceTitle(event.target.value)} maxLength={160} required /></label>
            <label className="admin-team-resource-wide">Instructions<textarea rows={4} value={resourceContent} onChange={(event) => setResourceContent(event.target.value)} maxLength={10000} /></label>
            <label className="admin-team-resource-wide">Video or resource link · optional<input type="url" value={resourceUrl} onChange={(event) => setResourceUrl(event.target.value)} maxLength={2048} placeholder="https://…" /></label>
            <button className="pill solid" type="submit" disabled={working === 'resource'}>{working === 'resource' ? 'Adding…' : 'Add resource'}</button>
          </form>
          <div className="admin-team-resources">
            {resources.map((resource) => <article key={resource.id}><span>{resource.resource_type}</span><h3>{resource.title}</h3><p>{resource.content}</p>{resource.media_url ? <a href={resource.media_url} target="_blank" rel="noreferrer">Open training resource ↗</a> : null}<button type="button" disabled={working === resource.id} onClick={() => void removeResource(resource.id)}>Remove</button></article>)}
          </div>
        </section>
      </> : null}
    </main>
  );
}
