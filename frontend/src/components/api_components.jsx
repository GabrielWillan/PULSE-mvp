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
  const Response = await fetch("http://localhost:8000/fetchroutinedays")
  const Data = await Response.json()

  if(!Data.ok){
    throw new Error(
      Data.detail ?? "Could not fetch the routine days from API"

    );
  }
  return Data
}