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



export async function  UpdateWorkoutTitle(day_id, workout_title) {
  const Response = await fetch (`http://localhost:8000/days/${day_id}/title`, {
    method:"PATCH",
    headers:{
      "Content-Type" : "application/json",
    },
    body: JSON.stringify({day_id, workout_title,})
  });

  const Data = await Response.json()
  if(!Response.ok){
    throw new Error(Data.detail ?? "Unable to ")
  } 

  return Data
}


export async function EditWorkout({
  day_id,
  exercise_detaexercise_id,
  sets,
  reps,
  rest_time,
  note,
}) {
  const response = await fetch("http://localhost:8000/editworkout", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      day_id,
      exercise_detailexercise_id,
      sets,
      reps,
      rest_time,
      note,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const detail = Array.isArray(data?.detail)
      ? data.detail
          .map((issue) => {
            const field = Array.isArray(issue.loc)
              ? issue.loc[issue.loc.length - 1]
              : null;
            return field ? `${field}: ${issue.msg}` : issue.msg;
          })
          .join("; ")
      : data?.detail;

    throw new Error(
      typeof detail === "string" && detail
        ? detail
        : "Could not edit workout"
    );
  }

  return data;
}

export async function ReorderWorkoutExercises({ day_id, exercise_detail_ids }) {
  const response = await fetch("http://localhost:8000/reorderworkout", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ day_id, exercise_detail_ids }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = Array.isArray(data?.detail)
      ? data.detail
          .map((issue) => {
            const field = Array.isArray(issue.loc)
              ? issue.loc[issue.loc.length - 1]
              : null;
            return field ? `${field}: ${issue.msg}` : issue.msg;
          })
          .join("; ")
      : data?.detail;

    throw new Error(
      typeof detail === "string" && detail
        ? detail
        : "Could not save the exercise order"
    );
  }

  return data;
}


export async function createSession(day_id) {
  const Response = await fetch(
    `http://localhost:8000/createsession?day_id=${encodeURIComponent(day_id)}`,
    {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
    },
    }
  );

  const Data = await Response.json().catch(() => ({}));
  if(!Response.ok){
    throw new Error(Data.detail ?? "Could not create session")
  };
  return Data;
}


export async function logSession(
  sessions_id,
  exercise_id,
  sets,
  reps,
  weight,
  rest_time,
) {
  const Response = await fetch("http://localhost:8000/logsession",{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
    },
    body:JSON.stringify({sessions_id, exercise_id, sets, reps, weight, rest_time})
  });

  const Data = await Response.json().catch(() => null);
  if(!Response.ok){
    const detail = Array.isArray(Data?.detail)
      ? Data.detail.map((issue) => issue.msg).join("; ")
      : Data?.detail;
    throw new Error(detail || "Could not log this set");
  };
  return Data;
}

export async function updateSessionLog(
  log_id,
  sessions_id,
  exercise_id,
  sets,
  reps,
  weight,
  rest_time,
) {
  const Response = await fetch(
    `http://localhost:8000/logsession/${encodeURIComponent(log_id)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessions_id,
        exercise_id,
        sets,
        reps,
        weight,
        rest_time,
      }),
    }
  );

  const Data = await Response.json().catch(() => null);
  if (!Response.ok) {
    const detail = Array.isArray(Data?.detail)
      ? Data.detail.map((issue) => issue.msg).join("; ")
      : Data?.detail;
    throw new Error(detail || "Could not update this set log");
  }
  return Data;
}
