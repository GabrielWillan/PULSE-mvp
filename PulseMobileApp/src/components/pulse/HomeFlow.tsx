import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { Modal, Platform } from 'react-native';

import { createSession, getRoutineDays, type CreatedSession, type RoutineDay } from '@/api/pulse-api';
import { ActiveSessionScreen } from '@/components/pulse/ActiveSessionScreen';
import { useBottomBarActions } from '@/components/pulse/BottomBarActionsContext';
import { ChooseWorkoutModal } from '@/components/pulse/ChooseWorkoutModal';
import { EditWorkoutScreen } from '@/components/pulse/EditWorkoutScreen';
import { HomeDashboard } from '@/components/pulse/HomeDashboard';
import { RoutinePickerModal } from '@/components/pulse/RoutinePickerModal';
import { SessionPreview } from '@/components/pulse/SessionPreview';
import { usePulseRoutines } from '@/components/pulse/PulseRoutinesContext';

type ActiveSession = {
  sessionId: number;
  startedAt?: string | null;
  routineId: number;
  routineName: string;
  day: RoutineDay;
};

type DaysQuery = {
  routineId: number;
  rows: RoutineDay[];
  error: string;
};

function getSessionId(response: CreatedSession) {
  return Number(response.session_id ?? response.sessions_id ?? response.id ?? response.data?.session_id ?? response.data?.id);
}

function getStartedAt(response: CreatedSession) {
  return response.started_at ?? response.data?.started_at ?? null;
}

export function HomeFlow() {
  const { routines, loadingRoutines, routinesError, refreshRoutines } = usePulseRoutines();
  const { addWorkoutRequestId, handledAddWorkoutRequestId, markAddWorkoutHandled } = useBottomBarActions();
  const [selectedRoutineId, setSelectedRoutineId] = useState<number | null>(null);
  const [daysQuery, setDaysQuery] = useState<DaysQuery | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const [routinePickerVisible, setRoutinePickerVisible] = useState(false);
  const [chooseWorkoutVisible, setChooseWorkoutVisible] = useState(false);
  const [editWorkoutVisible, setEditWorkoutVisible] = useState(false);
  const [sessionPreviewVisible, setSessionPreviewVisible] = useState(false);
  const [sessionStarting, setSessionStarting] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const pendingSession = useRef<ActiveSession | null>(null);
  const [restDays, setRestDays] = useState<Record<number, boolean>>({});
  const [restUnitPreferences, setRestUnitPreferences] = useState<Record<number, 'seconds' | 'minutes'>>({});

  const routine = routines.find((item) => item.id === selectedRoutineId) ?? routines[0] ?? null;
  const days = routine && daysQuery?.routineId === routine.id ? daysQuery.rows : [];
  const daysError = routine && daysQuery?.routineId === routine.id ? daysQuery.error : '';
  const loadingDays = Boolean(routine && daysQuery?.routineId !== routine.id);
  const selectedDay = days.find((day) => day.id === selectedDayId) ?? days[0] ?? null;
  const selectedRestDay = selectedDay
    ? (restDays[selectedDay.id] ?? Boolean(selectedDay.is_rest_day))
    : false;

  useEffect(() => {
    if (addWorkoutRequestId <= handledAddWorkoutRequestId || loadingRoutines || loadingDays) return;
    const action = setTimeout(() => {
      markAddWorkoutHandled(addWorkoutRequestId);
      if (selectedDay) setChooseWorkoutVisible(true);
      else router.navigate('/explore');
    }, 0);
    return () => clearTimeout(action);
  }, [addWorkoutRequestId, handledAddWorkoutRequestId, loadingDays, loadingRoutines, markAddWorkoutHandled, selectedDay]);

  const activatePendingSession = useCallback(() => {
    const nextSession = pendingSession.current;
    if (!nextSession) return;
    pendingSession.current = null;
    setActiveSession(nextSession);
  }, []);

  const routineId = routine?.id;
  useEffect(() => {
    if (routineId == null) return undefined;

    let current = true;
    getRoutineDays(routineId)
      .then((rows) => {
        if (!current) return;
        const nextDays = Array.isArray(rows) ? rows : [];
        setDaysQuery({ routineId, rows: nextDays, error: '' });
        setSelectedDayId((selectedId) => nextDays.some((day) => day.id === selectedId) ? selectedId : nextDays[0]?.id ?? null);
      })
      .catch((error: unknown) => {
        if (!current) return;
        setDaysQuery({ routineId, rows: [], error: error instanceof Error ? error.message : 'Could not load this routine' });
      });
    return () => { current = false; };
  }, [routineId]);

  const refreshDays = useCallback(async () => {
    if (!routine) return;
    try {
      const rows = await getRoutineDays(routine.id);
      const nextDays = Array.isArray(rows) ? rows : [];
      setDaysQuery({ routineId: routine.id, rows: nextDays, error: '' });
      setSelectedDayId((current) => nextDays.some((day) => day.id === current) ? current : nextDays[0]?.id ?? null);
    } catch (error) {
      setDaysQuery({ routineId: routine.id, rows: [], error: error instanceof Error ? error.message : 'Could not refresh this routine' });
      throw error;
    }
  }, [routine]);

  const handleExerciseAdded = useCallback(async (exerciseId: number, restUnit: 'seconds' | 'minutes') => {
    if (!routine) return;
    const rows = await getRoutineDays(routine.id);
    const nextDays = Array.isArray(rows) ? rows : [];
    setDaysQuery({ routineId: routine.id, rows: nextDays, error: '' });
    const added = nextDays.flatMap((day) => day.exercises ?? []).find((exercise) => exercise.id === exerciseId);
    if (added) {
      setRestUnitPreferences((current) => ({ ...current, [added.exercise_detail_id]: restUnit }));
    }
  }, [routine]);

  async function startSession() {
    if (!selectedDay || !routine || selectedRestDay) return;
    setSessionStarting(true);
    setSessionError('');
    try {
      const result = await createSession(selectedDay.id);
      const sessionId = getSessionId(result);
      if (!Number.isFinite(sessionId) || sessionId <= 0) {
        throw new Error('The create-session response did not include a session ID.');
      }
      pendingSession.current = {
        sessionId,
        startedAt: getStartedAt(result),
        routineId: routine.id,
        routineName: routine?.name ?? 'Workout',
        day: selectedDay,
      };
      setSessionPreviewVisible(false);
      // iOS reports the native Modal dismissal. Android does not expose that callback.
      if (Platform.OS !== 'ios') setTimeout(activatePendingSession, 350);
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : 'Could not start this session');
    } finally {
      setSessionStarting(false);
    }
  }

  const updateRestUnit = useCallback((exerciseDetailId: number, unit: 'seconds' | 'minutes') => {
    setRestUnitPreferences((current) => ({ ...current, [exerciseDetailId]: unit }));
  }, []);

  return (
    <>
      <HomeDashboard
        routines={routines}
        routine={routine}
        days={days}
        selectedDayId={selectedDayId}
        restDay={selectedRestDay}
        restDays={restDays}
        loading={loadingRoutines || loadingDays}
        error={daysError || routinesError}
        onOpenRoutinePicker={() => setRoutinePickerVisible(true)}
        onOpenRoutines={() => router.navigate('/explore')}
        onSelectDay={(day) => setSelectedDayId(day.id)}
        onEditWorkout={() => setEditWorkoutVisible(true)}
        onStartSession={() => { setSessionError(''); setSessionPreviewVisible(true); }}
        onRetry={() => {
          void refreshRoutines();
          void refreshDays().catch(() => undefined);
        }}
      />

      <RoutinePickerModal
        visible={routinePickerVisible}
        routines={routines}
        selectedId={routine?.id ?? null}
        onChoose={(nextRoutine) => {
          setSelectedRoutineId(nextRoutine.id);
          setRoutinePickerVisible(false);
        }}
        onClose={() => setRoutinePickerVisible(false)}
      />

      {selectedDay ? (
        <ChooseWorkoutModal
          visible={chooseWorkoutVisible}
          dayId={selectedDay.id}
          dayName={selectedDay.day_name}
          isRestDay={selectedRestDay}
          onRestDayChange={(value) => setRestDays((current) => ({ ...current, [selectedDay.id]: value }))}
          onClose={() => setChooseWorkoutVisible(false)}
          onAdded={handleExerciseAdded}
        />
      ) : null}

      {selectedDay && routine ? (
        <Modal visible={editWorkoutVisible} animationType="slide" statusBarTranslucent onRequestClose={() => setEditWorkoutVisible(false)}>
          <EditWorkoutScreen
            key={JSON.stringify([selectedDay.id, selectedDay.workout_title, selectedDay.exercises?.map((exercise) => [exercise.exercise_detail_id, exercise.id, exercise.name, exercise.sets, exercise.reps, exercise.rest_time, exercise.note])])}
            routineName={routine.name}
            day={selectedDay}
            restDay={selectedRestDay}
            restUnitPreferences={restUnitPreferences}
            onRestUnitChange={updateRestUnit}
            onRestDayChange={(value) => setRestDays((current) => ({ ...current, [selectedDay.id]: value }))}
            onAddExercise={() => {
              setEditWorkoutVisible(false);
              setChooseWorkoutVisible(true);
            }}
            onRefresh={refreshDays}
            onClose={() => setEditWorkoutVisible(false)}
          />
        </Modal>
      ) : null}

      {selectedDay ? (
        <SessionPreview
          visible={sessionPreviewVisible}
          routineName={routine?.name ?? 'Workout'}
          day={selectedDay}
          restUnitPreferences={restUnitPreferences}
          loading={sessionStarting}
          error={sessionError}
          onClose={() => setSessionPreviewVisible(false)}
          onStart={() => void startSession()}
          onDismiss={activatePendingSession}
        />
      ) : null}

      {activeSession ? (
        <ActiveSessionScreen
          key={activeSession.sessionId}
          session={activeSession}
          restUnitPreferences={restUnitPreferences}
          onExit={() => setActiveSession(null)}
        />
      ) : null}
    </>
  );
}

