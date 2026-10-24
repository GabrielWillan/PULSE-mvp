export async function postRoutine(title_name) {
  const response = await fetch("http://localhost:8000/createroutine", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title_name }),
  });

  const Data = await response.json();

  if (!response.ok) {
    throw new Error(Data.detail ?? "Could not create routine");
  }

  return Data;
}

export async function getAllRoutines() {
  const response = await fetch("http://localhost:8000/fetchallroutines");

  const Data = await response.json();

  if (!response.ok) {
    throw new Error(
      Data.detail ?? "Could not fetch routines from API"
    );
  }

  return Data;
}


export async function getAllDays(routine_id) {
  const response = await fetch(
    `http://localhost:8000/fetchroutinedays?routine_id=${routine_id}`
  );

  const Data = await response.json();

  if (!response.ok) {
    throw new Error(
      Data.detail ?? "Could not fetch the routine days from API"
    );
  }

  return Data;
}


export async function AddWorkout(
  day_id,
  exercise_id,
  sets,
  reps,
  rest_time,
  note
) {
  const response = await fetch("http://localhost:8000/addworkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      day_id,
      exercise_id,
      sets,
      reps,
      rest_time,
      note,
    }),
  });

  const Data = await response.json();

  if (!response.ok) {
    throw new Error(Data.detail ?? "Could not create workout");
  }

  return Data;
}

export async function ShowWorkout() {
  const response = await fetch("http://localhost:8000/showworkout");

  const Data = await response.json();

  if (!response.ok) {
    throw new Error(Data.detail ?? "Could not show workouts");
  }

  return Data;
}


export async function SearchWorkout(exercise_name) {
  const response = await fetch(
    `http://localhost:8000/searchworkout?exercise_name=${encodeURIComponent(exercise_name)}`
  );

  const Data = await response.json();

  if (!response.ok) {
    throw new Error(Data.detail ?? "Could not search workouts");
  }

  return Data;
}