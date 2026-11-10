import { Platform } from 'react-native';
import Constants from 'expo-constants';

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const expoHostUri = Constants.expoConfig?.hostUri
  ?? Constants.manifest2?.extra?.expoClient?.hostUri
  ?? Constants.manifest?.debuggerHost;
const expoHostAddress = expoHostUri?.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').split('/')[0];
const expoHost = expoHostAddress?.startsWith('[')
  ? expoHostAddress.slice(1, expoHostAddress.indexOf(']'))
  : expoHostAddress?.split(':')[0];
const expoHostBaseUrl = expoHost ? `http://${expoHost}:8000` : undefined;
const localBaseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
const apiBaseUrls = [...new Set([configuredBaseUrl, expoHostBaseUrl, localBaseUrl]
  .filter((url): url is string => Boolean(url))
  .map((url) => url.replace(/\/$/, '')))];
let activeBaseUrl = apiBaseUrls[0];
export const API_BASE_URL = activeBaseUrl;

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

function connectionError(path: string, cause: unknown) {
  const attempted = apiBaseUrls.join(' or ');
  const detail = cause instanceof Error ? ` (${cause.message})` : '';
  return new Error(`Could not reach the PULSE API at ${attempted}${path}. Make sure FastAPI is running on port 8000 and your iPhone and computer are on the same Wi-Fi network. Expo Go on a phone cannot use localhost.${detail}`);
}

async function request<T>(path: string, init?: RequestInit, fallback = 'The request failed'): Promise<T> {
  const isRead = !init?.method || init.method.toUpperCase() === 'GET';
  const candidates = isRead
    ? [...new Set([activeBaseUrl, ...apiBaseUrls].filter((url): url is string => Boolean(url)))]
    : [activeBaseUrl];
  let response: Response | undefined;
  let lastNetworkError: unknown;

  for (const baseUrl of candidates) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      response = await fetch(`${baseUrl}${path}`, { ...init, signal: init?.signal ?? controller.signal });
      activeBaseUrl = baseUrl;
      clearTimeout(timeout);
      break;
    } catch (error) {
      clearTimeout(timeout);
      lastNetworkError = error;
    }
  }

  if (!response) throw connectionError(path, lastNetworkError);

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
    throw new Error(errorMessage(payload, `${fallback} (HTTP ${response.status})`));
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

export function getSessionLogs(routine_id: number) {
  return request<{ logged_sessions: SessionLog[] }>(`/showsessions?routine_id=${encodeURIComponent(routine_id)}`, undefined, 'Could not load session logs');
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
  }, 'Could not edit this set').catch((error: unknown) => {
    if (error instanceof Error && /not found|method not allowed/i.test(error.message)) throw new Error(`Could not find saved set ${log_id}. Refresh the session and try again.`);
    throw error;
  });
}

export function endSession(sessions_id: number) {
  return request<{ session_id: number; ended_at: string }>(`/endsession`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify({ sessions_id }),
  }, 'Could not end this session');
}
