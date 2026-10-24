
import "./DashBoard.css";

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getAllRoutines, getAllDays } from "../api_components";

const ActivityIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 12h4l2.5-7 5 14L17 12h4" />
  </svg>
);

const MenuIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 5h16" />
    <path d="M4 12h16" />
    <path d="M4 19h16" />
  </svg>
);

const AddIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const ArrowIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
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

  if (hour < 12) {
    return "Good morning";
  } else if (hour < 18) {
    return "Good afternoon";
  } else {
    return "Good evening";
  }
}

function getWeekNumber(date) {
  const d = new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    )
  );

  const day = d.getUTCDay() || 7;

  d.setUTCDate(d.getUTCDate() + 4 - day);

  const yearStart = new Date(
    Date.UTC(d.getUTCFullYear(), 0, 1)
  );

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

export function DashBoard() {
  const location = useLocation();
  const clickedRoutine = location.state?.routine;

  const today = useToday();
  const { label, iso } = currentToday(today);
  const titleMessage = titleShowCase();
  const weekNumber = getWeekNumber(today);

  const [selectedDay, setSelectedDay] = useState("Day 1");

  // Selected routine passed from the menu through React Router.
  const [selectedRoutineId, setSelectedRoutineId] = useState(
    clickedRoutine?.id ?? null
  );

  // Routines loaded from the backend.
  const [routines, setRoutines] = useState([]);
  const [routinesLoading, setRoutinesLoading] = useState(true);
  const [routinesError, setRoutinesError] = useState("");

  // Routine days loaded from the API.
  const [routineDays, setRoutineDays] = useState([]);
  const [daysLoading, setDaysLoading] = useState(false);
  const [daysError, setDaysError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchRoutines() {
      try {
        setRoutinesLoading(true);
        setRoutinesError("");

        const data = await getAllRoutines();

        if (!isMounted) return;

        setRoutines(data);

        // Prefer the routine clicked in the menu.
        // Otherwise retain the current selection or select the first routine.
        setSelectedRoutineId((currentId) => {
          const preferredId = clickedRoutine?.id ?? currentId;

          const stillExists = data.some(
            (routine) => routine.id === preferredId
          );

          return stillExists
            ? preferredId
            : data[0]?.id ?? null;
        });
      } catch (error) {
        if (isMounted) {
          setRoutinesError(
            error.message || "Could not load routines."
          );
        }
      } finally {
        if (isMounted) {
          setRoutinesLoading(false);
        }
      }
    }

    fetchRoutines();

    return () => {
      isMounted = false;
    };
  }, [clickedRoutine?.id]);

  const selectedRoutine =
    routines.find(
      (routine) => routine.id === selectedRoutineId
    ) ?? null;

  // Fetch real days whenever the selected routine changes.
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

        // Supports either an array or an object containing a days array.
        const days = Array.isArray(data)
          ? data
          : data.days ?? data.day_names ?? [];

        setRoutineDays(days);
      } catch (error) {
        if (isMounted) {
          setDaysError(
            error.message || "Could not load routine days."
          );
        }
      } finally {
        if (isMounted) {
          setDaysLoading(false);
        }
      }
    }

    fetchDays();

    return () => {
      isMounted = false;
    };
  }, [selectedRoutineId]);

  // Match the seven calendar labels to the real API day names.
  const weeklyTraining = weekdays.map((day, index) => {
    const apiDay = routineDays.find((item) => {
      const name = String(
        item.day_name ?? item.name ?? ""
      ).replace(/\s/g, "").toLowerCase();

      return (
        name === `day${index + 1}` ||
        name === `day${index + 1}`.toLowerCase()
      );
    });

    const exercises = apiDay?.exercises ?? [];
    const isRestDay = apiDay?.is_rest_day === true;

    let title = "Add session";
    let description = "No workout assigned yet.";

    if (isRestDay) {
      title = "Rest day";
      description = "Recovery and preparation.";
    } else if (exercises.length > 0) {
      title = exercises[0].exercise_name ??
        exercises[0].name ??
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

  // Completion requires session-history data, which is not loaded here.
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
              <span className="dashboard-date-format">
                {label}
              </span>
            </time>

            <button
              className="dashboard-add-exercise-btn"
              type="button"
              aria-label="Add exercise"
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

                {selectedSession.exercises.length > 0 && (
                  <ul className="session-card-description">
                    {selectedSession.exercises.map((exercise, index) => (
                      <li
                        key={
                          exercise.exercise_id ??
                          exercise.id ??
                          `${selectedSession.id}-${index}`
                        }
                      >
                        {exercise.exercise_name ?? exercise.name}
                        {exercise.sets != null &&
                          ` · ${exercise.sets} sets`}
                        {exercise.reps != null &&
                          ` × ${exercise.reps} reps`}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="current-session-footer">
                  {selectedSession.isRestDay ? (
                    <span className="rest-day-label">
                      Recovery day
                    </span>
                  ) : selectedSession.hasWorkout ? (
                    <button
                      className="dashboard-primary-btn"
                      type="button"
                    >
                      View day
                      <ArrowIcon />
                    </button>
                  ) : (
                    <span className="rest-day-label">
                      Add session
                    </span>
                  )}
                </div>
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
                    Session history will appear here when
                    connected to the sessions API.
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
                    Nutrition and daily calorie tracking will
                    be developed in a future update.
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
