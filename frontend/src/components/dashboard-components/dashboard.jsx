

import "./DashBoard.css";
import "./AddWorkoutModal.css";



import { useEffect, useState } from "react";

import { useLocation } from "react-router-dom";

import { getAllRoutines, getAllDays } from "../api_components";

import { AddWorkout } from "../api_components";

import { ShowWorkout } from "../api_components";

import { SearchWorkout } from "../api_components";



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


function getExerciseName(exercise) {
  if (typeof exercise === "string") return exercise;
  if (!exercise || typeof exercise !== "object") return "";

  // Some API responses wrap the actual exercise record in `exercise`.
  if (typeof exercise.exercise === "string") return exercise.exercise;
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

  // Workout and exercise-search state.
  const [workouts, setWorkouts] = useState([]);
  const [workoutsError, setWorkoutsError] = useState("");
  const [workoutsLoading, setWorkoutsLoading] = useState(false);
  const [isAddWorkoutOpen, setIsAddWorkoutOpen] = useState(false);
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



  // Load saved workouts from the backend.
  async function refreshWorkouts() {
    try {
      setWorkoutsLoading(true);
      setWorkoutsError("");
      const data = await ShowWorkout();
      const list = Array.isArray(data)
        ? data
        : data.workouts ?? data.exercises ?? data.results ?? [];
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

  // Live exercise autocomplete: search shortly after the user stops typing.
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
        console.log("SearchWorkout response:", data);
        if (!isCurrentSearch) return;
        const rawResults = Array.isArray(data)
          ? data
          : data?.results ?? data?.exercises ?? data?.workouts ?? data?.data ?? [];
        const results = Array.isArray(rawResults)
          ? rawResults
          : Array.isArray(rawResults?.results)
            ? rawResults.results
            : Array.isArray(rawResults?.exercises)
              ? rawResults.exercises
              : [];
        setExerciseResults(results);
        setSearchError(results.length ? "" : "No matching exercises found.");
      } catch (error) {
        if (isCurrentSearch) {
          setExerciseResults([]);
          setSearchError(error.message || "Could not search exercises.");
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

  async function handleAddWorkout(event) {
    event.preventDefault();
    setAddWorkoutError("");
    setAddWorkoutMessage("");

    const dayId = selectedSession?.id ?? selectedSession?.day_id;
    const exerciseId = getExerciseId(selectedExercise);

    if (dayId == null || !Number.isFinite(Number(dayId))) {
      console.error("Missing routine day ID", {
        selectedSession,
        routineDays,
        selectedRoutineId,
      });
      setAddWorkoutError("The selected routine day has no day ID. Check the browser console for the selected day and API response.");
      return;
    }
    if (!exerciseId) {
      setAddWorkoutError(
        "The search API returned exercise names without IDs. The backend must return each exercise's id and name before it can be added."
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
      // Refresh the selected routine's days so the new exercise appears.
      if (selectedRoutineId) {
        const updatedDays = await getAllDays(selectedRoutineId);
        setRoutineDays(Array.isArray(updatedDays) ? updatedDays : updatedDays.days ?? updatedDays.day_names ?? []);
      }
    } catch (error) {
      setAddWorkoutError(error.message || "Could not add the exercise.");
    } finally {
      setAddWorkoutLoading(false);
    }
  }

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
        console.log("Routine days returned by API:", data);

        if (!isMounted) return;



// Supports either an array or an object containing a days array.

        const days = Array.isArray(data)

          ? data

          : data.days ?? data.day_names ?? [];



        console.log("Normalized routine days:", days);
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

  useEffect(() => {
    console.log("Routine days in state:", routineDays);
    console.log("Selected session:", selectedSession);
  }, [routineDays, selectedRoutineId, selectedDay]);



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

  
                       key={`${selectedSession.id}-${exercise.exercise_id ?? exercise.id ?? index}`}


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
                  <button
                    className="dashboard-primary-btn"
                    type="button"
                    onClick={() => {
                      setIsAddWorkoutOpen((isOpen) => !isOpen);
                      setAddWorkoutError("");
                      setAddWorkoutMessage("");
                    }}
                    aria-expanded={isAddWorkoutOpen}
                  >
                    <AddIcon />
                    {isAddWorkoutOpen ? "Close form" : "Add workout"}
                  </button>
                </div>

                {isAddWorkoutOpen && (
                  <div
                    className="pulse-modal-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                      if (event.target === event.currentTarget) setIsAddWorkoutOpen(false);
                    }}
                  >
                  <form onSubmit={handleAddWorkout} className="pulse-add-workout-form pulse-modal" role="dialog" aria-modal="true" aria-labelledby="pulse-modal-title">
                    <div>
                      <div className="pulse-modal-heading-row">
                      <div>
                      <h3 id="pulse-modal-title" style={{ margin: "0 0 6px" }}>Add an exercise</h3>
                      <p style={{ margin: 0, opacity: 0.75, fontSize: "0.9rem" }}>
                        Add an exercise to {selectedSession.day}.
                      </p>
                      </div>
                      <button type="button" className="pulse-modal-close" aria-label="Close add workout form" onClick={() => setIsAddWorkoutOpen(false)}>×</button>
                      </div>
                    </div>

                    <div className="pulse-exercise-search-wrap" style={{ display: "grid", gap: "8px" }}>
                      <label htmlFor="pulse-exercise-search">Exercise name</label>
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
                      {searchLoading && <span className="pulse-search-hint">Searching exercises…</span>}
                      {searchError && (
                        <p role="alert" style={{ margin: 0, color: "#fca5a5" }}>{searchError}</p>
                      )}
                      {exerciseResults.length > 0 && (
                        <div className="pulse-search-results" role="listbox" aria-label="Exercise search results">
                          {exerciseResults.map((exercise, index) => {
                            const exerciseName = getExerciseName(exercise) || "Unnamed exercise";
                            const exerciseId = getExerciseId(exercise);
                            const exerciseKey = exerciseId ?? exerciseName;
                            const selectedId = getExerciseId(selectedExercise);
                            const isChosen = selectedExercise === exercise || (
                              selectedId != null &&
                              exerciseId != null &&
                              String(selectedId) === String(exerciseId)
                            );
                            return (
                              <button
                                key={`${exerciseKey}-${index}`}
                                type="button"
                                onClick={() => {
                                  const name = getExerciseName(exercise);
                                  setSelectedExercise(exercise);
                                  setExerciseSearch(name);
                                  setSearchError("");
                                  setAddWorkoutError("");
                                }}
                                className={`pulse-search-result ${isChosen ? "pulse-search-result-selected" : ""}`}
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
                        <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.8 }}>
                          Selected: {getExerciseName(selectedExercise) || "Unnamed exercise"}
                        </p>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px" }}>
                      <label style={{ display: "grid", gap: "6px" }}>
                        Sets
                        <input type="number" min="1" required value={sets} onChange={(event) => setSets(event.target.value)} />
                      </label>
                      <label style={{ display: "grid", gap: "6px" }}>
                        Reps
                        <input type="number" min="1" required value={reps} onChange={(event) => setReps(event.target.value)} />
                      </label>
                      <label style={{ display: "grid", gap: "6px" }}>
                        Rest (seconds)
                        <input type="number" min="0" required value={restTime} onChange={(event) => setRestTime(event.target.value)} />
                      </label>
                    </div>

                    <label style={{ display: "grid", gap: "6px" }}>
                      Note (optional)
                      <textarea
                        value={workoutNote}
                        onChange={(event) => setWorkoutNote(event.target.value)}
                        placeholder="Add a note for this exercise..."
                        rows={3}
                      />
                    </label>

                    {addWorkoutError && (
                      <p role="alert" style={{ margin: 0, color: "#fca5a5" }}>{addWorkoutError}</p>
                    )}
                    {addWorkoutMessage && (
                      <p role="status" style={{ margin: 0, color: "#86efac" }}>{addWorkoutMessage}</p>
                    )}

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button className="dashboard-primary-btn" type="submit" disabled={addWorkoutLoading || !selectedExercise}>
                        {addWorkoutLoading ? "Adding..." : "Save workout"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddWorkoutOpen(false)}
                        style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(148, 163, 184, 0.25)", background: "transparent", color: "inherit", cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                    </div>
                    {exerciseResults.some((exercise) => typeof exercise === "string") && (
                      <p style={{ margin: 0, fontSize: "0.82rem", opacity: 0.7 }}>
                        If search returns names only, the API must also return each exercise ID to save it.
                      </p>
                    )}
                  </form>
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
