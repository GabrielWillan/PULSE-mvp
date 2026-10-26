
import "./DashBoard.css";
import "./AddWorkoutModal.css";

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAllRoutines, getAllDays } from "../api_components";
import { AddWorkout, ShowWorkout, SearchWorkout } from "../api_components";

const ActivityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 12h4l2.5-7 5 14L17 12h4" />
  </svg>
);

const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 5h16" />
    <path d="M4 12h16" />
    <path d="M4 19h16" />
  </svg>
);

const AddIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m18 6-12 12M6 6l12 12" />
  </svg>
);

const GripIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    {[5, 12, 19].map((y) =>
      [7, 17].map((x) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2" />
      ))
    )}
  </svg>
);

const ChevronIcon = ({ open = false }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ transform: open ? "rotate(180deg)" : "none" }}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

function useToday() {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    const id = setTimeout(
      () => setToday(new Date()),
      nextMidnight - now + 1000
    );

    return () => clearTimeout(id);
  }, [today]);

  return today;
}

function currentToday(date) {
  const weekday = date.toLocaleDateString("en-GB", {
    weekday: "long",
  });

  const dayMonth = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });

  const pad = (n) => String(n).padStart(2, "0");

  return {
    label: `${weekday}, ${dayMonth}`,
    iso: `${date.getFullYear()}-${pad(
      date.getMonth() + 1
    )}-${pad(date.getDate())}`,
  };
}

function titleShowCase() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getWeekNumber(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );

  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);

  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));

  return Math.ceil(
    (((d - yearStart) / 86400000) + 1) / 7
  );
}

const weekdays = [
  "Day 1",
  "Day 2",
  "Day 3",
  "Day 4",
  "Day 5",
  "Day 6",
  "Day 7",
];

function getExerciseName(exercise) {
  if (typeof exercise === "string") return exercise;
  if (!exercise || typeof exercise !== "object") return "";

  if (typeof exercise.exercise === "string") {
    return exercise.exercise;
  }

  if (exercise.exercise && typeof exercise.exercise === "object") {
    const nestedName = getExerciseName(exercise.exercise);
    if (nestedName) return nestedName;
  }

  return (
    exercise.Exercise_Name ??
    exercise.exercise_name ??
    exercise.name ??
    exercise.exerciseName ??
    exercise.label ??
    exercise.title ??
    exercise.display_name ??
    ""
  );
}

function getExerciseId(exercise) {
  if (!exercise || typeof exercise !== "object") return null;

  return (
    exercise.id ??
    exercise.exercise_id ??
    exercise.exerciseId ??
    exercise.catalog_id ??
    null
  );
}

export function DashBoard() {
  const location = useLocation();
  const navigate = useNavigate();
  const clickedRoutine = location.state?.routine;

  const today = useToday();
  const { label, iso } = currentToday(today);
  const titleMessage = titleShowCase();
  const weekNumber = getWeekNumber(today);

  const [selectedDay, setSelectedDay] = useState("Day 1");

  const [selectedRoutineId, setSelectedRoutineId] = useState(
    clickedRoutine?.id ?? null
  );

  const [routines, setRoutines] = useState([]);
  const [routinesLoading, setRoutinesLoading] = useState(true);
  const [routinesError, setRoutinesError] = useState("");

  const [routineDays, setRoutineDays] = useState([]);
  const [daysLoading, setDaysLoading] = useState(false);
  const [daysError, setDaysError] = useState("");

  const [workouts, setWorkouts] = useState([]);
  const [workoutsError, setWorkoutsError] = useState("");
  const [workoutsLoading, setWorkoutsLoading] = useState(false);

  // The modal has two modes: the workout editor and adding an exercise.
  const [isAddWorkoutOpen, setIsAddWorkoutOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [showAddExerciseForm, setShowAddExerciseForm] = useState(false);
  const [expandedExerciseIds, setExpandedExerciseIds] = useState([]);

  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseResults, setExerciseResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedExercise, setSelectedExercise] = useState(null);

  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [restTime, setRestTime] = useState(90);
  const [workoutNote, setWorkoutNote] = useState("");

  const [addWorkoutError, setAddWorkoutError] = useState("");
  const [addWorkoutMessage, setAddWorkoutMessage] = useState("");
  const [addWorkoutLoading, setAddWorkoutLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchRoutines() {
      try {
        setRoutinesLoading(true);
        setRoutinesError("");

        const data = await getAllRoutines();

        if (!isMounted) return;

        const list = Array.isArray(data)
          ? data
          : data?.routines ?? [];

        setRoutines(list);

        setSelectedRoutineId((currentId) => {
          const preferredId = clickedRoutine?.id ?? currentId;

          const stillExists = list.some(
            (routine) => routine.id === preferredId
          );

          return stillExists ? preferredId : list[0]?.id ?? null;
        });
      } catch (error) {
        if (isMounted) {
          setRoutinesError(
            error.message || "Could not load routines."
          );
        }
      } finally {
        if (isMounted) setRoutinesLoading(false);
      }
    }

    fetchRoutines();

    return () => {
      isMounted = false;
    };
  }, [clickedRoutine?.id]);

  async function refreshWorkouts() {
    try {
      setWorkoutsLoading(true);
      setWorkoutsError("");

      const data = await ShowWorkout();
      const list = Array.isArray(data)
        ? data
        : data?.workouts ?? data?.exercises ?? data?.results ?? [];

      setWorkouts(list);
    } catch (error) {
      setWorkoutsError(error.message || "Could not load workouts.");
    } finally {
      setWorkoutsLoading(false);
    }
  }

  useEffect(() => {
    refreshWorkouts();
  }, []);

  useEffect(() => {
    if (!isAddWorkoutOpen || !exerciseSearch.trim()) {
      setExerciseResults([]);
      setSearchError("");
      setSearchLoading(false);
      return undefined;
    }

    let isCurrentSearch = true;

    const timeoutId = setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError("");

        const data = await SearchWorkout(exerciseSearch.trim());

        if (!isCurrentSearch) return;

        const rawResults = Array.isArray(data)
          ? data
          : data?.results ??
            data?.exercises ??
            data?.workouts ??
            data?.data ??
            [];

        const results = Array.isArray(rawResults)
          ? rawResults
          : rawResults?.results ??
            rawResults?.exercises ??
            [];

        setExerciseResults(results);
        setSearchError(
          results.length ? "" : "No matching exercises found."
        );
      } catch (error) {
        if (isCurrentSearch) {
          setExerciseResults([]);
          setSearchError(
            error.message || "Could not search exercises."
          );
        }
      } finally {
        if (isCurrentSearch) setSearchLoading(false);
      }
    }, 250);

    return () => {
      isCurrentSearch = false;
      clearTimeout(timeoutId);
    };
  }, [exerciseSearch, isAddWorkoutOpen]);

  function openAddWorkout() {
    setModalMode("add");
    setShowAddExerciseForm(true);
    setIsAddWorkoutOpen(true);
    setAddWorkoutError("");
    setAddWorkoutMessage("");
  }

  function openWorkoutEditor() {
    setModalMode("edit");
    setShowAddExerciseForm(false);
    setIsAddWorkoutOpen(true);
    setAddWorkoutError("");
    setAddWorkoutMessage("");
    setExpandedExerciseIds([]);
  }

  function closeWorkoutModal() {
    setIsAddWorkoutOpen(false);
    setShowAddExerciseForm(false);
    setExerciseSearch("");
    setExerciseResults([]);
    setSelectedExercise(null);
    setSearchError("");
    setAddWorkoutError("");
    setAddWorkoutMessage("");
  }

  function toggleExerciseSettings(exercise, index) {
    const exerciseKey = String(
      exercise.exercise_detail_id ??
      exercise.detail_id ??
      `${getExerciseId(exercise) ?? "exercise"}-${index}`
    );

    setExpandedExerciseIds((current) =>
      current.includes(exerciseKey)
        ? current.filter((id) => id !== exerciseKey)
        : [...current, exerciseKey]
    );
  }

  async function handleAddWorkout(event) {
    event.preventDefault();
    setAddWorkoutError("");
    setAddWorkoutMessage("");

    const dayId = selectedSession?.id ?? selectedSession?.day_id;
    const exerciseId = getExerciseId(selectedExercise);

    if (dayId == null || !Number.isFinite(Number(dayId))) {
      setAddWorkoutError(
        "The selected routine day has no valid ID."
      );
      return;
    }

    if (exerciseId == null) {
      setAddWorkoutError(
        "The exercise search result must include an exercise ID."
      );
      return;
    }

    try {
      setAddWorkoutLoading(true);

      await AddWorkout(
        Number(dayId),
        Number(exerciseId),
        Number(sets),
        Number(reps),
        Number(restTime),
        workoutNote.trim() || null
      );

      setAddWorkoutMessage("Exercise added successfully.");

      setExerciseSearch("");
      setExerciseResults([]);
      setSelectedExercise(null);
      setWorkoutNote("");

      await refreshWorkouts();

      if (selectedRoutineId) {
        const updatedDays = await getAllDays(selectedRoutineId);

        setRoutineDays(
          Array.isArray(updatedDays)
            ? updatedDays
            : updatedDays?.days ?? updatedDays?.day_names ?? []
        );
      }

      // Keep the editor open after adding an exercise.
      if (modalMode === "edit") {
        setShowAddExerciseForm(false);
      } else {
        closeWorkoutModal();
      }
    } catch (error) {
      setAddWorkoutError(
        error.message || "Could not add the exercise."
      );
    } finally {
      setAddWorkoutLoading(false);
    }
  }

  const selectedRoutine =
    routines.find(
      (routine) => routine.id === selectedRoutineId
    ) ?? null;

  useEffect(() => {
    let isMounted = true;

    async function fetchDays() {
      if (!selectedRoutineId) {
        setRoutineDays([]);
        setDaysLoading(false);
        setDaysError("");
        return;
      }

      try {
        setDaysLoading(true);
        setDaysError("");
        setRoutineDays([]);

        const data = await getAllDays(selectedRoutineId);

        if (!isMounted) return;

        const days = Array.isArray(data)
          ? data
          : data?.days ?? data?.day_names ?? [];

        setRoutineDays(days);
      } catch (error) {
        if (isMounted) {
          setDaysError(
            error.message || "Could not load routine days."
          );
        }
      } finally {
        if (isMounted) setDaysLoading(false);
      }
    }

    fetchDays();

    return () => {
      isMounted = false;
    };
  }, [selectedRoutineId]);

  const weeklyTraining = weekdays.map((day, index) => {
    const apiDay = routineDays.find((item) => {
      const name = String(
        item.day_name ?? item.name ?? ""
      ).replace(/\s/g, "").toLowerCase();

      return name === `day${index + 1}`;
    });

    const exercises = apiDay?.exercises ?? [];
    const isRestDay = apiDay?.is_rest_day === true;

    // The API currently supplies exercises, not a separate workout title.
    // Until a title field is provided, display the first actual exercise.
    let title = "Add session";
    let description = "No workout assigned yet.";

    if (isRestDay) {
      title = "Rest day";
      description = "Recovery and preparation.";
    } else if (exercises.length > 0) {
      title =
        apiDay?.workout_title ??
        apiDay?.title ??
        getExerciseName(exercises[0]) ??
        "Workout";

      description =
        exercises.length === 1
          ? "1 exercise assigned"
          : `${exercises.length} exercises assigned`;
    }

    return {
      id: apiDay?.day_id ?? apiDay?.id ?? null,
      day,
      title,
      description,
      exercises,
      isRestDay,
      hasWorkout: exercises.length > 0,
      completed: false,
    };
  });

  const selectedSession =
    weeklyTraining.find((day) => day.day === selectedDay) ??
    weeklyTraining[0];

  const completedSessions = 0;
  const weeklyGoal = 5;

  const weeklyProgress = Math.min(
    (completedSessions / weeklyGoal) * 100,
    100
  );

  return (
    <div className="dashboard">
      <div className="dashboard-inner">
        <header className="dashboard-hdr">
          <div className="dashboard-left">
            <button
              className="dashboard-menu-btn"
              type="button"
              aria-label="Open menu"
            >
              <MenuIcon />
            </button>

            <div className="dashboard-brand">
              <div className="dashboard-logo">
                <ActivityIcon />
              </div>

              <span className="logo-name">PULSE</span>
            </div>
          </div>

          <div className="dashboard-right">
            <time className="dashboard-date-ovw" dateTime={iso}>
              <span className="dashboard-date-format">{label}</span>
            </time>

            <button
              className="dashboard-add-exercise-btn"
              type="button"
              aria-label="Add exercise"
              onClick={openAddWorkout}
            >
              <AddIcon />
            </button>
          </div>
        </header>

        <main className="dashboard-main">
          <div className="dashboard-titles-container">
            <div className="dashboard-sub-top">
              <span>YOUR TRAINING CALENDAR</span>
            </div>

            <div className="dashboard-title">
              <h1>{titleMessage}</h1>
            </div>

            <div className="dashboard-sub-low">
              <span>
                A quick look at your week and what's next.
              </span>
            </div>
          </div>

          <section
            className="dashboard-weekday-container"
            aria-label="Weekly training calendar"
          >
            <div className="dashboard-weekday-hdr">
              <div className="weekday-hdr-left">
                <span className="weekday-name">
                  Week {weekNumber}
                </span>
              </div>

              <div className="weekday-hdr-right">
                <span className="sessions-mini-tracker">
                  {completedSessions} sessions completed
                </span>
              </div>
            </div>

            <div className="dashboard-weekday-main">
              {weekdays.map((day) => {
                const session = weeklyTraining.find(
                  (item) => item.day === day
                );

                const isSelected = selectedDay === day;

                return (
                  <button
                    className={`weekday-item ${
                      isSelected ? "weekday-item-active" : ""
                    } ${
                      session?.completed
                        ? "weekday-item-completed"
                        : ""
                    }`}
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    aria-pressed={isSelected}
                  >
                    <span>{day}</span>
                    <div className="weekday-checker" />
                  </button>
                );
              })}
            </div>
          </section>

          <section
            className="dashboard-status-container"
            aria-label="Training overview"
          >
            <div className="left-inner-container">
              <article className="current-session">
                <div className="session-card-eyebrow">
                  SELECTED · {selectedSession.day.toUpperCase()}
                </div>

                <h2 className="session-card-title">
                  {daysLoading
                    ? "Loading routine day..."
                    : selectedSession.title}
                </h2>

                <p className="session-card-description">
                  {routinesLoading
                    ? "Loading routines..."
                    : routinesError
                      ? routinesError
                      : daysError
                        ? daysError
                        : !selectedRoutine
                          ? "Create or select a routine to get started."
                          : selectedSession.description}
                </p>

                <div className="current-session-footer">
                  {!selectedSession.hasWorkout ? (
                    <button
                      className="dashboard-primary-btn"
                      type="button"
                      onClick={openAddWorkout}
                    >
                      <AddIcon />
                      Add workout
                    </button>
                  ) : (
                    <>
                      <button
                        className="dashboard-primary-btn"
                        type="button"
                        onClick={openWorkoutEditor}
                      >
                        View workout
                      </button>

                      <button
                        className="dashboard-primary-btn"
                        type="button">
                        <ActivityIcon />
                        Start session
                      </button>
                    </>
                  )}
                </div>

                {isAddWorkoutOpen && (
                  <div
                    className="pulse-modal-backdrop pulse-workout-editor-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                      if (event.target === event.currentTarget) {
                        closeWorkoutModal();
                      }
                    }}
                  >
                    {modalMode === "edit" ? (
                      <section
                        className="pulse-workout-editor pulse-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="pulse-editor-title"
                      >
                        <header className="pulse-editor-header">
                          <div>
                            <div className="pulse-editor-eyebrow">
                              {selectedSession.day.toUpperCase()} · WORKOUT
                            </div>

                            <h2 id="pulse-editor-title">
                              {selectedSession.title}
                            </h2>

                            <p>
                              {selectedSession.exercises.length}{" "}
                              {selectedSession.exercises.length === 1
                                ? "exercise"
                                : "exercises"}{" "}
                              · Edit your routine
                            </p>
                          </div>

                          <button
                            type="button"
                            className="pulse-modal-close"
                            aria-label="Close workout editor"
                            onClick={closeWorkoutModal}
                          >
                            <CloseIcon />
                          </button>
                        </header>

                        <div className="pulse-editor-exercise-list">
                          {selectedSession.exercises.map(
                            (exercise, index) => {
                              const exerciseName =
                                getExerciseName(exercise) ||
                                "Unnamed exercise";

                              const exerciseKey = String(
                                exercise.exercise_detail_id ??
                                exercise.detail_id ??
                                `${getExerciseId(exercise) ?? "exercise"}-${index}`
                              );

                              const isExpanded =
                                expandedExerciseIds.includes(exerciseKey);

                              return (
                                <article
                                  className="pulse-editor-exercise"
                                  key={exerciseKey}
                                >
                                  <div className="pulse-editor-exercise-main">
                                    <span className="pulse-editor-exercise-number">
                                      {index + 1}
                                    </span>

                                    <div className="pulse-editor-exercise-info">
                                      <h3>{exerciseName}</h3>

                                      <p>
                                        {exercise.sets ?? "—"} sets ·{" "}
                                        {exercise.reps ?? "—"} reps ·{" "}
                                        {exercise.rest_time ?? "—"} sec rest
                                      </p>
                                    </div>

                                    <span
                                      className="pulse-editor-grip"
                                      aria-hidden="true"
                                      title="Reordering will be available when supported"
                                    >
                                      <GripIcon />
                                    </span>
                                  </div>

                                  <button
                                    className="pulse-editor-settings-toggle"
                                    type="button"
                                    onClick={() =>
                                      toggleExerciseSettings(exercise, index)
                                    }
                                    aria-expanded={isExpanded}
                                  >
                                    Exercise settings
                                    <ChevronIcon open={isExpanded} />
                                  </button>

                                  {isExpanded && (
                                    <div className="pulse-editor-settings">
                                      <label>
                                        Sets
                                        <input
                                          type="number"
                                          min="1"
                                          value={exercise.sets ?? ""}
                                          readOnly
                                        />
                                      </label>

                                      <label>
                                        Reps
                                        <input
                                          type="number"
                                          min="1"
                                          value={exercise.reps ?? ""}
                                          readOnly
                                        />
                                      </label>

                                      <label>
                                        Rest (seconds)
                                        <input
                                          type="number"
                                          min="0"
                                          value={exercise.rest_time ?? ""}
                                          readOnly
                                        />
                                      </label>

                                      {exercise.note && (
                                        <p className="pulse-editor-note">
                                          <strong>Note:</strong>{" "}
                                          {exercise.note}
                                        </p>
                                      )}

                                      <p className="pulse-editor-readonly-hint">
                                        Editing existing exercise settings
                                        requires an update API.
                                      </p>
                                    </div>
                                  )}
                                </article>
                              );
                            }
                          )}
                        </div>

                        <button
                          className="pulse-editor-add-exercise"
                          type="button"
                          onClick={() => {
                            setShowAddExerciseForm(true);
                            setAddWorkoutError("");
                            setAddWorkoutMessage("");
                          }}
                        >
                          <AddIcon />
                          Add exercise
                        </button>

                        <p className="pulse-editor-help">
                          <span aria-hidden="true">ⓘ</span>
                          Tap an exercise to view its settings. Editing,
                          deleting and reordering saved exercises will
                          require the corresponding API operations.
                        </p>

                        {addWorkoutMessage && (
                          <p className="pulse-editor-success" role="status">
                            {addWorkoutMessage}
                          </p>
                        )}

                        {addWorkoutError && (
                          <p className="pulse-editor-error" role="alert">
                            {addWorkoutError}
                          </p>
                        )}

                        <button
                          className="pulse-editor-save"
                          type="button"
                          onClick={() => {
                            // No update endpoint exists yet, so don't
                            // falsely report that existing edits were saved.
                            closeWorkoutModal();
                          }}
                        >
                          ✓ &nbsp; Save workout
                        </button>
                      </section>
                    ) : (
                      <form
                        onSubmit={handleAddWorkout}
                        className="pulse-add-workout-form pulse-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="pulse-modal-title"
                      >
                        <div className="pulse-modal-heading-row">
                          <div>
                            <h3 id="pulse-modal-title">
                              Add an exercise
                            </h3>

                            <p>
                              Add an exercise to {selectedSession.day}.
                            </p>
                          </div>

                          <button
                            type="button"
                            className="pulse-modal-close"
                            aria-label="Close add exercise form"
                            onClick={closeWorkoutModal}
                          >
                            <CloseIcon />
                          </button>
                        </div>

                        <div className="pulse-exercise-search-wrap">
                          <label htmlFor="pulse-exercise-search">
                            Exercise name
                          </label>

                          <input
                            id="pulse-exercise-search"
                            className="pulse-modal-input"
                            type="search"
                            autoComplete="off"
                            value={exerciseSearch}
                            onChange={(event) => {
                              setExerciseSearch(event.target.value);
                              setSelectedExercise(null);
                              setAddWorkoutError("");
                            }}
                            placeholder="Start typing an exercise name..."
                          />

                          {searchLoading && (
                            <span className="pulse-search-hint">
                              Searching exercises…
                            </span>
                          )}

                          {searchError && (
                            <p role="alert" className="pulse-editor-error">
                              {searchError}
                            </p>
                          )}

                          {exerciseResults.length > 0 && (
                            <div
                              className="pulse-search-results"
                              role="listbox"
                              aria-label="Exercise search results"
                            >
                              {exerciseResults.map((exercise, index) => {
                                const exerciseName =
                                  getExerciseName(exercise) ||
                                  "Unnamed exercise";

                                const exerciseId =
                                  getExerciseId(exercise);

                                const isChosen =
                                  selectedExercise === exercise ||
                                  (
                                    getExerciseId(selectedExercise) != null &&
                                    exerciseId != null &&
                                    String(
                                      getExerciseId(selectedExercise)
                                    ) === String(exerciseId)
                                  );

                                return (
                                  <button
                                    key={`${exerciseId ?? exerciseName}-${index}`}
                                    type="button"
                                    onClick={() => {
                                      setSelectedExercise(exercise);
                                      setExerciseSearch(exerciseName);
                                      setSearchError("");
                                      setAddWorkoutError("");
                                    }}
                                    className={`pulse-search-result ${
                                      isChosen
                                        ? "pulse-search-result-selected"
                                        : ""
                                    }`}
                                    role="option"
                                    aria-selected={Boolean(isChosen)}
                                  >
                                    {exerciseName}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {selectedExercise && (
                            <p>
                              Selected:{" "}
                              {getExerciseName(selectedExercise)}
                            </p>
                          )}
                        </div>

                        <div className="pulse-add-workout-fields">
                          <label>
                            Sets
                            <input
                              type="number"
                              min="1"
                              required
                              value={sets}
                              onChange={(event) =>
                                setSets(event.target.value)
                              }
                            />
                          </label>

                          <label>
                            Reps
                            <input
                              type="number"
                              min="1"
                              required
                              value={reps}
                              onChange={(event) =>
                                setReps(event.target.value)
                              }
                            />
                          </label>

                          <label>
                            Rest (seconds)
                            <input
                              type="number"
                              min="0"
                              required
                              value={restTime}
                              onChange={(event) =>
                                setRestTime(event.target.value)
                              }
                            />
                          </label>
                        </div>

                        <label className="pulse-add-workout-note">
                          Note (optional)
                          <textarea
                            value={workoutNote}
                            onChange={(event) =>
                              setWorkoutNote(event.target.value)
                            }
                            placeholder="Add a note for this exercise..."
                            rows={3}
                          />
                        </label>

                        {addWorkoutError && (
                          <p role="alert" className="pulse-editor-error">
                            {addWorkoutError}
                          </p>
                        )}

                        {addWorkoutMessage && (
                          <p role="status" className="pulse-editor-success">
                            {addWorkoutMessage}
                          </p>
                        )}

                        <div className="pulse-add-workout-actions">
                          <button
                            className="dashboard-primary-btn"
                            type="submit"
                            disabled={
                              addWorkoutLoading || !selectedExercise
                            }
                          >
                            {addWorkoutLoading ? "Adding..." : "Save exercise"}
                          </button>

                          <button
                            type="button"
                            className="pulse-editor-cancel"
                            onClick={() => {
                              if (modalMode === "edit") {
                                setShowAddExerciseForm(false);
                                setExerciseSearch("");
                                setExerciseResults([]);
                                setSelectedExercise(null);
                                setAddWorkoutError("");
                                setAddWorkoutMessage("");
                              } else {
                                closeWorkoutModal();
                              }
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {modalMode === "edit" && showAddExerciseForm && (
                      <div className="pulse-editor-add-overlay">
                        <form
                          onSubmit={handleAddWorkout}
                          className="pulse-add-workout-form pulse-modal"
                          role="dialog"
                          aria-modal="true"
                          aria-labelledby="pulse-add-from-editor-title"
                        >
                          <div className="pulse-modal-heading-row">
                            <div>
                              <h3 id="pulse-add-from-editor-title">
                                Add an exercise
                              </h3>
                              <p>
                                Add an exercise to {selectedSession.day}.
                              </p>
                            </div>

                            <button
                              type="button"
                              className="pulse-modal-close"
                              aria-label="Close add exercise form"
                              onClick={() => setShowAddExerciseForm(false)}
                            >
                              <CloseIcon />
                            </button>
                          </div>

                          <div className="pulse-exercise-search-wrap">
                            <label htmlFor="pulse-editor-exercise-search">
                              Exercise name
                            </label>

                            <input
                              id="pulse-editor-exercise-search"
                              className="pulse-modal-input"
                              type="search"
                              autoComplete="off"
                              value={exerciseSearch}
                              onChange={(event) => {
                                setExerciseSearch(event.target.value);
                                setSelectedExercise(null);
                                setAddWorkoutError("");
                              }}
                              placeholder="Start typing an exercise name..."
                            />

                            {searchLoading && (
                              <span className="pulse-search-hint">
                                Searching exercises…
                              </span>
                            )}

                            {searchError && (
                              <p role="alert" className="pulse-editor-error">
                                {searchError}
                              </p>
                            )}

                            {exerciseResults.map((exercise, index) => {
                              const name =
                                getExerciseName(exercise) ||
                                "Unnamed exercise";

                              const id = getExerciseId(exercise);

                              return (
                                <button
                                  key={`${id ?? name}-${index}`}
                                  type="button"
                                  className="pulse-search-result"
                                  onClick={() => {
                                    setSelectedExercise(exercise);
                                    setExerciseSearch(name);
                                    setSearchError("");
                                  }}
                                >
                                  {name}
                                </button>
                              );
                            })}
                          </div>

                          <div className="pulse-add-workout-fields">
                            <label>
                              Sets
                              <input
                                type="number"
                                min="1"
                                required
                                value={sets}
                                onChange={(event) =>
                                  setSets(event.target.value)
                                }
                              />
                            </label>

                            <label>
                              Reps
                              <input
                                type="number"
                                min="1"
                                required
                                value={reps}
                                onChange={(event) =>
                                  setReps(event.target.value)
                                }
                              />
                            </label>

                            <label>
                              Rest (seconds)
                              <input
                                type="number"
                                min="0"
                                required
                                value={restTime}
                                onChange={(event) =>
                                  setRestTime(event.target.value)
                                }
                              />
                            </label>
                          </div>

                          <label className="pulse-add-workout-note">
                            Note (optional)
                            <textarea
                              value={workoutNote}
                              onChange={(event) =>
                                setWorkoutNote(event.target.value)
                              }
                              placeholder="Add a note for this exercise..."
                              rows={3}
                            />
                          </label>

                          {addWorkoutError && (
                            <p role="alert" className="pulse-editor-error">
                              {addWorkoutError}
                            </p>
                          )}

                          <div className="pulse-add-workout-actions">
                            <button
                              className="dashboard-primary-btn"
                              type="submit"
                              disabled={
                                addWorkoutLoading || !selectedExercise
                              }
                            >
                              {addWorkoutLoading
                                ? "Adding..."
                                : "Save exercise"}
                            </button>

                            <button
                              type="button"
                              className="pulse-editor-cancel"
                              onClick={() => setShowAddExerciseForm(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </article>

              <article className="last-session">
                <div className="section-card-heading">
                  <h2>Last session</h2>
                  <span className="last-session-day">
                    No session history
                  </span>
                </div>

                <div className="last-session-content">
                  <h3>No completed workouts yet</h3>
                  <p>
                    Session history will appear here when connected
                    to the sessions API.
                  </p>
                </div>
              </article>
            </div>

            <div className="right-inner-container">
              <article className="calorie-tracker">
                <div className="section-card-heading">
                  <h2>Calorie tracker</h2>
                </div>

                <div className="calorie-tracker-content">
                  <h3>Coming later</h3>
                  <p>
                    Nutrition and daily calorie tracking will be
                    developed in a future update.
                  </p>
                  <span className="coming-soon-label">
                    IN DEVELOPMENT
                  </span>
                </div>
              </article>

              <article className="weekly-progress">
                <div className="section-card-heading">
                  <h2>Week at a glance</h2>
                </div>

                <div className="weekly-progress-main">
                  <div className="weekly-progress-number">
                    {completedSessions}
                  </div>

                  <div className="weekly-progress-label">
                    <span>sessions</span>
                    <span>completed</span>
                  </div>
                </div>

                <div
                  className="weekly-progress-track"
                  role="progressbar"
                  aria-label="Weekly session goal"
                  aria-valuemin={0}
                  aria-valuemax={weeklyGoal}
                  aria-valuenow={completedSessions}
                >
                  <div
                    className="weekly-progress-fill"
                    style={{ width: `${weeklyProgress}%` }}
                  />
                </div>

                <p className="weekly-progress-caption">
                  Session history will determine your weekly progress.
                </p>
              </article>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
