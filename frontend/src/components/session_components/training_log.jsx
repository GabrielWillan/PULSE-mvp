import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAllDays, getAllRoutines } from "../api_components";
import { getSessionLogs } from "./session_api";
import "./training_log.css";

function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 12h4l2.5-7 5 14 2.5-7H21" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function formatDate(value) {
  if (!value) return "Date not provided";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function logSessionId(log) {
  return log?.sessions_id ?? log?.session_id ?? log?.sessionId ?? null;
}

function logExerciseId(log) {
  return log?.exercise_id ?? log?.exerciseId ?? log?.exercise_detail_id ?? null;
}

function formatRest(log) {
  const rest = Number(log?.rest_time ?? log?.restTime);
  if (!Number.isFinite(rest)) return "Rest not recorded";
  const unit = String(log?.rest_unit ?? log?.restUnit ?? "seconds").toLowerCase();
  if (unit.startsWith("min")) return `${rest} min rest`;
  return `${rest} sec rest`;
}

function normalizeDays(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.days ?? payload?.day_names ?? payload?.routinedays ?? [];
}

function normalizeRoutines(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.routines ?? payload?.data ?? [];
}

function SessionExerciseDetails({ session }) {
  return (
    <div className="training-log-exercise-list">
      {session.exercises.map((exercise) => (
        <section className="training-log-exercise" key={exercise.id}>
          <div className="training-log-exercise-heading">
            <h4>{exercise.name}</h4>
            <span>{exercise.logs.length} {exercise.logs.length === 1 ? "set" : "sets"}</span>
          </div>
          <div className="training-log-set-table" role="table" aria-label={`${exercise.name} logged sets`}>
            <div className="training-log-set-head" role="row">
              <span role="columnheader">SET</span>
              <span role="columnheader">REPS</span>
              <span role="columnheader">WEIGHT</span>
              <span role="columnheader">REST</span>
            </div>
            {exercise.logs
              .slice()
              .sort((left, right) => Number(left.sets ?? left.set_number ?? 0) - Number(right.sets ?? right.set_number ?? 0))
              .map((log, index) => (
                <div className="training-log-set-row" role="row" key={log.id ?? `${exercise.id}-${index}`}>
                  <span role="cell"><b>{String(log.sets ?? log.set_number ?? index + 1).padStart(2, "0")}</b></span>
                  <span role="cell">{log.reps ?? "—"}<small> reps</small></span>
                  <span role="cell">{log.weight ?? "—"}<small> kg</small></span>
                  <span role="cell">{formatRest(log)}</span>
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function TrainingLog() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialRoutine = location.state?.routine;
  const [routines, setRoutines] = useState(initialRoutine ? [initialRoutine] : []);
  const [routineId, setRoutineId] = useState(initialRoutine?.id ? String(initialRoutine.id) : "");
  const [logs, setLogs] = useState([]);
  const [days, setDays] = useState([]);
  const [loadingRoutines, setLoadingRoutines] = useState(!initialRoutine);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState("");
  const [expandedSessionKey, setExpandedSessionKey] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadRoutines() {
      try {
        setLoadingRoutines(true);
        const result = await getAllRoutines();
        if (!active) return;
        const list = normalizeRoutines(result);
        setRoutines(list);
        setRoutineId((current) => {
          const preferred = initialRoutine?.id;
          if (list.some((routine) => String(routine.id) === current)) return current;
          if (list.some((routine) => String(routine.id) === String(preferred))) return String(preferred);
          return list[0] ? String(list[0].id) : "";
        });
      } catch (loadError) {
        if (active) setError(loadError.message || "Could not load routines.");
      } finally {
        if (active) setLoadingRoutines(false);
      }
    }
    loadRoutines();
    return () => { active = false; };
  }, [initialRoutine?.id]);

  useEffect(() => {
    if (!routineId) return undefined;

    let active = true;
    async function loadRoutineLog() {
      try {
        setLoadingLogs(true);
        setError("");
        const [logRows, dayRows] = await Promise.all([
          getSessionLogs(routineId),
          getAllDays(routineId),
        ]);
        if (!active) return;
        setLogs(Array.isArray(logRows) ? logRows : []);
        setDays(normalizeDays(dayRows));
      } catch (loadError) {
        if (!active) return;
        setLogs([]);
        setDays([]);
        setError(loadError.message || "Could not load this routine's training log.");
      } finally {
        if (active) setLoadingLogs(false);
      }
    }
    loadRoutineLog();
    return () => { active = false; };
  }, [routineId]);

  const selectedRoutine = routines.find((routine) => String(routine.id) === routineId) ?? initialRoutine ?? null;
  const dayById = useMemo(() => {
    const map = new Map();
    days.forEach((day) => map.set(String(day.id ?? day.day_id), day));
    return map;
  }, [days]);
  const exerciseNameById = useMemo(() => {
    const map = new Map();
    days.forEach((day) => (day.exercises ?? []).forEach((exercise) => {
      const id = exercise.id ?? exercise.exercise_id;
      if (id != null && !map.has(String(id))) map.set(String(id), exercise.name ?? exercise.exercise_name);
    }));
    return map;
  }, [days]);

  const sessions = useMemo(() => {
    const grouped = new Map();
    logs.forEach((log, index) => {
      const rawSessionId = logSessionId(log);
      const key = rawSessionId == null ? `unassigned-${index}` : String(rawSessionId);
      if (!grouped.has(key)) {
        const dayId = log?.day_id ?? log?.dayId;
        const day = dayId == null ? null : dayById.get(String(dayId));
        grouped.set(key, {
          key,
          sessionId: rawSessionId,
          startedAt: log?.started_at ?? log?.startedAt ?? log?.created_at ?? log?.createdAt ?? null,
          dayName: log?.day_name ?? log?.dayName ?? day?.day_name ?? day?.name ?? null,
          workoutTitle: log?.workout_title ?? log?.workoutTitle ?? day?.workout_title ?? null,
          logs: [],
        });
      }
      grouped.get(key).logs.push(log);
    });

    return [...grouped.values()]
      .map((session) => {
        const exercises = new Map();
        session.logs.forEach((log, index) => {
          const exerciseId = logExerciseId(log);
          const exerciseKey = exerciseId == null ? `unknown-${index}` : String(exerciseId);
          if (!exercises.has(exerciseKey)) {
            exercises.set(exerciseKey, {
              id: exerciseKey,
              name: log?.exercise_name ?? log?.exerciseName ?? exerciseNameById.get(exerciseKey) ?? (exerciseId == null ? "Exercise" : `Exercise ${exerciseId}`),
              logs: [],
            });
          }
          exercises.get(exerciseKey).logs.push(log);
        });
        return { ...session, exercises: [...exercises.values()] };
      })
      .sort((left, right) => {
        const leftTime = left.startedAt ? new Date(String(left.startedAt).replace(" ", "T")).getTime() : 0;
        const rightTime = right.startedAt ? new Date(String(right.startedAt).replace(" ", "T")).getTime() : 0;
        if (leftTime && rightTime && leftTime !== rightTime) return rightTime - leftTime;
        return Number(right.sessionId ?? 0) - Number(left.sessionId ?? 0);
      });
  }, [dayById, exerciseNameById, logs]);

  const totalSets = logs.length;
  const exerciseCount = new Set(logs.map((log) => String(logExerciseId(log)))).size;
  const lastSessionDate = sessions[0]?.startedAt;
  const expandedSession = sessions.find((session) => session.key === expandedSessionKey) ?? null;
  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  useEffect(() => {
    if (!expandedSession) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setExpandedSessionKey(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [expandedSession]);

  return (
    <div className="training-log-page">
      <div className="training-log-shell">
        <header className="training-log-header">
          <div className="training-log-brand-group">
            <button
              type="button"
              className="training-log-menu-button"
              aria-label="Back to dashboard"
              onClick={() => navigate("/dashboard", { state: { routine: selectedRoutine } })}
            >
              <MenuIcon />
            </button>
            <div className="training-log-brand">
              <span className="training-log-mark"><ActivityIcon /></span>
              <span>PULSE</span>
            </div>
          </div>
          <time className="training-log-date">{dateLabel}</time>
        </header>

        <main className="training-log-main">
          <section className="training-log-hero">
            <p className="training-log-eyebrow">YOUR TRAINING HISTORY</p>
            <h1>Training log</h1>
            <p>Every session, exercise, and set in one place.</p>
          </section>

          <section className="training-log-filter-card" aria-label="Log filters">
            <div>
              <p className="training-log-label">ROUTINE</p>
              <label className="training-log-select-wrap" htmlFor="training-log-routine">
                <select
                  id="training-log-routine"
                  value={routineId}
                  onChange={(event) => {
                    setExpandedSessionKey(null);
                    setRoutineId(event.target.value);
                  }}
                  disabled={loadingRoutines || routines.length === 0}
                >
                  {routines.length === 0 ? <option value="">No routines yet</option> : null}
                  {routines.map((routine) => <option key={routine.id} value={routine.id}>{routine.name ?? routine.title_name ?? `Routine ${routine.id}`}</option>)}
                </select>
                <span aria-hidden="true">⌄</span>
              </label>
            </div>
            <div className="training-log-filter-context">
              <span className="training-log-filter-dot" />
              <span>{selectedRoutine?.name ?? selectedRoutine?.title_name ?? "Select a routine"}</span>
              <span className="training-log-filter-divider" />
              <span>{loadingLogs ? "Loading logs…" : `${sessions.length} ${sessions.length === 1 ? "session" : "sessions"}`}</span>
            </div>
          </section>

          {error ? <div className="training-log-notice is-error" role="alert">{error}</div> : null}

          <div className="training-log-content-grid">
            <section className="training-log-session-column" aria-label="Logged sessions">
              <div className="training-log-section-heading">
                <div>
                  <p className="training-log-eyebrow">SESSION BY SESSION</p>
                  <h2>Your sessions</h2>
                </div>
                <span className="training-log-session-count">{sessions.length} total</span>
              </div>

              {loadingLogs ? (
                <div className="training-log-empty"><span className="training-log-loader" /><p>Loading your training history…</p></div>
              ) : sessions.length === 0 ? (
                <div className="training-log-empty">
                  <span className="training-log-empty-mark"><ActivityIcon /></span>
                  <h3>No logged sessions yet</h3>
                  <p>Once you log sets during a session, they’ll appear here.</p>
                </div>
              ) : (
                <div className="training-log-session-list">
                  {sessions.map((session) => (
                    <button
                      type="button"
                      className="training-log-session-card"
                      key={session.key}
                      aria-label={`Expand ${session.workoutTitle ?? session.dayName ?? "workout session"} details`}
                      aria-haspopup="dialog"
                      onClick={() => setExpandedSessionKey(session.key)}
                    >
                      <header className="training-log-session-header">
                        <div className="training-log-session-heading-copy">
                          <p className="training-log-session-date">{session.startedAt ? formatDate(session.startedAt) : `Session ${session.sessionId ?? "record"}`}</p>
                          <h3>{session.workoutTitle ?? session.dayName ?? "Workout session"}</h3>
                          <p className="training-log-session-subtitle">
                            {session.dayName && session.workoutTitle ? session.dayName : session.dayName ? "Routine day" : session.sessionId ? `Session ID ${session.sessionId}` : "Routine session"}
                          </p>
                        </div>
                        <div className="training-log-session-badges">
                          {session.dayName ? <span className="training-log-day-badge">{session.dayName}</span> : null}
                          <span className="training-log-set-badge">{session.logs.length} {session.logs.length === 1 ? "set" : "sets"}</span>
                        </div>
                      </header>
                      <div className="training-log-session-preview">
                        <div className="training-log-session-exercise-names">
                          {session.exercises.slice(0, 3).map((exercise) => <span key={exercise.id}>{exercise.name}</span>)}
                          {session.exercises.length > 3 ? <span>+{session.exercises.length - 3} more</span> : null}
                        </div>
                        <span className="training-log-expand-action">View session <b aria-hidden="true">↗</b></span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <aside className="training-log-side-column">
              <section className="training-log-overview-card">
                <h2>Log overview</h2>
                <div className="training-log-overview-primary">
                  <strong>{sessions.length}</strong>
                  <span>sessions<br />recorded</span>
                </div>
                <div className="training-log-progress-track"><span style={{ width: sessions.length ? "100%" : "0%" }} /></div>
                <div className="training-log-overview-stats">
                  <div><strong>{totalSets}</strong><span>sets logged</span></div>
                  <div><strong>{exerciseCount}</strong><span>exercises</span></div>
                </div>
              </section>

              <section className="training-log-latest-card">
                <div className="training-log-latest-heading">
                  <h2>Latest session</h2>
                  <span className="training-log-latest-dot" />
                </div>
                {sessions.length ? (
                  <>
                    <h3>{sessions[0].workoutTitle ?? sessions[0].dayName ?? "Workout session"}</h3>
                    <p>{lastSessionDate ? formatDate(lastSessionDate) : `Session ${sessions[0].sessionId ?? "record"}`}</p>
                    <span className="training-log-latest-meta">{sessions[0].logs.length} logged {sessions[0].logs.length === 1 ? "set" : "sets"}</span>
                  </>
                ) : (
                  <>
                    <h3>No session history yet</h3>
                    <p>Your logged workouts will show up here.</p>
                    <span className="training-log-latest-meta">READY WHEN YOU ARE</span>
                  </>
                )}
              </section>
            </aside>
          </div>
        </main>
      </div>

      {expandedSession ? (
        <div
          className="training-log-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setExpandedSessionKey(null);
          }}
        >
          <section
            className="training-log-session-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="training-log-dialog-title"
          >
            <header className="training-log-dialog-header">
              <div>
                <p className="training-log-eyebrow">SESSION DETAILS{expandedSession.dayName ? ` · ${expandedSession.dayName}` : ""}</p>
                <h2 id="training-log-dialog-title">{expandedSession.workoutTitle ?? expandedSession.dayName ?? "Workout session"}</h2>
                <p>{expandedSession.startedAt ? formatDate(expandedSession.startedAt) : `Session ${expandedSession.sessionId ?? "record"}`}</p>
              </div>
              <button
                type="button"
                className="training-log-dialog-close"
                aria-label="Close session details"
                onClick={() => setExpandedSessionKey(null)}
              >×</button>
            </header>
            <div className="training-log-dialog-summary">
              <div><strong>{expandedSession.exercises.length}</strong><span>Exercises</span></div>
              <div><strong>{expandedSession.logs.length}</strong><span>Logged sets</span></div>
            </div>
            <div className="training-log-dialog-content">
              <SessionExerciseDetails session={expandedSession} />
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
