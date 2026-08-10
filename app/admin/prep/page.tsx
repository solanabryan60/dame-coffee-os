'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '../admin-header';
import {
  clearAdminSession,
  getAdminAccessToken,
  isAdminSessionError,
} from '../../lib/admin-session';
import {
  createPrepTaskForAdmin,
  deletePrepTaskForAdmin,
  listPrepTasksForAdmin,
  updatePrepTaskForAdmin,
  type PrepPhase,
  type PrepTask,
} from '../../lib/supabase-rest';

const PHASES: Array<{ value: PrepPhase; label: string; note: string }> = [
  { value: 'opening', label: 'Opening', note: 'Before the first cup' },
  { value: 'service', label: 'During service', note: 'Keep Dame moving' },
  { value: 'closing', label: 'Closing', note: 'Leave tomorrow ready' },
];

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

function completedTime(value: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function AdminPrepPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<PrepTask[]>([]);
  const [today, setToday] = useState(() => localDateKey());
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [title, setTitle] = useState('');
  const [phase, setPhase] = useState<PrepPhase>('opening');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void (async () => {
      const token = await getAdminAccessToken();
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      try {
        const rows = await listPrepTasksForAdmin(token);
        if (active) setTasks(rows);
      } catch (loadError) {
        if (isAdminSessionError(loadError)) {
          clearAdminSession();
          router.replace('/admin/login');
          return;
        }
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load today’s prep.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    const timer = window.setInterval(() => setToday(localDateKey()), 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [router]);

  const completedTasks = tasks.filter((task) => task.last_completed_on === today).length;
  const progress = {
    complete: completedTasks,
    total: tasks.length,
    percent: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0,
  };

  function replaceTask(updated: PrepTask) {
    setTasks((current) => current
      .map((task) => task.id === updated.id ? updated : task)
      .sort((a, b) => a.phase.localeCompare(b.phase) || a.sort_order - b.sort_order || a.id - b.id));
  }

  async function toggleTask(task: PrepTask) {
    const token = await getAdminAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    const isDone = task.last_completed_on === today;
    setSavingId(task.id); setMessage(''); setError('');
    try {
      const updated = await updatePrepTaskForAdmin(token, task.id, {
        last_completed_on: isDone ? null : today,
        completed_at: isDone ? null : new Date().toISOString(),
      });
      replaceTask(updated);
      setMessage(isDone ? `${task.title} moved back to today’s list.` : `${task.title} complete.`);
    } catch (saveError) {
      if (isAdminSessionError(saveError)) {
        clearAdminSession(); router.replace('/admin/login'); return;
      }
      setError(saveError instanceof Error ? saveError.message : 'Could not update that task.');
    } finally {
      setSavingId(null);
    }
  }

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = await getAdminAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    const nextOrder = Math.max(0, ...tasks.filter((task) => task.phase === phase).map((task) => task.sort_order)) + 10;
    setAdding(true); setMessage(''); setError('');
    try {
      const created = await createPrepTaskForAdmin(token, {
        title: title.trim(),
        phase,
        sort_order: nextOrder,
      });
      setTasks((current) => [...current, created]);
      setTitle('');
      setMessage(`${created.title} added to ${PHASES.find((item) => item.value === phase)?.label.toLowerCase()}.`);
    } catch (saveError) {
      if (isAdminSessionError(saveError)) {
        clearAdminSession(); router.replace('/admin/login'); return;
      }
      setError(saveError instanceof Error ? saveError.message : 'Could not add that task.');
    } finally {
      setAdding(false);
    }
  }

  async function saveTitle(task: PrepTask) {
    const nextTitle = editingTitle.trim();
    if (!nextTitle) return;
    const token = await getAdminAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    setSavingId(task.id); setMessage(''); setError('');
    try {
      const updated = await updatePrepTaskForAdmin(token, task.id, { title: nextTitle });
      replaceTask(updated);
      setEditingId(null);
      setEditingTitle('');
      setMessage('Prep task renamed.');
    } catch (saveError) {
      if (isAdminSessionError(saveError)) {
        clearAdminSession(); router.replace('/admin/login'); return;
      }
      setError(saveError instanceof Error ? saveError.message : 'Could not rename that task.');
    } finally {
      setSavingId(null);
    }
  }

  async function removeTask(task: PrepTask) {
    if (!window.confirm(`Remove “${task.title}” from the daily checklist?`)) return;
    const token = await getAdminAccessToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    setSavingId(task.id); setMessage(''); setError('');
    try {
      await deletePrepTaskForAdmin(token, task.id);
      setTasks((current) => current.filter((item) => item.id !== task.id));
      setMessage(`${task.title} removed from daily prep.`);
    } catch (saveError) {
      if (isAdminSessionError(saveError)) {
        clearAdminSession(); router.replace('/admin/login'); return;
      }
      setError(saveError instanceof Error ? saveError.message : 'Could not remove that task.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="admin-shell admin-prep-shell">
      <AdminHeader title="Daily Prep" />

      <section className="admin-card admin-prep-hero">
        <div className="admin-section-heading">
          <div><p className="eyebrow">TODAY AT DAME</p><h2>{progress.percent === 100 ? 'Ready, served, and reset.' : 'One clear list for the whole day.'}</h2></div>
          <p>Opening, service, and closing stay together. Tomorrow begins with a fresh list automatically.</p>
        </div>
        <div className="admin-prep-progress" aria-label={`${progress.complete} of ${progress.total} tasks complete`}>
          <div><strong>{progress.complete}</strong><span>of {progress.total} complete</span></div>
          <div className="admin-prep-progress-track"><i style={{ width: `${progress.percent}%` }} /></div>
          <b>{progress.percent}%</b>
        </div>
        {message ? <p className="admin-success" role="status">{message}</p> : null}
        {error ? <p className="admin-error" role="alert">{error}</p> : null}
      </section>

      <section className="admin-prep-board" aria-label="Today’s prep checklist">
        {PHASES.map((phaseOption) => {
          const phaseTasks = tasks.filter((task) => task.phase === phaseOption.value);
          const phaseComplete = phaseTasks.filter((task) => task.last_completed_on === today).length;
          return (
            <article className="admin-card admin-prep-lane" key={phaseOption.value}>
              <header>
                <div><p className="eyebrow">{phaseOption.note}</p><h2>{phaseOption.label}</h2></div>
                <span>{phaseComplete}/{phaseTasks.length}</span>
              </header>
              {loading ? <p className="admin-empty-state">Loading tasks…</p> : null}
              {!loading && !phaseTasks.length ? <p className="admin-empty-state">No recurring tasks in this part of the day.</p> : null}
              <div className="admin-prep-tasks">
                {phaseTasks.map((task) => {
                  const done = task.last_completed_on === today;
                  const busy = savingId === task.id;
                  const editing = editingId === task.id;
                  return (
                    <div className={done ? 'admin-prep-task is-done' : 'admin-prep-task'} key={task.id}>
                      <button className="admin-prep-check" type="button" disabled={busy} onClick={() => void toggleTask(task)} aria-label={`${done ? 'Mark incomplete' : 'Complete'}: ${task.title}`} aria-pressed={done}>
                        <span aria-hidden="true">{done ? '✓' : ''}</span>
                      </button>
                      <div>
                        {editing ? (
                          <input value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} maxLength={140} aria-label="Prep task name" autoFocus />
                        ) : (
                          <strong>{task.title}</strong>
                        )}
                        {done ? <small>Completed at {completedTime(task.completed_at)}</small> : <small>Still to do today</small>}
                      </div>
                      <div className="admin-prep-task-actions">
                        {editing ? (
                          <>
                            <button type="button" disabled={busy || !editingTitle.trim()} onClick={() => void saveTitle(task)}>Save</button>
                            <button type="button" onClick={() => { setEditingId(null); setEditingTitle(''); }}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button type="button" disabled={busy} onClick={() => { setEditingId(task.id); setEditingTitle(task.title); }}>Edit</button>
                            <button type="button" disabled={busy} onClick={() => void removeTask(task)}>Remove</button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </section>

      <section className="admin-card admin-prep-add">
        <div className="admin-section-heading">
          <div><p className="eyebrow">MAKE IT YOURS</p><h2>Add a recurring task.</h2></div>
          <p>Add it once and it will return on the checklist every day.</p>
        </div>
        <form className="admin-form admin-prep-add-form" onSubmit={addTask}>
          <label>Task<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Pack extra oat milk" maxLength={140} required /></label>
          <label>Part of the day<select value={phase} onChange={(event) => setPhase(event.target.value as PrepPhase)}>{PHASES.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
          <button className="pill solid" type="submit" disabled={adding}>{adding ? 'Adding…' : 'Add to daily prep'}</button>
        </form>
      </section>
    </main>
  );
}
