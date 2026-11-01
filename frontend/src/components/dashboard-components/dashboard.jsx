import "./DashBoard.css";
import "./AddWorkoutModal.css";
import "./PulseEditorExerciseEdit.css";
import "./SessionPreview.css";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAllRoutines, getAllDays } from "../api_components";
import { AddWorkout, ShowWorkout, SearchWorkout, UpdateWorkoutTitle, EditWorkout, ReorderWorkoutExercises } from "../api_components";
// Route of the routine menu screen (used by "Go back to menu").
const MENU_ROUTE = "/";
const REST_UNIT_PREFERENCES_KEY = "pulse.exerciseRestUnits";
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
function getExerciseDetailId(exercise) {
  if (!exercise || typeof exercise !== "object") return null;
  return (
    exercise.exercise_detail_id ??
    exercise.exerciseDetailId ??
    exercise.detail_id ??
    exercise.detailId ??
    null
  );
}
function convertRestTimeUnit(value, fromUnit, toUnit) {
  if (fromUnit === toUnit || value === "" || value == null) return value;
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return value;
  const seconds = fromUnit === "minutes" ? numericValue * 60 : numericValue;
  const converted = toUnit === "minutes" ? seconds / 60 : seconds;
  return String(Number(converted.toFixed(2)));
}
function readRestUnitPreferences() {
  if (typeof window === "undefined") return {};
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(REST_UNIT_PREFERENCES_KEY) ?? "{}"
    );
    return stored && typeof stored === "object" && !Array.isArray(stored)
      ? stored
      : {};
  } catch {
    return {};
  }
}
function createExerciseEditDraft(exercise, restUnit = "seconds") {
  const restTimeSeconds = exercise.rest_time ?? 90;
  return {
    exerciseId: getExerciseId(exercise) ?? "",
    exerciseName: getExerciseName(exercise),
    sets: exercise.sets ?? 3,
    reps: exercise.reps ?? 10,
    restTime: convertRestTimeUnit(restTimeSeconds, "seconds", restUnit),
    restUnit,
    note: exercise.note ?? "",
    selectedExercise: null,
  };
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
// Header menu dropdown
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
// Close the dropdown on outside click or Escape.
  useEffect(() => {
    if (!isMenuOpen) return undefined;
    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") setIsMenuOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);
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
  const [isSessionPreviewOpen, setIsSessionPreviewOpen] = useState(false);
  const [sessionPreviewMessage, setSessionPreviewMessage] = useState("");
  const [showDayTitleForm, setShowDayTitleForm] = useState(false);
  const [workoutTitleInput, setWorkoutTitleInput] = useState("");
  const [titleSaveLoading, setTitleSaveLoading] = useState(false);
  const [titleSaveError, setTitleSaveError] = useState("");
  const [modalMode, setModalMode] = useState("add");
  const [showAddExerciseForm, setShowAddExerciseForm] = useState(false);
  const [selectedEditorExerciseKey, setSelectedEditorExerciseKey] =
    useState(null);
  const [exerciseEditDrafts, setExerciseEditDrafts] = useState({});
  const [exerciseRestUnitPreferences, setExerciseRestUnitPreferences] =
    useState(readRestUnitPreferences);
  const [savingExerciseKey, setSavingExerciseKey] = useState(null);
  const [exerciseOrderByDay, setExerciseOrderByDay] = useState({});
  const [draggedExerciseKey, setDraggedExerciseKey] = useState(null);
  const [dropTargetExerciseKey, setDropTargetExerciseKey] = useState(null);
  const [savingExerciseOrder, setSavingExerciseOrder] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseResults, setExerciseResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [restTime, setRestTime] = useState(90);
  const [restUnit, setRestUnit] = useState("seconds");
  const [workoutNote, setWorkoutNote] = useState("");
  const [addWorkoutError, setAddWorkoutError] = useState("");
  const [addWorkoutMessage, setAddWorkoutMessage] = useState("");
  const [addWorkoutLoading, setAddWorkoutLoading] = useState(false);
  useEffect(() => {
    if (!isSessionPreviewOpen) return undefined;
    function closeOnEscape(event) {
      if (event.key === "Escape") setIsSessionPreviewOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isSessionPreviewOpen]);
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
  function openAddWorkoutForm() {
    setModalMode("add");
    setShowAddExerciseForm(true);
    setIsAddWorkoutOpen(true);
    setAddWorkoutError("");
    setAddWorkoutMessage("");
  }

  function openAddWorkout() {
    if (selectedSession?.workoutTitle?.trim()) {
      openAddWorkoutForm();
      return;
    }
    setWorkoutTitleInput("");
    setTitleSaveError("");
    setShowDayTitleForm(true);
  }

  async function handleSaveDayTitle(event) {
    event.preventDefault();
    setTitleSaveError("");
    const dayId = selectedSession?.id ?? selectedSession?.day_id;
    if (dayId == null) {
      setTitleSaveError("The selected routine day has no valid ID.");
      return;
    }
    const title = workoutTitleInput.trim() || selectedSession.day;
    try {
      setTitleSaveLoading(true);
      await UpdateWorkoutTitle(Number(dayId), title);
      const updatedDays = await getAllDays(selectedRoutineId);
      setRoutineDays(
        Array.isArray(updatedDays)
          ? updatedDays
          : updatedDays?.days ?? updatedDays?.day_names ?? []
      );
      setShowDayTitleForm(false);
      setWorkoutTitleInput("");
      openAddWorkoutForm();
    } catch (error) {
      setTitleSaveError(error.message || "Could not save the workout title.");
    } finally {
      setTitleSaveLoading(false);
    }
  }
  function openWorkoutEditor() {
    setModalMode("edit");
    setShowAddExerciseForm(false);
    setIsAddWorkoutOpen(true);
    setAddWorkoutError("");
    setAddWorkoutMessage("");
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
  function getExerciseKey(exercise, index) {
    return String(
      getExerciseDetailId(exercise) ??
      `${getExerciseId(exercise) ?? "exercise"}-${index}`
    );
  }
  function moveExerciseToIndex(exerciseKey, targetIndex) {
    const dayId = selectedSession?.id ?? selectedSession?.day_id;
    const dayKey = String(dayId ?? "");
    const currentExercises = selectedSession?.exercises ?? [];
    const sourceIndex = currentExercises.findIndex(
      (exercise, index) => getExerciseKey(exercise, index) === exerciseKey
    );

    if (
      !dayKey ||
      sourceIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= currentExercises.length ||
      sourceIndex === targetIndex
    ) {
      return;
    }

    const reordered = [...currentExercises];
    const [movedExercise] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, movedExercise);
    const orderedDetailIds = reordered.map(getExerciseDetailId);

    if (orderedDetailIds.some((id) => id == null || id === "")) {
      setAddWorkoutError(
        "Couldn't reorder this workout because an exercise detail ID is missing."
      );
      return;
    }

    setExerciseOrderByDay((current) => ({
      ...current,
      [dayKey]: orderedDetailIds.map(String),
    }));
    setAddWorkoutError("");
    setAddWorkoutMessage("");
  }
  async function handleSaveWorkoutOrder() {
    const dayId = selectedSession?.id ?? selectedSession?.day_id;
    const dayKey = String(dayId ?? "");
    const orderedIds = exerciseOrderByDay[dayKey];

    if (!orderedIds) {
      closeWorkoutModal();
      return;
    }

    const numericDayId = Number(dayId);
    const numericExerciseDetailIds = orderedIds.map(Number);
    if (
      !Number.isInteger(numericDayId) ||
      numericDayId < 1 ||
      numericExerciseDetailIds.some(
        (id) => !Number.isInteger(id) || id < 1
      )
    ) {
      setAddWorkoutError("The workout or exercise IDs are invalid.");
      return;
    }

    try {
      setSavingExerciseOrder(true);
      setAddWorkoutError("");
      setAddWorkoutMessage("");
      await ReorderWorkoutExercises({
        day_id: numericDayId,
        exercise_detail_ids: numericExerciseDetailIds,
      });
      const updatedDays = await getAllDays(selectedRoutineId);
      const days = Array.isArray(updatedDays)
        ? updatedDays
        : updatedDays?.days ?? updatedDays?.day_names ?? [];
      setRoutineDays(days);
      setExerciseOrderByDay((current) => {
        const next = { ...current };
        delete next[dayKey];
        return next;
      });
      closeWorkoutModal();
    } catch (error) {
      setAddWorkoutError(
        error.message || "Could not save the exercise order."
      );
    } finally {
      setSavingExerciseOrder(false);
    }
  }
  function getRestUnitPreferenceKey(detailId) {
    return `${selectedRoutineId ?? "unselected"}:${detailId}`;
  }

  function getExerciseRestUnitPreference(exercise) {
    const detailId = getExerciseDetailId(exercise);
    if (detailId == null) return "seconds";
    return exerciseRestUnitPreferences[getRestUnitPreferenceKey(detailId)] ===
      "minutes"
      ? "minutes"
      : "seconds";
  }

  function rememberExerciseRestUnit(detailId, unit) {
    if (detailId == null) return;
    const nextPreferences = {
      ...exerciseRestUnitPreferences,
      [getRestUnitPreferenceKey(detailId)]:
        unit === "minutes" ? "minutes" : "seconds",
    };
    setExerciseRestUnitPreferences(nextPreferences);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(
          REST_UNIT_PREFERENCES_KEY,
          JSON.stringify(nextPreferences)
        );
      } catch {
        // The current page still keeps the selected unit if storage is unavailable.
      }
    }
  }

  function getExerciseEditDraft(exercise, exerciseKey) {
    return (
      exerciseEditDrafts[exerciseKey] ??
      createExerciseEditDraft(
        exercise,
        getExerciseRestUnitPreference(exercise)
      )
    );
  }

  function updateExerciseEditDraft(exercise, exerciseKey, updates) {
    setExerciseEditDrafts((current) => ({
      ...current,
      [exerciseKey]: {
        ...createExerciseEditDraft(
          exercise,
          getExerciseRestUnitPreference(exercise)
        ),
        ...current[exerciseKey],
        ...updates,
      },
    }));
  }

  async function handleSaveExerciseEdit(exercise, exerciseKey) {
    const draft = getExerciseEditDraft(exercise, exerciseKey);
    const dayId = selectedSession?.id ?? selectedSession?.day_id;
    const detailId = getExerciseDetailId(exercise);
    const nextExerciseId = draft.selectedExercise
      ? getExerciseId(draft.selectedExercise)
      : draft.exerciseId;

    const numericDayId = Number(dayId);
    const numericDetailId = Number(detailId);
    const numericExerciseId = Number(nextExerciseId);
    const numericSets = Number(draft.sets);
    const numericReps = Number(draft.reps);
    const numericRestTime =
      Number(draft.restTime) * (draft.restUnit === "minutes" ? 60 : 1);

    if (!Number.isInteger(numericDayId) || numericDayId < 1) {
      setAddWorkoutError("The selected routine day has no valid ID.");
      return;
    }
    if (!Number.isInteger(numericDetailId) || numericDetailId < 1) {
      setAddWorkoutError(
        "Couldn't identify the saved exercise to update. Its exercise detail ID is missing from the loaded routine data."
      );
      return;
    }
    if (!Number.isInteger(numericExerciseId) || numericExerciseId < 1) {
      setAddWorkoutError("Choose a valid exercise before saving.");
      return;
    }
    if (
      !Number.isInteger(numericSets) || numericSets < 1 ||
      !Number.isInteger(numericReps) || numericReps < 1
    ) {
      setAddWorkoutError("Sets and reps must be whole numbers of at least 1.");
      return;
    }
    if (!Number.isInteger(numericRestTime) || numericRestTime < 0) {
      setAddWorkoutError(
        "Rest time must resolve to a whole number of seconds."
      );
      return;
    }

    try {
      setSavingExerciseKey(exerciseKey);
      setAddWorkoutError("");
      setAddWorkoutMessage("");
      // EditWorkout updates this saved exercise detail using the existing API helper.
      await EditWorkout({
        day_id: numericDayId,
        exercise_detail_id: numericDetailId,
        exercise_id: numericExerciseId,
        sets: numericSets,
        reps: numericReps,
        rest_time: numericRestTime,
        note: String(draft.note ?? "").trim() || null,
      });
      rememberExerciseRestUnit(numericDetailId, draft.restUnit);
      const updatedDays = await getAllDays(selectedRoutineId);
      const days = Array.isArray(updatedDays)
        ? updatedDays
        : updatedDays?.days ?? updatedDays?.day_names ?? [];
      setRoutineDays(days);
      setExerciseEditDrafts((current) => {
        const next = { ...current };
        delete next[exerciseKey];
        return next;
      });
      setExerciseSearch("");
      setExerciseResults([]);
      setSelectedExercise(null);
      setAddWorkoutMessage(`${draft.selectedExercise ? getExerciseName(draft.selectedExercise) : draft.exerciseName} updated successfully.`);
    } catch (error) {
      setAddWorkoutError(error.message || "Could not update this exercise.");
    } finally {
      setSavingExerciseKey(null);
    }
  }
  function handleAddRestUnitChange(event) {
    const nextUnit = event.target.value;
    setRestTime((currentValue) =>
      convertRestTimeUnit(currentValue, restUnit, nextUnit)
    );
    setRestUnit(nextUnit);
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
    const restTimeSeconds =
      Number(restTime) * (restUnit === "minutes" ? 60 : 1);
    if (!Number.isInteger(restTimeSeconds) || restTimeSeconds < 0) {
      setAddWorkoutError(
        "Rest time must resolve to a whole number of seconds."
      );
      return;
    }
    const chosenRestUnit = restUnit;
    const existingDetailIds = new Set(
      (selectedSession?.exercises ?? [])
        .map(getExerciseDetailId)
        .filter((detailId) => detailId != null)
        .map(String)
    );
    try {
      setAddWorkoutLoading(true);
      const addResult = await AddWorkout(
        Number(dayId),
        Number(exerciseId),
        Number(sets),
        Number(reps),
        restTimeSeconds,
        workoutNote.trim() || null
      );
      let addedDetailId =
        addResult?.exercise_detail_id ??
        addResult?.exerciseDetailId ??
        addResult?.detail_id ??
        null;
      setAddWorkoutMessage("Exercise added successfully.");
      setExerciseSearch("");
      setExerciseResults([]);
      setSelectedExercise(null);
      setWorkoutNote("");
      await refreshWorkouts();
      if (selectedRoutineId) {
        const updatedDays = await getAllDays(selectedRoutineId);
        const days = Array.isArray(updatedDays)
          ? updatedDays
          : updatedDays?.days ?? updatedDays?.day_names ?? [];
        setRoutineDays(days);
        const updatedDay = days.find(
          (day) =>
            String(day.day_id ?? day.id ?? "") === String(dayId)
        );
        const newlyAddedExercise = updatedDay?.exercises?.find(
          (exercise) => {
            const detailId = getExerciseDetailId(exercise);
            return (
              detailId != null &&
              !existingDetailIds.has(String(detailId)) &&
              String(getExerciseId(exercise)) === String(exerciseId)
            );
          }
        );
        addedDetailId =
          getExerciseDetailId(newlyAddedExercise) ?? addedDetailId;
      }
      if (addedDetailId != null) {
        rememberExerciseRestUnit(addedDetailId, chosenRestUnit);
        if (modalMode === "edit") {
          setSelectedEditorExerciseKey(String(addedDetailId));
        }
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
    const baseExercises = apiDay?.exercises ?? [];
    const savedLocalOrder = exerciseOrderByDay[String(apiDay?.id ?? "")];
    const exercises = savedLocalOrder
      ? [...baseExercises].sort((left, right) => {
          const leftIndex = savedLocalOrder.indexOf(
            String(getExerciseDetailId(left))
          );
          const rightIndex = savedLocalOrder.indexOf(
            String(getExerciseDetailId(right))
          );
          return (leftIndex < 0 ? savedLocalOrder.length : leftIndex) -
            (rightIndex < 0 ? savedLocalOrder.length : rightIndex);
        })
      : baseExercises;
    const isRestDay = apiDay?.is_rest_day === true;
    const savedWorkoutTitle = String(apiDay?.workout_title ?? "").trim();
    let title = savedWorkoutTitle || day;
    let description = "No workout assigned yet.";
    if (isRestDay) {
      title = "Rest day";
      description = "Recovery and preparation.";
    } else if (exercises.length > 0) {
      title =
        savedWorkoutTitle ||
        apiDay?.title ||
        getExerciseName(exercises[0]) ||
        day;
      description =
        exercises.length === 1
          ? "1 exercise assigned"
          : `${exercises.length} exercises assigned`;
    }
    return {
      id: apiDay?.day_id ?? apiDay?.id ?? null,
      day,
      title,
      workoutTitle: savedWorkoutTitle,
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
  const matchingEditorExerciseIndex = selectedSession.exercises.findIndex(
    (exercise, index) =>
      getExerciseKey(exercise, index) === selectedEditorExerciseKey
  );
  const activeEditorExerciseIndex =
    matchingEditorExerciseIndex >= 0 ? matchingEditorExerciseIndex : 0;
  const activeEditorExercise =
    selectedSession.exercises[activeEditorExerciseIndex] ?? null;
  const activeEditorExerciseKey = activeEditorExercise
    ? getExerciseKey(activeEditorExercise, activeEditorExerciseIndex)
    : null;
  const sessionTotalSets = selectedSession.exercises.reduce(
    (total, exercise) => {
      const value = Number(exercise.sets ?? 0);
      return total + (Number.isFinite(value) ? Math.max(0, value) : 0);
    },
    0
  );
  const estimatedSessionMinutes = Math.round(
    selectedSession.exercises.reduce((total, exercise) => {
      const rawSets = Number(exercise.sets ?? 0);
      const sets = Number.isFinite(rawSets) ? Math.max(0, rawSets) : 0;
      const rawRest = Number(exercise.rest_time ?? exercise.restTime ?? 0);
      const restSeconds = Number.isFinite(rawRest) ? Math.max(0, rawRest) : 0;
      return total + sets * 100 + Math.max(sets - 1, 0) * restSeconds + 120;
    }, 0) / 60
  );
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
            <div className="dashboard-menu" ref={menuRef}>
              <button
                className="dashboard-menu-btn"
                type="button"
                aria-label="Open menu"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((open) => !open)}
              >
                <MenuIcon />
              </button>
              {isMenuOpen && (
                <div className="dashboard-menu-dropdown" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    className="dashboard-menu-item"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Food
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="dashboard-menu-item"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Training log
                  </button>
                  <div
                    className="dashboard-menu-divider"
                    role="separator"
                  />
                  <button
                    type="button"
                    role="menuitem"
                    className="dashboard-menu-item"
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate(MENU_ROUTE);
                    }}
                  >
                    Go back to menu
                  </button>
                </div>
              )}
            </div>
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
                    : selectedSession.workoutTitle || selectedSession.title}
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
                        type="button"
                        onClick={() => {
                          setSessionPreviewMessage("");
                          setIsSessionPreviewOpen(true);
                        }}
                      >
                        <ActivityIcon />
                        Start session
                      </button>
                    </>
                  )}
                </div>
                {showDayTitleForm && (
                  <div
                    className="pulse-modal-backdrop pulse-workout-editor-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                    if (event.target === event.currentTarget) {
                      setShowDayTitleForm(false);
                    }
                  }}
                >
                  <form
                    onSubmit={handleSaveDayTitle}
                    className="pulse-add-workout-form pulse-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="pulse-day-title-heading"
                  >
                    <div className="pulse-modal-heading-row">
                      <div>
                        <h3 id="pulse-day-title-heading">Name your workout day</h3>
                        <p>Give {selectedSession.day} a title before adding exercises.</p>
                      </div>
                      <button
                        type="button"
                        className="pulse-modal-close"
                        aria-label="Close workout title form"
                        onClick={() => setShowDayTitleForm(false)}
                      >
                        <CloseIcon />
                      </button>
                    </div>
                    <label htmlFor="pulse-workout-day-title">Workout day name</label>
                    <input
                      id="pulse-workout-day-title"
                      className="pulse-modal-input"
                      type="text"
                      value={workoutTitleInput}
                      onChange={(event) => setWorkoutTitleInput(event.target.value)}
                      placeholder="e.g. Push Day, Chest & Back"
                    />
                    <p>Leave it empty to use {selectedSession.day}.</p>
                    {titleSaveError && (
                      <p role="alert" className="pulse-editor-error">
                        {titleSaveError}
                      </p>
                    )}
                    <div className="pulse-add-workout-actions">
                      <button
                        className="dashboard-primary-btn"
                        type="submit"
                        disabled={titleSaveLoading}
                      >
                        {titleSaveLoading ? "Saving..." : "Continue"}
                      </button>
                      <button
                        type="button"
                        className="pulse-editor-cancel"
                        onClick={() => setShowDayTitleForm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {isAddWorkoutOpen && (
                <div
                  className={`pulse-modal-backdrop pulse-workout-editor-backdrop${modalMode === "edit" ? " session-preview-backdrop" : ""}`}
                    role="presentation"
                    onMouseDown={(event) => {
                      if (event.target === event.currentTarget) {
                        closeWorkoutModal();
                      }
                    }}
                  >
                    {modalMode === "edit" ? (
                      <section
                        className="pulse-workout-editor session-preview-modal session-preview-editor"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="pulse-editor-title"
                      >
                        <header className="session-preview-header">
                          <div>
                            <div className="session-preview-eyebrow">
                              WORKOUT EDIT · {selectedSession.day.toUpperCase()}
                            </div>
                            <h2 id="pulse-editor-title">
                              {selectedSession.workoutTitle || selectedSession.title}
                            </h2>
                            <p>
                              Edit or reorder your exercises before you start.
                            </p>
                          </div>
                          <button
                            type="button"
                            className="session-preview-close"
                            aria-label="Close workout editor"
                            onClick={closeWorkoutModal}
                          >
                            <CloseIcon />
                          </button>
                        </header>
                        <div className="session-preview-metrics" aria-label="Workout summary">
                          <div className="session-preview-metric">
                            <span>Exercises</span>
                            <strong>{selectedSession.exercises.length}</strong>
                          </div>
                          <div className="session-preview-metric">
                            <span>Total sets</span>
                            <strong>{sessionTotalSets}</strong>
                          </div>
                          <div className="session-preview-metric">
                            <span>Est. time</span>
                            <strong>
                              ~{estimatedSessionMinutes}<small> min</small>
                            </strong>
                          </div>
                        </div>
                        <div className="session-preview-workspace">
                          <section className="session-preview-order" aria-label="Exercise order">
                            <h3 className="session-preview-section-title">
                              Exercise order
                            </h3>
                            <div
                              className="session-preview-workout-list"
                              role="list"
                              aria-label="Exercises in this workout"
                            >
                              {selectedSession.exercises.map((exercise, index) => {
                                const exerciseName =
                                  getExerciseName(exercise) || "Unnamed exercise";
                                const exerciseKey = getExerciseKey(exercise, index);
                                const isActive =
                                  exerciseKey === activeEditorExerciseKey;
                                return (
                                  <article
                                    className={`pulse-editor-exercise session-preview-workspace-row${isActive ? " is-active" : ""}${draggedExerciseKey === exerciseKey ? " is-dragging" : ""}${dropTargetExerciseKey === exerciseKey ? " is-drop-target" : ""}`}
                                    key={exerciseKey}
                                    role="listitem"
                                    onDragOver={(event) => {
                                      event.preventDefault();
                                      if (draggedExerciseKey !== exerciseKey) {
                                        setDropTargetExerciseKey(exerciseKey);
                                      }
                                    }}
                                    onDragLeave={(event) => {
                                      if (!event.currentTarget.contains(event.relatedTarget)) {
                                        setDropTargetExerciseKey(null);
                                      }
                                    }}
                                    onDrop={(event) => {
                                      event.preventDefault();
                                      const sourceKey =
                                        event.dataTransfer.getData("text/plain") ||
                                        draggedExerciseKey;
                                      if (sourceKey) {
                                        moveExerciseToIndex(sourceKey, index);
                                      }
                                      setDraggedExerciseKey(null);
                                      setDropTargetExerciseKey(null);
                                    }}
                                  >
                                    <button
                                      type="button"
                                      className="session-preview-exercise-select"
                                      aria-pressed={isActive}
                                      onClick={() => {
                                        setSelectedEditorExerciseKey(exerciseKey);
                                        setExerciseSearch("");
                                        setExerciseResults([]);
                                        setAddWorkoutError("");
                                        setAddWorkoutMessage("");
                                      }}
                                    >
                                      <span className="session-preview-number">
                                        {index + 1}
                                      </span>
                                      <span className="session-preview-order-copy">
                                        <strong>{exerciseName}</strong>
                                        <small>
                                          {exercise.sets ?? "—"} sets · {exercise.reps ?? "—"} reps
                                        </small>
                                      </span>
                                    </button>
                                    <button
                                      type="button"
                                      className="pulse-editor-grip pulse-editor-grip-button"
                                      draggable
                                      aria-label={`Drag to reorder ${exerciseName}; use the up and down arrow keys to move it.`}
                                      onDragStart={(event) => {
                                        event.dataTransfer.effectAllowed = "move";
                                        event.dataTransfer.setData("text/plain", exerciseKey);
                                        setDraggedExerciseKey(exerciseKey);
                                      }}
                                      onDragEnd={() => {
                                        setDraggedExerciseKey(null);
                                        setDropTargetExerciseKey(null);
                                      }}
                                      onKeyDown={(event) => {
                                        if (event.key === "ArrowUp" && index > 0) {
                                          event.preventDefault();
                                          moveExerciseToIndex(exerciseKey, index - 1);
                                        } else if (
                                          event.key === "ArrowDown" &&
                                          index < selectedSession.exercises.length - 1
                                        ) {
                                          event.preventDefault();
                                          moveExerciseToIndex(exerciseKey, index + 1);
                                        }
                                      }}
                                    >
                                      <GripIcon />
                                    </button>
                                  </article>
                                );
                              })}
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
                          </section>

                          {activeEditorExercise && (() => {
                            const exercise = activeEditorExercise;
                            const exerciseName =
                              getExerciseName(exercise) || "Unnamed exercise";
                            const exerciseKey = activeEditorExerciseKey;
                            const draft = getExerciseEditDraft(exercise, exerciseKey);
                            const matchingResults = exerciseResults;
                            return (
                              <section
                                className="session-preview-editor-panel pulse-editor-edit-panel"
                                aria-label={`Edit ${exerciseName}`}
                              >
                                <p className="session-preview-editor-count">
                                  Exercise {activeEditorExerciseIndex + 1} of {selectedSession.exercises.length} · Search to replace
                                </p>
                                <div className="pulse-editor-edit-exercise-picker session-preview-name-picker">
                                  <input
                                    id={`pulse-edit-exercise-${exerciseKey}`}
                                    className="session-preview-exercise-name-input"
                                    type="search"
                                    autoComplete="off"
                                    value={draft.exerciseName ?? ""}
                                    placeholder="Search exercises…"
                                    aria-label={`Search to change ${exerciseName}`}
                                    onChange={(event) => {
                                      const value = event.target.value;
                                      updateExerciseEditDraft(exercise, exerciseKey, {
                                        exerciseName: value,
                                        exerciseId: "",
                                        selectedExercise: null,
                                      });
                                      setExerciseSearch(value);
                                      setSelectedExercise(null);
                                      setAddWorkoutError("");
                                    }}
                                  />
                                  {exerciseSearch.trim() &&
                                    exerciseSearch === draft.exerciseName &&
                                    matchingResults.length > 0 && (
                                      <div
                                        className="pulse-editor-edit-search-results"
                                        role="listbox"
                                        aria-label="Exercise choices"
                                      >
                                        {matchingResults.map((result, resultIndex) => {
                                          const resultId = getExerciseId(result);
                                          const resultName =
                                            getExerciseName(result) || "Unnamed exercise";
                                          return (
                                            <button
                                              key={`${resultId ?? resultName}-${resultIndex}`}
                                              type="button"
                                              role="option"
                                              aria-selected={String(resultId) === String(draft.exerciseId)}
                                              onClick={() => {
                                                updateExerciseEditDraft(exercise, exerciseKey, {
                                                  exerciseId: resultId ?? "",
                                                  exerciseName: resultName,
                                                  selectedExercise: result,
                                                });
                                                setExerciseSearch("");
                                                setExerciseResults([]);
                                              }}
                                            >
                                              <span>{resultName}</span>
                                              <small>{resultId != null ? `ID ${resultId}` : "Exercise"}</small>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                </div>
                                <div className="session-preview-editor-fields">
                                  <label className="session-preview-editor-field">
                                    Sets
                                    <input
                                      type="number"
                                      min="1"
                                      value={draft.sets}
                                      onChange={(event) => updateExerciseEditDraft(exercise, exerciseKey, { sets: event.target.value })}
                                    />
                                  </label>
                                  <label className="session-preview-editor-field">
                                    Reps
                                    <input
                                      type="number"
                                      min="1"
                                      value={draft.reps}
                                      onChange={(event) => updateExerciseEditDraft(exercise, exerciseKey, { reps: event.target.value })}
                                    />
                                  </label>
                                  <label className="session-preview-editor-field">
                                    Rest
                                    <input
                                      type="number"
                                      min="0"
                                      step={(draft.restUnit ?? "seconds") === "minutes" ? "any" : "1"}
                                      value={draft.restTime}
                                      onChange={(event) => updateExerciseEditDraft(exercise, exerciseKey, { restTime: event.target.value })}
                                    />
                                  </label>
                                  <label className="session-preview-editor-field">
                                    Unit
                                    <select
                                      value={draft.restUnit ?? "seconds"}
                                      onChange={(event) => {
                                        const nextUnit = event.target.value;
                                        const currentUnit = draft.restUnit ?? "seconds";
                                        updateExerciseEditDraft(exercise, exerciseKey, {
                                          restTime: convertRestTimeUnit(draft.restTime, currentUnit, nextUnit),
                                          restUnit: nextUnit,
                                        });
                                      }}
                                    >
                                      <option value="minutes">Minutes</option>
                                      <option value="seconds">Seconds</option>
                                    </select>
                                  </label>
                                  <label className="session-preview-editor-field session-preview-editor-note">
                                    Exercise note
                                    <textarea
                                      rows={3}
                                      value={draft.note ?? ""}
                                      onChange={(event) => updateExerciseEditDraft(exercise, exerciseKey, { note: event.target.value })}
                                      placeholder="Add a cue, tempo, or reminder…"
                                    />
                                  </label>
                                </div>
                                <button
                                  type="button"
                                  className="pulse-editor-save-changes session-preview-save-exercise"
                                  disabled={savingExerciseKey === exerciseKey}
                                  onClick={() => handleSaveExerciseEdit(exercise, exerciseKey)}
                                >
                                  {savingExerciseKey === exerciseKey ? "Saving…" : "Save exercise"}
                                </button>
                              </section>
                            );
                          })()}
                        </div>
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
                        <footer className="session-preview-actions">
                          <button
                            className="session-preview-cancel"
                            type="button"
                            onClick={closeWorkoutModal}
                          >
                            Cancel
                          </button>
                          <button
                            className="session-preview-start"
                            type="button"
                            onClick={handleSaveWorkoutOrder}
                            disabled={savingExerciseOrder}
                          >
                            {savingExerciseOrder ? "Saving order…" : "Save workout"}
                            {!savingExerciseOrder && (
                              <span aria-hidden="true">›</span>
                            )}
                          </button>
                        </footer>
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
                            Rest time
                            <div className="pulse-rest-time-control">
                              <input
                                type="number"
                                min="0"
                                step={restUnit === "minutes" ? "any" : "1"}
                                required
                                value={restTime}
                                onChange={(event) =>
                                  setRestTime(event.target.value)
                                }
                              />
                              <select
                                value={restUnit}
                                aria-label="Rest time unit"
                                onChange={handleAddRestUnitChange}
                              >
                                <option value="seconds">sec</option>
                                <option value="minutes">min</option>
                              </select>
                            </div>
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
                              Rest time
                              <div className="pulse-rest-time-control">
                                <input
                                  type="number"
                                  min="0"
                                  step={restUnit === "minutes" ? "any" : "1"}
                                  required
                                  value={restTime}
                                  onChange={(event) =>
                                    setRestTime(event.target.value)
                                  }
                                />
                                <select
                                  value={restUnit}
                                  aria-label="Rest time unit"
                                  onChange={handleAddRestUnitChange}
                                >
                                  <option value="seconds">sec</option>
                                  <option value="minutes">min</option>
                                </select>
                              </div>
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

              {isSessionPreviewOpen && (
                <div
                  className="session-preview-backdrop"
                  role="presentation"
                  onMouseDown={(event) => {
                    if (event.target === event.currentTarget) {
                      setIsSessionPreviewOpen(false);
                    }
                  }}
                >
                  <section
                    className="session-preview-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="session-preview-title"
                    aria-describedby="session-preview-description"
                  >
                    <header className="session-preview-header">
                      <div>
                        <div className="session-preview-eyebrow">
                          SESSION REVIEW · {selectedSession.day.toUpperCase()}
                        </div>
                        <h2 id="session-preview-title">
                          {selectedSession.workoutTitle || selectedSession.title}
                        </h2>
                        <p id="session-preview-description">
                          Review your workout before you start.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="session-preview-close"
                        aria-label="Close session preview"
                        onClick={() => setIsSessionPreviewOpen(false)}
                      >
                        <CloseIcon />
                      </button>
                    </header>

                    <div className="session-preview-metrics" aria-label="Workout summary">
                      <div className="session-preview-metric">
                        <span>Exercises</span>
                        <strong>{selectedSession.exercises.length}</strong>
                      </div>
                      <div className="session-preview-metric">
                        <span>Total sets</span>
                        <strong>{sessionTotalSets}</strong>
                      </div>
                      <div className="session-preview-metric">
                        <span>Est. time</span>
                        <strong>
                          ~{estimatedSessionMinutes}<small> min</small>
                        </strong>
                      </div>
                    </div>

                    <div
                      className="session-preview-exercises"
                      role="list"
                      aria-label="Exercises in this session"
                    >
                      {selectedSession.exercises.map((exercise, index) => {
                        const exerciseName =
                          getExerciseName(exercise) || "Unnamed exercise";
                        const exerciseSets = exercise.sets ?? "—";
                        const exerciseReps = exercise.reps ?? "—";
                        const rawExerciseRest =
                          exercise.rest_time ?? exercise.restTime;
                        const exerciseRest = rawExerciseRest == null || rawExerciseRest === ""
                          ? null
                          : Number(rawExerciseRest);
                        const exerciseDetailId = getExerciseDetailId(exercise);
                        const preferredRestUnit = exerciseDetailId == null
                          ? "seconds"
                          : exerciseRestUnitPreferences[
                              getRestUnitPreferenceKey(exerciseDetailId)
                            ] ?? "seconds";
                        const displayedRestTime =
                          exerciseRest !== null && Number.isFinite(exerciseRest)
                            ? convertRestTimeUnit(
                                exerciseRest,
                                "seconds",
                                preferredRestUnit
                              )
                            : null;
                        const restLabel = displayedRestTime !== null
                          ? `${displayedRestTime} ${preferredRestUnit === "minutes" ? "min" : "sec"} rest`
                          : "Rest not set";
                        const note = String(exercise.note ?? "").trim();
                        return (
                          <article
                            className="session-preview-exercise"
                            role="listitem"
                            key={
                              getExerciseDetailId(exercise) ??
                              `${exerciseName}-${index}`
                            }
                          >
                            <span className="session-preview-number">{index + 1}</span>
                            <div className="session-preview-exercise-copy">
                              <h3>{exerciseName}</h3>
                              <p>
                                {exerciseSets} sets × {exerciseReps} reps · {restLabel}
                              </p>
                              {note && (
                                <p className="session-preview-note">
                                  <span aria-hidden="true">ⓘ</span> {note}
                                </p>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    {sessionPreviewMessage && (
                      <p className="session-preview-status" role="status">
                        {sessionPreviewMessage}
                      </p>
                    )}

                    <footer className="session-preview-actions">
                      <button
                        type="button"
                        className="session-preview-cancel"
                        onClick={() => setIsSessionPreviewOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="session-preview-start"
                        onClick={() => setSessionPreviewMessage(
                          "Session tracking will be connected when the sessions API is ready."
                        )}
                      >
                        Start workout <span aria-hidden="true">›</span>
                      </button>
                    </footer>
                  </section>
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
