import { useCallback, useEffect, useRef, useState } from "react";
import "./session_overview.css";
import { endSession, logSession, updateSessionLog } from "../api_components";

const SKIP_WARNING_KEY = "pulse.skipUnloggedSetWarningDisabled";

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

function getRestDurationSeconds(exercise) {
  const value = Number(exercise?.rest_time ?? exercise?.restTime);
  return Number.isInteger(value) && value >= 0 ? value : 90;
}

function parseStartedAt(startedAt) {
  if (!startedAt) return null;
  const normalized = String(startedAt)
    .trim()
    .replace(" ", "T")
    .replace(/\.(\d{3})\d+/, ".$1");
  const timestamp = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)
    ? normalized
    : `${normalized}Z`;
  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatElapsed(seconds) {
  const wholeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const remainingSeconds = wholeSeconds % 60;
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
  const [activeView, setActiveView] = useState("overview");
  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [now, setNow] = useState(() => Date.now());
  const [restDuration, setRestDuration] = useState(0);
  const [restRemaining, setRestRemaining] = useState(0);
  const [setDrafts, setSetDrafts] = useState({});
  const [loggedSets, setLoggedSets] = useState({});
  const [lastValuesByExercise, setLastValuesByExercise] = useState({});
  const [isEditingLoggedSet, setIsEditingLoggedSet] = useState(false);
  const [isLoggingSet, setIsLoggingSet] = useState(false);
  const [setLogError, setSetLogError] = useState("");
  const [setLogMessage, setSetLogMessage] = useState("");
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
  const [dontWarnOnSkip, setDontWarnOnSkip] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [sessionEndError, setSessionEndError] = useState("");
  const leaveTimeoutRef = useRef(null);
  const restDeadlineRef = useRef(null);
  const localSessionStartRef = useRef(Date.now());
  const sessionEndedRef = useRef(false);
  const startedAtMs = parseStartedAt(session?.startedAt);

  useEffect(() => {
    sessionEndedRef.current = false;
  }, [session?.sessionId]);

  useEffect(() => {
    const updateNow = () => setNow(Date.now());
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") updateNow();
    };
    updateNow();
    const intervalId = window.setInterval(updateNow, 1000);
    window.addEventListener("focus", updateNow);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", updateNow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!showExitConfirmation) return undefined;
    function closeOnEscape(event) {
      if (event.key === "Escape") setShowExitConfirmation(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [showExitConfirmation]);

  useEffect(() => {
    if (!showSkipConfirmation) return undefined;
    function closeSkipOnEscape(event) {
      if (event.key === "Escape") setShowSkipConfirmation(false);
    }
    document.addEventListener("keydown", closeSkipOnEscape);
    return () => document.removeEventListener("keydown", closeSkipOnEscape);
  }, [showSkipConfirmation]);

  useEffect(() => () => window.clearTimeout(leaveTimeoutRef.current), []);

  const endCurrentSession = useCallback(async () => {
    if (sessionEndedRef.current) return;
    const sessionId = Number(session?.sessionId);
    if (!Number.isInteger(sessionId) || sessionId < 1) {
      throw new Error("This session does not have a valid ID.");
    }
    await endSession(sessionId);
    sessionEndedRef.current = true;
  }, [session?.sessionId]);

  async function confirmLeaveSession() {
    setIsEndingSession(true);
    setSessionEndError("");
    try {
      await endCurrentSession();
      setShowExitConfirmation(false);
      setIsLeaving(true);
      leaveTimeoutRef.current = window.setTimeout(() => onExit?.(), 170);
    } catch (error) {
      setSessionEndError(error.message || "Could not end this session.");
    } finally {
      setIsEndingSession(false);
    }
  }

  const selectedExercise = exercises[selectedIndex] ?? null;
  const setCount = Math.max(0, Number(selectedExercise?.sets) || 0);
  const reps = selectedExercise?.reps ?? "—";
  const rest = selectedExercise
    ? formatRest(selectedExercise, session?.routineId, restUnitPreferences)
    : "Not set";
  const restDurationSeconds = selectedExercise
    ? getRestDurationSeconds(selectedExercise)
    : 0;
  const note = String(selectedExercise?.note ?? "").trim();
  const exerciseLogKey = String(
    selectedExercise?.exercise_detail_id ??
    selectedExercise?.exerciseDetailId ??
    selectedExercise?.id ??
    selectedIndex
  );
  const currentLogKey = `${session?.sessionId ?? "session"}:${exerciseLogKey}:${currentSetNumber}`;
  const loggedSet = loggedSets[currentLogKey] ?? null;
  const skippingEditedSet = Boolean(loggedSet && isEditingLoggedSet);
  const lastExerciseValues = lastValuesByExercise[exerciseLogKey] ?? null;
  const completedSetCount = Array.from({ length: setCount }, (_, index) => index + 1)
    .filter((setNumber) => loggedSets[`${session?.sessionId ?? "session"}:${exerciseLogKey}:${setNumber}`])
    .length;
  const setDraft = setDrafts[currentLogKey] ?? {
    reps: String(loggedSet?.reps ?? lastExerciseValues?.reps ?? reps),
    weight: String(loggedSet?.weight ?? lastExerciseValues?.weight ?? ""),
  };
  const restProgress = restDuration > 0
    ? Math.max(0, Math.min(100, (restRemaining / restDuration) * 100))
    : 0;
  const elapsedSeconds = Math.max(
    0,
    Math.floor((now - (startedAtMs ?? localSessionStartRef.current)) / 1000)
  );
  const title =
    session?.workoutTitle || session?.title || session?.day || "Workout";
  const selectedDay = String(session?.day ?? "").toUpperCase();

  const advanceAfterRest = useCallback(() => {
    restDeadlineRef.current = null;
    setIsEditingLoggedSet(false);
    setRestRemaining(0);
    setSetLogError("");
    setSetLogMessage("");

    if (currentSetNumber < setCount) {
      setCurrentSetNumber((current) => current + 1);
      setActiveView("set");
    } else if (selectedIndex < exercises.length - 1) {
      setSelectedIndex((current) => current + 1);
      setCurrentSetNumber(1);
      setActiveView("overview");
    } else {
      setIsEndingSession(true);
      setSessionEndError("");
      endCurrentSession()
        .then(() => setActiveView("complete"))
        .catch((error) => {
          setSessionEndError(error.message || "Could not end this session.");
          setShowExitConfirmation(true);
        })
        .finally(() => setIsEndingSession(false));
    }
  }, [currentSetNumber, endCurrentSession, exercises.length, selectedIndex, setCount]);

  useEffect(() => {
    if (activeView !== "rest" || restDeadlineRef.current == null) return undefined;
    const intervalId = window.setInterval(() => {
      const deadline = restDeadlineRef.current;
      if (deadline == null) return;
      const remaining = Math.max(0, (deadline - Date.now()) / 1000);
      setRestRemaining((current) => Math.abs(current - remaining) < 0.02 ? current : remaining);
      if (remaining === 0) {
        if (loggedSet && !isEditingLoggedSet) advanceAfterRest();
      }
    }, 250);
    return () => window.clearInterval(intervalId);
  }, [activeView, advanceAfterRest, isEditingLoggedSet, loggedSet]);

  function selectExercise(index) {
    setSelectedIndex(index);
    setCurrentSetNumber(1);
    setActiveView("overview");
    setIsEditingLoggedSet(false);
    setSetLogError("");
    setSetLogMessage("");
  }

  function startRestTimer() {
    if (!selectedExercise) return;
    setRestDuration(restDurationSeconds);
    setRestRemaining(restDurationSeconds);
    restDeadlineRef.current = Date.now() + restDurationSeconds * 1000;
    setSetLogError("");
    setSetLogMessage("");
    setIsEditingLoggedSet(false);
    setActiveView("rest");
  }

  function adjustRestTimer(seconds) {
    const currentRemaining = Math.max(
      0,
      Math.ceil(((restDeadlineRef.current ?? Date.now()) - Date.now()) / 1000)
    );
    const remaining = Math.max(0, currentRemaining + seconds);
    restDeadlineRef.current = Date.now() + remaining * 1000;
    setRestRemaining(remaining);
  }

  function updateSetDraft(field, value) {
    setSetDrafts((current) => ({
      ...current,
      [currentLogKey]: {
        ...setDraft,
        [field]: value,
      },
    }));
  }

  async function saveSetLog({ skipRest = false } = {}) {
    const sessionId = Number(session?.sessionId);
    const exerciseId = Number(
      selectedExercise?.id ?? selectedExercise?.exercise_id
    );
    const actualReps = Number(setDraft.reps);
    const actualWeight = Number(setDraft.weight);

    if (!Number.isInteger(sessionId) || sessionId < 1) {
      setSetLogError("This session does not have a valid ID.");
      return;
    }
    if (!Number.isInteger(exerciseId) || exerciseId < 1) {
      setSetLogError("This exercise does not have a valid ID.");
      return;
    }
    if (!Number.isInteger(actualReps) || actualReps < 1) {
      setSetLogError("Enter the number of reps you completed.");
      return;
    }
    if (setDraft.weight.trim() === "" || !Number.isFinite(actualWeight) || actualWeight < 0) {
      setSetLogError("Enter a valid weight, or 0 for bodyweight.");
      return;
    }

    const values = {
      sessionsId: sessionId,
      exerciseId,
      setNumber: currentSetNumber,
      reps: actualReps,
      weight: actualWeight,
      restTime: restDurationSeconds,
    };

    try {
      setIsLoggingSet(true);
      setSetLogError("");
      setSetLogMessage("");
      let logId = loggedSet?.logId ?? null;
      if (loggedSet) {
        if (logId == null) {
          throw new Error("The log API did not return a log ID, so this set cannot be edited yet.");
        }
        const updatedLog = await updateSessionLog(
          logId,
          values.sessionsId,
          values.exerciseId,
          values.setNumber,
          values.reps,
          values.weight,
          values.restTime
        );
        logId = updatedLog?.log_id ?? updatedLog?.id ?? logId;
      } else {
        const newLog = await logSession(
          values.sessionsId,
          values.exerciseId,
          values.setNumber,
          values.reps,
          values.weight,
          values.restTime
        );
        logId =
          newLog?.log_id ??
          newLog?.id ??
          newLog?.data?.log_id ??
          newLog?.data?.id ??
          null;
      }

      const savedValues = {
        logId,
        reps: actualReps,
        weight: actualWeight,
      };
      setLoggedSets((current) => ({ ...current, [currentLogKey]: savedValues }));
      setLastValuesByExercise((current) => ({
        ...current,
        [exerciseLogKey]: savedValues,
      }));
      setSetDrafts((current) => ({ ...current, [currentLogKey]: setDraft }));
      setIsEditingLoggedSet(false);

      if (skipRest) {
        setShowSkipConfirmation(false);
        advanceAfterRest();
      } else if (restRemaining === 0) {
        advanceAfterRest();
      } else {
        setSetLogMessage(
          loggedSet
            ? "Set changes saved."
            : logId == null
              ? "Set logged, but the API did not return a log ID for editing."
              : "Set logged."
        );
      }
    } catch (error) {
      setSetLogError(error.message || "Could not save this set.");
    } finally {
      setIsLoggingSet(false);
    }
  }

  function requestSkipRest() {
    if (loggedSet && !isEditingLoggedSet) {
      advanceAfterRest();
      return;
    }

    const warningDisabled = (() => {
      try {
        return window.localStorage.getItem(SKIP_WARNING_KEY) === "true";
      } catch {
        return false;
      }
    })();

    if (warningDisabled) {
      advanceAfterRest();
    } else {
      setShowSkipConfirmation(true);
    }
  }

  function saveSkipPreference() {
    if (!dontWarnOnSkip) return;
    try {
      window.localStorage.setItem(SKIP_WARNING_KEY, "true");
    } catch {
      // Continue with the current skip action if storage is unavailable.
    }
  }

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
              <button
                type="button"
                className={activeView === "overview" ? "is-current" : ""}
                aria-current={activeView === "overview" ? "step" : undefined}
                disabled={activeView !== "overview"}
                onClick={() => setActiveView("overview")}
              >
                <b>1</b> Overview
              </button>
              <i aria-hidden="true" />
              <button
                type="button"
                className={activeView === "set" ? "is-current" : ""}
                aria-current={activeView === "set" ? "step" : undefined}
                disabled={activeView !== "set"}
                onClick={() => setActiveView("set")}
              >
                <b>2</b> Set
              </button>
              <i aria-hidden="true" />
              <span className={activeView === "rest" || activeView === "complete" ? "is-current" : ""}>
                <b>3</b> {activeView === "complete" ? "Complete" : <>Rest &amp; log</>}
              </span>
            </nav>
          </div>

          <div className="session-overview-session-actions">
            <button
              type="button"
              className="session-overview-exit"
              onClick={() => {
                setSessionEndError("");
                setShowExitConfirmation(true);
              }}
            >
              Leave session
            </button>
            <div className="session-overview-clock" aria-label="Session elapsed time">
              <span />
              {formatElapsed(elapsedSeconds)}
            </div>
          </div>
        </header>

        <div className="session-overview-stage">
          <div
            className={`session-overview-content${activeView === "overview" ? " is-active" : ""}`}
            aria-hidden={activeView !== "overview"}
            inert={activeView !== "overview"}
          >
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
                      onClick={() => selectExercise(index)}
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
                    style={{
                      background: `conic-gradient(#4289fa 0deg ${setCount ? (completedSetCount / setCount) * 360 : 0}deg, #1d3c6a ${setCount ? (completedSetCount / setCount) * 360 : 0}deg 360deg)`,
                    }}
                    role="img"
                    aria-label={`${completedSetCount} of ${setCount} sets completed`}
                  >
                    <div>
                      <strong>{completedSetCount}</strong>
                      <span>/{setCount}</span>
                    </div>
                  </div>
                  <p className="session-overview-set-caption">sets completed</p>
                  <div className="session-overview-set-list">
                    {Array.from({ length: Math.min(setCount, 6) }, (_, index) => (
                      <div
                        className={`session-overview-set-row${index + 1 === currentSetNumber ? " is-ready" : ""}${loggedSets[`${session?.sessionId ?? "session"}:${exerciseLogKey}:${index + 1}`] ? " is-complete" : ""}`}
                        key={index}
                      >
                        <span className="session-overview-set-dot">{index + 1}</span>
                        <span>Set {index + 1}</span>
                        <small>
                          {loggedSets[`${session?.sessionId ?? "session"}:${exerciseLogKey}:${index + 1}`]
                            ? "Complete"
                            : index + 1 === currentSetNumber
                              ? "Ready"
                              : "Up next"}
                        </small>
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
                      <span>Set {currentSetNumber} ready</span>
                      <strong>{reps} reps target</strong>
                    </div>
                    <button
                      type="button"
                      className="session-overview-start-set"
                      onClick={() => setActiveView("set")}
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

          <section
            className={`session-overview-set-view${activeView === "set" ? " is-active" : activeView === "rest" || activeView === "complete" ? " is-before" : ""}`}
            aria-label="Set overview"
            aria-hidden={activeView !== "set"}
            inert={activeView !== "set"}
          >
            {selectedExercise ? (
              <>
                <p className="session-overview-set-kicker">
                  Set {currentSetNumber} of {setCount}
                </p>
                <h1>{exerciseName(selectedExercise)}</h1>
                <strong className="session-overview-rep-target">{reps}</strong>
                <p className="session-overview-rep-label">Target reps</p>
                <div className="session-overview-set-meta">
                  <span>Rest {rest}</span>
                  <span>{setCount} {setCount === 1 ? "set" : "sets"} total</span>
                </div>
                <div className="session-overview-set-dots" aria-label={`Set ${currentSetNumber} of ${setCount}`}>
                  {Array.from({ length: Math.min(setCount, 8) }, (_, index) => (
                    <span
                      key={index}
                      className={index === currentSetNumber - 1 ? "is-current" : index < currentSetNumber - 1 ? "is-complete" : ""}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                {setCount > 8 && (
                  <span className="session-overview-extra-sets">+{setCount - 8}</span>
                )}
                <button
                  type="button"
                  className="session-overview-complete-set"
                  disabled={setCount < 1}
                  onClick={startRestTimer}
                >
                  <span aria-hidden="true">✓</span> Complete set
                </button>
              </>
            ) : (
              <p className="session-overview-no-set">Select an exercise to view its set targets.</p>
            )}
          </section>

          <section
            className={`session-overview-rest-view${activeView === "rest" ? " is-active" : activeView === "complete" ? " is-before" : ""}`}
            aria-label="Rest timer and set logging"
            aria-hidden={activeView !== "rest"}
            inert={activeView !== "rest"}
          >
            {selectedExercise && (
              <>
                <p className="session-overview-set-kicker">
                  Rest · {exerciseName(selectedExercise)}
                </p>
                <div
                  className="session-overview-rest-ring"
                  style={{ "--rest-progress": `${restProgress}%` }}
                  role="timer"
                  aria-label={`${formatElapsed(restRemaining)} remaining`}
                  aria-live="off"
                >
                  <div className="session-overview-rest-ring-center">
                    <strong>{formatElapsed(restRemaining)}</strong>
                    <span>of {formatElapsed(restDuration)}</span>
                  </div>
                </div>

                <div className="session-overview-rest-controls" aria-label="Adjust rest timer">
                  <button
                    type="button"
                    onClick={() => adjustRestTimer(-15)}
                    disabled={restRemaining === 0}
                  >
                    −15 sec
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustRestTimer(15)}
                  >
                    +15 sec
                  </button>
                </div>

                <div className="session-overview-log-fields">
                  <label className="session-overview-log-field session-overview-set-field">
                    <span>Set</span>
                    <span className="session-overview-set-number-input">
                      <strong>{currentSetNumber}</strong>
                      <small>of {setCount}</small>
                    </span>
                  </label>
                  <label className="session-overview-log-field">
                    <span>Reps done</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      value={setDraft.reps}
                      disabled={Boolean(loggedSet) && !isEditingLoggedSet}
                      onChange={(event) => updateSetDraft("reps", event.target.value)}
                    />
                  </label>
                  <label className="session-overview-log-field session-overview-weight-field">
                    <span>Weight</span>
                    <span className="session-overview-weight-input">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        inputMode="decimal"
                        value={setDraft.weight}
                        disabled={Boolean(loggedSet) && !isEditingLoggedSet}
                        onChange={(event) => updateSetDraft("weight", event.target.value)}
                        aria-label="Weight lifted in kilograms"
                      />
                      <small>kg</small>
                    </span>
                  </label>
                </div>

                {restRemaining === 0 && !loggedSet && (
                  <p className="session-overview-rest-complete-hint">
                    Rest complete. Log your set to continue.
                  </p>
                )}
                {setLogError && <p className="session-overview-log-error" role="alert">{setLogError}</p>}
                {setLogMessage && <p className="session-overview-log-message" role="status">{setLogMessage}</p>}

                <div className="session-overview-rest-actions">
                  <button
                    type="button"
                    className="session-overview-skip-rest"
                    onClick={requestSkipRest}
                    disabled={isLoggingSet}
                  >
                    Skip rest
                  </button>
                  <button
                    type="button"
                    className="session-overview-log-set"
                    disabled={isLoggingSet}
                    onClick={() => {
                      if (loggedSet && !isEditingLoggedSet) {
                        if (loggedSet.logId == null) {
                          setSetLogError("The API did not return a log ID, so this set cannot be edited yet.");
                          return;
                        }
                        setSetLogError("");
                        setSetLogMessage("");
                        setIsEditingLoggedSet(true);
                        return;
                      }
                      saveSetLog();
                    }}
                  >
                    {isLoggingSet
                      ? "Saving…"
                      : loggedSet
                        ? isEditingLoggedSet ? "Save changes" : "Edit set"
                        : "Log set"}
                  </button>
                </div>
                <p className="session-overview-next-set-hint">
                  {currentSetNumber < setCount
                    ? `Next: Set ${currentSetNumber + 1} · ${reps} reps target`
                    : selectedIndex < exercises.length - 1
                      ? `Next: ${exerciseName(exercises[selectedIndex + 1])}`
                      : "Final exercise · Finish workout"}
                </p>
              </>
            )}
          </section>

          <section
            className={`session-overview-complete-view${activeView === "complete" ? " is-active" : ""}`}
            aria-label="Workout complete"
            aria-hidden={activeView !== "complete"}
            inert={activeView !== "complete"}
          >
            <span className="session-overview-complete-mark" aria-hidden="true">✓</span>
            <p className="session-overview-set-kicker">Session complete</p>
            <h1>Workout finished</h1>
            <p className="session-overview-complete-copy">
              You logged {Object.keys(loggedSets).filter((key) => key.startsWith(`${session?.sessionId ?? "session"}:`)).length} sets across {exercises.length} exercises.
            </p>
            <button
              type="button"
              className="session-overview-log-set"
              onClick={confirmLeaveSession}
            >
              Finish workout <ArrowIcon />
            </button>
          </section>
        </div>
      </div>

      {showSkipConfirmation && (
        <div
          className="session-overview-confirm-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowSkipConfirmation(false);
          }}
        >
          <section
            className="session-overview-confirm-dialog session-overview-skip-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="session-skip-title"
            aria-describedby="session-skip-copy"
          >
            <span className="session-overview-confirm-mark" aria-hidden="true">!</span>
            <p className="session-overview-eyebrow">
              {skippingEditedSet ? "Unsaved set changes" : "Set not logged"}
            </p>
            <h2 id="session-skip-title">
              {skippingEditedSet
                ? "Discard your changes and skip this rest?"
                : "Skip this rest without saving your set?"}
            </h2>
            <p id="session-skip-copy">
              {skippingEditedSet
                ? "Your previously saved set will stay recorded. You can save these changes or discard them and move on."
                : "You can save the set now, or move on without recording reps and weight."}
            </p>
            {setLogError && (
              <p className="session-overview-log-error" role="alert">{setLogError}</p>
            )}
            <label className="session-overview-skip-preference">
              <input
                type="checkbox"
                checked={dontWarnOnSkip}
                onChange={(event) => setDontWarnOnSkip(event.target.checked)}
              />
              <span>Don’t ask me again</span>
            </label>
            <div className="session-overview-skip-actions">
              <button
                type="button"
                className="session-overview-stay-button"
                onClick={() => setShowSkipConfirmation(false)}
              >
                Continue resting
              </button>
              <button
                type="button"
                className="session-overview-skip-without-button"
                onClick={() => {
                  saveSkipPreference();
                  setShowSkipConfirmation(false);
                  advanceAfterRest();
                }}
              >
                {skippingEditedSet ? "Discard changes & skip" : "Skip without logging"}
              </button>
              <button
                type="button"
                className="session-overview-leave-button"
                disabled={isLoggingSet}
                onClick={() => {
                  saveSkipPreference();
                  saveSetLog({ skipRest: true });
                }}
              >
                {isLoggingSet ? "Saving…" : "Log set & skip rest"}
              </button>
            </div>
          </section>
        </div>
      )}

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
            {sessionEndError && (
              <p className="session-overview-log-error" role="alert">{sessionEndError}</p>
            )}
            <div className="session-overview-confirm-actions">
              <button
                type="button"
                className="session-overview-stay-button"
                disabled={isEndingSession}
                onClick={() => {
                  setShowExitConfirmation(false);
                  setSessionEndError("");
                }}
              >
                Stay in session
              </button>
              <button
                type="button"
                className="session-overview-leave-button"
                disabled={isEndingSession}
                onClick={confirmLeaveSession}
              >
                {isEndingSession ? "Ending session…" : "Leave session"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
