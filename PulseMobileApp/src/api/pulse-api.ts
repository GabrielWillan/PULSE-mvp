import { Platform } from 'react-native';

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const defaultBaseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
export const API_BASE_URL = (configuredBaseUrl || defaultBaseUrl).replace(/\/$/, '');

export type Routine = {
  id: number;
  name: string;
};

export type WorkoutExercise = {
  id: number;
  exercise_detail_id: number;
  name: string;
  sets: number;
  reps: number;
  rest_time: number;
  note: string | null;
};

export type RoutineDay = {
  id: number;
  day_name: string;
  workout_title: string | null;
  exercises: WorkoutExercise[];
  is_rest_day?: boolean;
};

export type ExerciseSearchResult = {
  id: number;
  name: string;
};

export type SessionLog = {
  id: number;
  sessions_id: number;
  exercise_id: number;
  sets: number;
  reps: number;
  weight: number;
  rest_time: number;
};

export type CreatedSession = {
  session_id?: number;
  sessions_id?: number;
  id?: number;
  started_at?: string | null;
  data?: { session_id?: number; id?: number; started_at?: string | null };
};

function errorMessage(payload: any, fallback: string) {
  const detail = payload?.detail;
  if (typeof detail === 'string' && detail) return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg ?? String(item)).filter(Boolean).join('; ') || fallback;
  }
  return fallback;
}

async function request<T>(path: string, init?: RequestInit, fallback = 'The request failed'): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  const raw = await response.text();
  let payload: any = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = raw;
    }
  }

  if (!response.ok) {
    throw new Error(errorMessage(payload, fallback));
  }
  return payload as T;
}

const jsonHeaders = { 'Content-Type': 'application/json' };

export function getAllRoutines() {
  return request<Routine[]>('/fetchallroutines', undefined, 'Could not load routines');
}

export function createRoutine(title_name: string) {
  return request('/createroutine', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ title_name }),
  }, 'Could not create routine');
}

export function renameRoutine(routine_id: number, routine_name: string) {
  return request('/renameroutines', {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify({ routine_id, routine_name }),
  }, 'Could not rename routine');
}

export function deleteRoutine(routine_id: number) {
  return request('/deleteroutine', {
    method: 'DELETE',
    headers: jsonHeaders,
    body: JSON.stringify({ routine_id }),
  }, 'Could not delete routine');
}

export function getRoutineDays(routine_id: number) {
  return request<RoutineDay[]>(`/fetchroutinedays?routine_id=${encodeURIComponent(routine_id)}`, undefined, 'Could not load this routine');
}

export function searchExercises(exercise_name: string) {
  return request<ExerciseSearchResult[]>(`/searchworkout?exercise_name=${encodeURIComponent(exercise_name)}`, undefined, 'Could not search exercises');
}

export function addExercise(payload: {
  day_id: number;
  exercise_id: number;
  sets: number;
  reps: number;
  rest_time: number;
  note: string | null;
}) {
  return request('/addworkout', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  }, 'Could not add this exercise');
}

export function updateExercise(payload: {
  day_id: number;
  exercise_detail_id: number;
  exercise_id: number;
  sets: number;
  reps: number;
  rest_time: number;
  note: string | null;
}) {
  return request('/editworkout', {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  }, 'Could not update this exercise');
}

export function removeExercise(day_id: number, exercise_detail_id: number) {
  return request('/deleteexercise', {
    method: 'DELETE',
    headers: jsonHeaders,
    body: JSON.stringify({ day_id, exercise_detail_id }),
  }, 'Could not delete this exercise');
}

export function reorderExercises(day_id: number, exercise_detail_ids: number[]) {
  return request('/reorderworkout', {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify({ day_id, exercise_detail_ids }),
  }, 'Could not save the exercise order');
}

export function updateWorkoutTitle(day_id: number, workout_title: string) {
  return request(`/days/${day_id}/title`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify({ day_id, workout_title }),
  }, 'Could not update the workout name');
}

export function createSession(day_id: number) {
  return request<CreatedSession>(`/createsession?day_id=${encodeURIComponent(day_id)}`, {
    method: 'POST',
    headers: jsonHeaders,
  }, 'Could not start this session');
}

export function getSessionLogs() {
  return request<{ logged_sessions: SessionLog[] }>('/showsessions', undefined, 'Could not load session logs');
}

export function logSession(payload: Omit<SessionLog, 'id'>) {
  return request<{ log_id?: number; id?: number }>('/logsession', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  }, 'Could not save this set');
}

export function updateSessionLog(log_id: number, payload: Omit<SessionLog, 'id'>) {
  return request<{ log_id?: number; id?: number }>(`/logsession/${encodeURIComponent(log_id)}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  }, 'Could not edit this set');
}

export function endSession(sessions_id: number) {
  return request(`/endsession?sessions_id=${encodeURIComponent(sessions_id)}`, {
    method: 'PATCH',
  }, 'Could not end this session');
}
