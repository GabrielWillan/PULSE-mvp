export async function postRoutine(title_name) {
  const response = await fetch("http://localhost:8000/createroutine", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title_name }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail ?? "Could not create routine");
  }

  return data;
}

export async function getAllRoutines() {
  const response = await fetch("http://localhost:8000/fetchallroutines");

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ?? "Could not fetch routines from API"
    );
  }

  return data;
}