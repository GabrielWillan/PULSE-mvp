import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { endSession, getSessionLogs, logSession, updateSessionLog, type RoutineDay, type SessionLog, type WorkoutExercise } from '@/api/pulse-api';
import { PulseColors } from '@/constants/pulse-theme';
import { Notice, PulseHeader } from '@/components/pulse/PulseUI';
import { SessionExerciseOverview } from '@/components/pulse/SessionExerciseOverview';
import { SetOverview } from '@/components/pulse/SetOverview';
import { RestLogView } from '@/components/pulse/RestLogView';
import { EndSessionModal, SkipWarningModal } from '@/components/pulse/SessionConfirmations';
import { WorkoutCompleteScreen } from '@/components/pulse/WorkoutCompleteScreen';
import { KeyboardFocusProvider, KeyboardFocusScrollView } from '@/components/pulse/KeyboardFocus';

/* eslint-disable react-hooks/refs -- Animated.Value and session timer refs are intentionally stable mutable state. */
type SessionStage = 'overview' | 'set' | 'rest' | 'complete';
type SavedSet = { logId: number | null; reps: number; weight: number };
type SetDraft = { reps: string; weight: string };

function setKey(exercise: WorkoutExercise, setNumber: number) {
  return `${exercise.exercise_detail_id}:${setNumber}`;
}

function parseStartedAt(value?: string | null) {
  if (!value) return 0;
  const parsed = Date.parse(value.replace(' ', 'T'));
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function formatElapsed(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  const pad = (item: number) => String(item).padStart(2, '0');
  return hours ? `${hours}:${pad(minutes)}:${pad(remainder)}` : `${pad(minutes)}:${pad(remainder)}`;
}

export function ActiveSessionScreen({
  session,
  restUnitPreferences,
  onExit,
}: {
  session: { sessionId: number; startedAt?: string | null; routineName: string; day: RoutineDay };
  restUnitPreferences: Record<number, 'seconds' | 'minutes'>;
  onExit: () => void;
}) {
  const exercises = useMemo(() => session.day.exercises ?? [], [session.day.exercises]);
  const [stage, setStage] = useState<SessionStage>('overview');
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setNumber, setSetNumber] = useState(1);
  const [restDuration, setRestDuration] = useState(0);
  const [restRemaining, setRestRemaining] = useState(0);
  const [setDraft, setSetDraft] = useState<SetDraft>({ reps: '', weight: '0' });
  const [savedSets, setSavedSets] = useState<Record<string, SavedSet>>({});
  const [lastValues, setLastValues] = useState<Record<number, SetDraft>>({});
  const [logsLoading, setLogsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logError, setLogError] = useState('');
  const [logMessage, setLogMessage] = useState('');
  const [isEditingSavedSet, setIsEditingSavedSet] = useState(false);
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [skipWarningDisabled, setSkipWarningDisabled] = useState(false);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [endError, setEndError] = useState('');
  const [ending, setEnding] = useState(false);
  const [clock, setClock] = useState({ now: 0, fallbackStart: 0 });
  const fade = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;
  const transitioning = useRef(false);
  const stageRef = useRef<SessionStage>('overview');
  const exerciseIndexRef = useRef(0);
  const setNumberRef = useRef(1);
  const restDeadline = useRef<number | null>(null);
  const advanceAfterRestRef = useRef<() => void>(() => undefined);

  const exercise = exercises[exerciseIndex];
  const currentKey = exercise ? setKey(exercise, setNumber) : '';
  const currentSavedSet = currentKey ? savedSets[currentKey] : undefined;
  const startedAt = parseStartedAt(session.startedAt);
  const elapsedSeconds = session.startedAt
    ? Math.max(0, Math.floor((clock.now - startedAt) / 1000))
    : clock.fallbackStart && clock.now
      ? Math.max(0, Math.floor((clock.now - clock.fallbackStart) / 1000))
      : 0;
  const totalSets = useMemo(() => exercises.reduce((sum, item) => sum + Math.max(0, Number(item.sets) || 0), 0), [exercises]);

  const transitionTo = useCallback((nextStage: SessionStage, direction = 1) => {
    if (transitioning.current || stageRef.current === nextStage) return;
    transitioning.current = true;
    Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: true }).start(({ finished }) => {
      if (!finished) {
        transitioning.current = false;
        return;
      }
      stageRef.current = nextStage;
      setStage(nextStage);
      slide.setValue(direction * 30);
      fade.setValue(0);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start(() => { transitioning.current = false; });
    });
  }, [fade, slide]);

  useEffect(() => {
    const ticker = setInterval(() => {
      const now = Date.now();
      setClock((current) => ({ now, fallbackStart: current.fallbackStart || now }));
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  useEffect(() => {
    stageRef.current = stage;
    exerciseIndexRef.current = exerciseIndex;
    setNumberRef.current = setNumber;
  }, [stage, exerciseIndex, setNumber]);

  useEffect(() => {
    let active = true;
    getSessionLogs()
      .then((response) => {
        if (!active) return;
        const logs = Array.isArray(response?.logged_sessions) ? response.logged_sessions : [];
        const thisSession = logs.filter((item) => Number(item.sessions_id) === session.sessionId);
        const nextSaved: Record<string, SavedSet> = {};
        const nextLast: Record<number, SetDraft> = {};
        thisSession.forEach((item: SessionLog) => {
          const matchedExercise = exercises.find((row) => row.id === Number(item.exercise_id));
          if (!matchedExercise) return;
          nextSaved[setKey(matchedExercise, Number(item.sets))] = { logId: Number(item.id) || null, reps: Number(item.reps), weight: Number(item.weight) };
          nextLast[matchedExercise.id] = { reps: String(item.reps), weight: String(item.weight) };
        });
        setSavedSets(nextSaved);
        setLastValues(nextLast);
      })
      .catch(() => undefined)
      .finally(() => { if (active) setLogsLoading(false); });
    return () => { active = false; };
  }, [exercises, session.sessionId]);

  const advanceAfterRest = useCallback(() => {
    const currentExercise = exercises[exerciseIndexRef.current];
    if (!currentExercise) return;
    const currentSet = setNumberRef.current;
    if (currentSet < Math.max(1, Number(currentExercise.sets) || 1)) {
      setSetNumber(currentSet + 1);
      setLogError('');
      setLogMessage('');
      setIsEditingSavedSet(false);
      transitionTo('set', 1);
      return;
    }
    const nextExerciseIndex = exerciseIndexRef.current + 1;
    if (nextExerciseIndex < exercises.length) {
      setExerciseIndex(nextExerciseIndex);
      setSetNumber(1);
      setLogError('');
      setLogMessage('');
      setIsEditingSavedSet(false);
      transitionTo('overview', 1);
      return;
    }
    endSession(session.sessionId).catch(() => undefined).finally(() => transitionTo('complete', 1));
  }, [exercises, session.sessionId, transitionTo]);
  useEffect(() => {
    advanceAfterRestRef.current = advanceAfterRest;
  }, [advanceAfterRest]);

  useEffect(() => {
    if (stage !== 'rest') return undefined;
    const tick = () => {
      const deadline = restDeadline.current;
      if (deadline == null) return;
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRestRemaining(remaining);
      if (remaining === 0) {
        restDeadline.current = null;
        advanceAfterRestRef.current();
      }
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [stage]);

  function startSet() {
    if (!exercise) return;
    const previous = savedSets[setKey(exercise, setNumber - 1)] ?? null;
    const existing = savedSets[setKey(exercise, setNumber)];
    const prefill = existing ?? (previous ? { reps: previous.reps, weight: previous.weight } : lastValues[exercise.id]);
    setSetDraft({ reps: String(prefill?.reps ?? exercise.reps), weight: String(prefill?.weight ?? 0) });
    setLogError('');
    setLogMessage('');
    setIsEditingSavedSet(false);
    transitionTo('set', 1);
  }

  function completeSet() {
    if (!exercise) return;
    const duration = Math.max(0, Math.round(Number(exercise.rest_time) || 0));
    setRestDuration(duration);
    setRestRemaining(duration);
    restDeadline.current = Date.now() + duration * 1000;
    const existing = savedSets[setKey(exercise, setNumber)];
    const previous = savedSets[setKey(exercise, setNumber - 1)];
    const prefill = existing ?? (previous ? { reps: previous.reps, weight: previous.weight } : lastValues[exercise.id]);
    setSetDraft({ reps: String(prefill?.reps ?? exercise.reps), weight: String(prefill?.weight ?? 0) });
    setLogError('');
    setLogMessage('');
    setIsEditingSavedSet(false);
    transitionTo('rest', 1);
  }

  async function saveSet(skipAfterSave = false) {
    if (!exercise) return;
    const reps = Number(setDraft.reps);
    const weight = Number(setDraft.weight);
    if (!Number.isInteger(reps) || reps < 1) {
      setLogError('Enter the number of reps you completed.');
      return;
    }
    if (!Number.isFinite(weight) || weight < 0 || setDraft.weight.trim() === '') {
      setLogError('Enter a valid weight, or 0 for bodyweight.');
      return;
    }
    setSaving(true);
    setLogError('');
    setLogMessage('');
    const payload = {
      sessions_id: session.sessionId,
      exercise_id: exercise.id,
      sets: setNumber,
      reps,
      weight,
      rest_time: restDuration,
    };
    try {
      const existing = savedSets[currentKey];
      let logId = existing?.logId ?? null;
      if (existing) {
        if (logId == null) throw new Error('The log API did not return a log ID, so this set cannot be edited yet.');
        const result = await updateSessionLog(logId, payload);
        logId = result?.log_id ?? result?.id ?? logId;
      } else {
        const result = await logSession(payload);
        logId = result?.log_id ?? result?.id ?? null;
      }
      setSavedSets((current) => ({ ...current, [currentKey]: { logId, reps, weight } }));
      setLastValues((current) => ({ ...current, [exercise.id]: { reps: String(reps), weight: String(weight) } }));
      setIsEditingSavedSet(false);
      setLogMessage(logId == null ? 'Set saved. Editing requires the API to return its log ID.' : 'Set saved. You can still edit it during rest.');
      if (skipAfterSave) {
        setShowSkipWarning(false);
        restDeadline.current = null;
        advanceAfterRestRef.current();
      }
    } catch (error) {
      setLogError(error instanceof Error ? error.message : 'Could not save this set');
    } finally {
      setSaving(false);
    }
  }

  function requestSkip() {
    if (savedSets[currentKey] || skipWarningDisabled) {
      restDeadline.current = null;
      advanceAfterRestRef.current();
      return;
    }
    setShowSkipWarning(true);
  }

  function skipWithoutLog() {
    if (dontAskAgain) setSkipWarningDisabled(true);
    setShowSkipWarning(false);
    restDeadline.current = null;
    advanceAfterRestRef.current();
  }

  function adjustRest(delta: number) {
    const deadline = restDeadline.current;
    if (deadline == null) return;
    const nextRemaining = Math.max(0, restRemaining + delta);
    restDeadline.current = Date.now() + nextRemaining * 1000;
    setRestDuration((current) => Math.max(0, current + delta));
    setRestRemaining(nextRemaining);
    if (nextRemaining === 0) {
      restDeadline.current = null;
      advanceAfterRestRef.current();
    }
  }

  async function confirmEndSession() {
    setEnding(true);
    setEndError('');
    try {
      await endSession(session.sessionId);
      onExit();
    } catch (error) {
      setEndError(error instanceof Error ? error.message : 'Could not end this session');
    } finally {
      setEnding(false);
    }
  }

  function closeSession() {
    restDeadline.current = null;
    onExit();
  }

  if (stage === 'complete') {
    return (
      <Modal visible animationType="fade" statusBarTranslucent onRequestClose={closeSession}>
        <WorkoutCompleteScreen exerciseCount={exercises.length} totalSets={totalSets} elapsed={formatElapsed(elapsedSeconds)} onDone={closeSession} />
      </Modal>
    );
  }

  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={() => setShowEndConfirmation(true)}>
      <KeyboardFocusProvider>
        <SafeAreaView style={styles.modalRoot} edges={['top', 'left', 'right', 'bottom']}>
          <View pointerEvents="none" style={styles.blueGlow} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardArea}>
            <KeyboardFocusScrollView
              style={styles.sessionScroll}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}>
              <PulseHeader subtitle="" />
              <View style={styles.sessionHeading}>
                <Text style={styles.sessionTitle}>{session.day.workout_title || session.routineName} <Text style={styles.separator}>·</Text> Exercise {exerciseIndex + 1} of {exercises.length}</Text>
                <View style={styles.stepper}><Step name="1 · Overview" active={stage === 'overview'} /><View style={styles.stepLine} /><Step name="2 · Set" active={stage === 'set'} /><View style={styles.stepLine} /><Step name="3 · Rest & log" active={stage === 'rest'} /></View>
              </View>
              <View style={styles.sessionActions}>
                <Text accessibilityLabel={`Session time ${formatElapsed(elapsedSeconds)}`} style={styles.elapsed}><Text style={styles.liveDot}>● </Text>{formatElapsed(elapsedSeconds)}</Text>
                <Pressable accessibilityRole="button" onPress={() => setShowEndConfirmation(true)} style={styles.endButton}><Text style={styles.endText}>End session</Text></Pressable>
              </View>
              {logsLoading ? <Text style={styles.loadingText}>Loading saved sets…</Text> : null}
              {exercise ? (
                <Animated.View style={[styles.stage, { opacity: fade, transform: [{ translateX: slide }] }]}>
                  {stage === 'overview' ? <SessionExerciseOverview exercise={exercise} index={exerciseIndex} exerciseCount={exercises.length} setNumber={setNumber} restUnit={restUnitPreferences[exercise.exercise_detail_id] ?? 'seconds'} onStartSet={startSet} /> : null}
                  {stage === 'set' ? <SetOverview exercise={exercise} index={exerciseIndex} exerciseCount={exercises.length} setNumber={setNumber} restUnit={restUnitPreferences[exercise.exercise_detail_id] ?? 'seconds'} onComplete={completeSet} /> : null}
                  {stage === 'rest' ? <RestLogView exercise={exercise} setNumber={setNumber} restDuration={restDuration} restRemaining={restRemaining} reps={setDraft.reps} weight={setDraft.weight} saved={Boolean(currentSavedSet)} editing={isEditingSavedSet} saving={saving} error={logError} success={logMessage} onRepsChange={(reps) => setSetDraft((current) => ({ ...current, reps }))} onWeightChange={(weight) => setSetDraft((current) => ({ ...current, weight }))} onSave={() => saveSet(false)} onEdit={() => { setIsEditingSavedSet(true); setLogMessage(''); }} onSkip={requestSkip} onAdjustTime={adjustRest} /> : null}
                </Animated.View>
              ) : <Notice tone="error">This workout has no exercises to start.</Notice>}
            </KeyboardFocusScrollView>
          </KeyboardAvoidingView>
          <EndSessionModal visible={showEndConfirmation} loading={ending} onClose={() => { setShowEndConfirmation(false); setEndError(''); }} onConfirm={confirmEndSession} />
          {endError ? <View style={styles.floatingError}><Text style={styles.floatingErrorText}>{endError}</Text></View> : null}
          <SkipWarningModal visible={showSkipWarning} dontAskAgain={dontAskAgain} onDontAskAgain={setDontAskAgain} onLogAndSkip={() => saveSet(true)} onSkipWithoutLog={skipWithoutLog} onContinue={() => setShowSkipWarning(false)} />
        </SafeAreaView>
      </KeyboardFocusProvider>
    </Modal>
  );
}

function Step({ name, active }: { name: string; active: boolean }) {
  return <View style={[styles.step, active && styles.stepActive]}><Text numberOfLines={1} style={[styles.stepText, active && styles.stepTextActive]}>{name}</Text></View>;
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, overflow: 'hidden', backgroundColor: PulseColors.background },
  blueGlow: { position: 'absolute', top: -210, left: -100, width: 480, height: 340, borderRadius: 240, backgroundColor: PulseColors.backgroundTop, opacity: 0.42 },
  keyboardArea: { flex: 1 },
  sessionScroll: { flex: 1 },
  content: { flexGrow: 1, width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 18, gap: 12 },
  sessionActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: -2 },
  elapsed: { color: '#A9C2E8', backgroundColor: 'rgba(5,18,40,0.7)', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 8, fontSize: 10, fontVariant: ['tabular-nums'] },
  liveDot: { color: PulseColors.success, fontSize: 9 },
  endButton: { minHeight: 38, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(5,18,40,0.5)', borderWidth: 1, borderColor: '#24519A' },
  endText: { color: '#A9CAFF', fontSize: 10, fontWeight: '700' },
  sessionHeading: { alignItems: 'center', gap: 9 },
  sessionTitle: { color: PulseColors.textStrong, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  separator: { color: '#7195C8' },
  stepper: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  step: { maxWidth: '33%', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(9,22,45,0.52)', borderWidth: 1, borderColor: 'rgba(54,91,149,0.26)' },
  stepActive: { backgroundColor: PulseColors.accent, borderColor: 'transparent' },
  stepText: { color: '#7E95BD', fontSize: 8, fontWeight: '700' },
  stepTextActive: { color: '#fff' },
  stepLine: { width: 9, height: 1, backgroundColor: '#27446F' },
  stage: { width: '100%', maxWidth: 600, alignSelf: 'center', flex: 1, justifyContent: 'center' },
  loadingText: { alignSelf: 'center', color: PulseColors.muted, fontSize: 10 },
  floatingError: { position: 'absolute', bottom: 18, left: 18, right: 18, padding: 10, borderRadius: 12, backgroundColor: '#3A1420', borderWidth: 1, borderColor: 'rgba(255,119,135,0.35)' },
  floatingErrorText: { color: '#FFC0C8', textAlign: 'center', fontSize: 11 },
});
