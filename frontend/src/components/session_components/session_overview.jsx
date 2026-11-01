import { useEffect, useRef, useState } from "react";
import "./session_overview.css";

function exerciseName(exercise) {
  return (
    exercise?.name ??
    exercise?.exercise_name ??
    exercise?.exerciseName ??
    exercise?.Exercise_Name ??
    "Unnamed exercise"
  );
}

function formatRest(exercise, routineId, restUnitPreferences) {
  const restSeconds = Number(exercise?.rest_time ?? exercise?.restTime);
  if (!Number.isFinite(restSeconds)) return "Not set";

  const detailId =
    exercise?.exercise_detail_id ??
    exercise?.exerciseDetailId ??
    exercise?.detail_id;
  const preferenceKey = `${routineId ?? "unselected"}:${detailId}`;
  const unit = restUnitPreferences?.[preferenceKey] === "minutes"
    ? "minutes"
    : "seconds";
  const value = unit === "minutes" ? restSeconds / 60 : restSeconds;
  const formatted = Number.isInteger(value)
    ? String(value)
    : String(Number(value.toFixed(2)));

  return `${formatted} ${unit === "minutes" ? "min" : "sec"}`;
}

function parseStartedAt(startedAt) {
  if (!startedAt) return null;
  const parsed = Date.parse(String(startedAt).replace(" ", "T"));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatElapsed(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  const pad = (value) => String(value).padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(remainingSeconds)}`
    : `${pad(minutes)}:${pad(remainingSeconds)}`;
}

function PulseMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 12h4l2.2-6.5L14 18l2.1-6H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SessionOverview({
  session,
  restUnitPreferences = {},
  onExit,
}) {
  const exercises = Array.isArray(session?.exercises) ? session.exercises : [];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [now, setNow] = useState(0);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const leaveTimeoutRef = useRef(null);
  const startedAtMs = parseStartedAt(session?.startedAt);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!showExitConfirmation) return undefined;
    function closeOnEscape(event) {
      if (event.key === "Escape") setShowExitConfirmation(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [showExitConfirmation]);

  useEffect(() => () => window.clearTimeout(leaveTimeoutRef.current), []);

  function confirmLeaveSession() {
    setShowExitConfirmation(false);
    setIsLeaving(true);
    leaveTimeoutRef.current = window.setTimeout(() => onExit?.(), 170);
  }

  const selectedExercise = exercises[selectedIndex] ?? null;
  const setCount = Math.max(0, Number(selectedExercise?.sets) || 0);
  const reps = selectedExercise?.reps ?? "—";
  const rest = selectedExercise
    ? formatRest(selectedExercise, session?.routineId, restUnitPreferences)
    : "Not set";
  const note = String(selectedExercise?.note ?? "").trim();
  const elapsedSeconds = startedAtMs == null
    ? 0
    : Math.max(0, Math.floor((now - startedAtMs) / 1000));
  const title =
    session?.workoutTitle || session?.title || session?.day || "Workout";
  const selectedDay = String(session?.day ?? "").toUpperCase();

  return (
    <main className={`session-overview-page${isLeaving ? " is-leaving" : ""}`}>
      <div className="session-overview-shell">
        <header className="session-overview-header">
          <div className="session-overview-brand" aria-label="PULSE">
            <span className="session-overview-logo"><PulseMark /></span>
            <span>PULSE</span>
          </div>

          <div className="session-overview-heading">
            <div className="session-overview-workout-title">
              {title} <span>·</span> Exercise {exercises.length ? selectedIndex + 1 : 0} of {exercises.length}
            </div>
            <nav className="session-overview-steps" aria-label="Workout stages">
              <span className="is-current"><b>1</b> Overview</span>
              <i aria-hidden="true" />
              <span><b>2</b> Set</span>
              <i aria-hidden="true" />
              <span><b>3</b> Rest &amp; log</span>
            </nav>
          </div>

          <div className="session-overview-session-actions">
            <button
              type="button"
              className="session-overview-exit"
              onClick={() => setShowExitConfirmation(true)}
            >
              Leave session
            </button>
            <div className="session-overview-clock" aria-label="Session elapsed time">
              <span />
              {formatElapsed(elapsedSeconds)}
            </div>
          </div>
        </header>

        <div className="session-overview-content">
          <aside className="session-overview-exercise-rail" aria-label="Exercises in this session">
            <div className="session-overview-rail-heading">
              <span>Exercises</span>
              <strong>{exercises.length}</strong>
            </div>
            <div className="session-overview-exercise-list" role="list">
              {exercises.map((exercise, index) => {
                const name = exerciseName(exercise);
                const isSelected = index === selectedIndex;
                const key =
                  exercise?.exercise_detail_id ??
                  exercise?.exerciseDetailId ??
                  `${exercise?.id ?? name}-${index}`;
                return (
                  <div key={key} role="listitem">
                    <button
                      className={`session-overview-exercise${isSelected ? " is-selected" : ""}`}
                      type="button"
                      aria-current={isSelected ? "step" : undefined}
                      onClick={() => setSelectedIndex(index)}
                    >
                      <span className="session-overview-exercise-number">{index + 1}</span>
                      <span className="session-overview-exercise-copy">
                        <strong>{name}</strong>
                        <small>
                          {exercise?.sets ?? "—"} × {exercise?.reps ?? "—"} · {formatRest(exercise, session?.routineId, restUnitPreferences)}
                        </small>
                      </span>
                    </button>
                  </div>
                );
              })}
              {!exercises.length && (
                <p className="session-overview-empty">No exercises were returned for this workout.</p>
              )}
            </div>
          </aside>

          <section className="session-overview-card" aria-label="Selected exercise overview">
            {selectedExercise ? (
              <>
                <section key={`set-progress-${selectedIndex}`} className="session-overview-set-panel" aria-label="Set progress">
                  <p className="session-overview-eyebrow">Set progress</p>
                  <div
                    className="session-overview-set-ring"
                    role="img"
                    aria-label={`0 of ${setCount} sets completed`}
                  >
                    <div>
                      <strong>0</strong>
                      <span>/{setCount}</span>
                    </div>
                  </div>
                  <p className="session-overview-set-caption">sets completed</p>
                  <div className="session-overview-set-list">
                    {Array.from({ length: Math.min(setCount, 6) }, (_, index) => (
                      <div
                        className={`session-overview-set-row${index === 0 ? " is-ready" : ""}`}
                        key={index}
                      >
                        <span className="session-overview-set-dot">{index + 1}</span>
                        <span>Set {index + 1}</span>
                        <small>{index === 0 ? "Ready" : "Up next"}</small>
                      </div>
                    ))}
                    {setCount > 6 && (
                      <p className="session-overview-more-sets">+ {setCount - 6} more sets</p>
                    )}
                    {setCount === 0 && (
                      <p className="session-overview-more-sets">No sets assigned</p>
                    )}
                  </div>
                </section>

                <section key={`exercise-detail-${selectedIndex}`} className="session-overview-exercise-detail">
                  <p className="session-overview-eyebrow">
                    Up next · Exercise {selectedIndex + 1} of {exercises.length}
                  </p>
                  {selectedDay && <span className="session-overview-day-tag">{selectedDay}</span>}
                  <h1>{exerciseName(selectedExercise)}</h1>

                  <div className="session-overview-targets" aria-label="Exercise targets">
                    <div>
                      <span>Sets</span>
                      <strong>{selectedExercise.sets ?? "—"}</strong>
                    </div>
                    <div>
                      <span>Reps</span>
                      <strong>{reps}</strong>
                    </div>
                    <div>
                      <span>Rest</span>
                      <strong>{rest}</strong>
                    </div>
                  </div>

                  <div className="session-overview-note">
                    <p className="session-overview-eyebrow">Exercise note</p>
                    <p>{note || "No exercise note added for this movement."}</p>
                  </div>

                  <div className="session-overview-detail-footer">
                    <div className="session-overview-current-set">
                      <span className="session-overview-current-set-mark" />
                      <span>Set 1 ready</span>
                      <strong>{reps} reps target</strong>
                    </div>
                    <button
                      type="button"
                      className="session-overview-start-set"
                      disabled
                      title="Set logging will be wired into the next session step."
                    >
                      Start set <ArrowIcon />
                    </button>
                  </div>
                </section>
              </>
            ) : (
              <div className="session-overview-no-exercise">
                <p className="session-overview-eyebrow">Session overview</p>
                <h1>This workout has no exercises yet.</h1>
                <p>Leave the session to add exercises, then start again.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {showExitConfirmation && (
        <div
          className="session-overview-confirm-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowExitConfirmation(false);
            }
          }}
        >
          <section
            className="session-overview-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="session-overview-confirm-title"
            aria-describedby="session-overview-confirm-copy"
          >
            <span className="session-overview-confirm-mark" aria-hidden="true">!</span>
            <p className="session-overview-eyebrow">Session in progress</p>
            <h2 id="session-overview-confirm-title">
              Are you sure you want to leave this session?
            </h2>
            <p id="session-overview-confirm-copy">
              Your current workout screen will close.
            </p>
            <div className="session-overview-confirm-actions">
              <button
                type="button"
                className="session-overview-stay-button"
                onClick={() => setShowExitConfirmation(false)}
              >
                Stay in session
              </button>
              <button
                type="button"
                className="session-overview-leave-button"
                onClick={confirmLeaveSession}
              >
                Leave session
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
