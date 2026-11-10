export async function getSessionLogs(routineId) {
  const response = await fetch(
    `http://localhost:8000/showsessions?routine_id=${encodeURIComponent(routineId)}`
  );
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = Array.isArray(data?.detail)
      ? data.detail.map((issue) => issue?.msg ?? String(issue)).join("; ")
      : data?.detail;
    throw new Error(detail || "Could not load this routine's training log");
  }

  return Array.isArray(data) ? data : data?.logged_sessions ?? [];
}
