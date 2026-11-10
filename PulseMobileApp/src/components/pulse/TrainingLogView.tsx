import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getRoutineDays, getSessionLogs, type Routine, type RoutineDay, type SessionLog } from '@/api/pulse-api';
import { PulseColors } from '@/constants/pulse-theme';
import { ActionButton, Eyebrow, Glyph, IconButton } from '@/components/pulse/PulseUI';

type LoggedSet = SessionLog & {
  routineId: number;
  routineName: string;
  dayName: string;
  workoutTitle: string;
  exerciseName: string;
  exerciseOrder: number;
};

type LoggedSession = {
  key: string;
  sessionId: number;
  routineName: string;
  dayName: string;
  workoutTitle: string;
  sets: LoggedSet[];
};

function formatRest(value: number) {
  const seconds = Math.max(0, Number(value) || 0);
  return `${seconds} sec rest`;
}

function formatWeight(value: number) {
  const weight = Number(value) || 0;
  return `${Number.isInteger(weight) ? weight : weight.toFixed(1)} kg`;
}

function makeSessions(values: { routine: Routine; days: RoutineDay[]; logs: SessionLog[] }[]) {
  const grouped = new Map<string, LoggedSession>();

  values.forEach(({ routine, days, logs }) => {
    logs.forEach((log) => {
      const sessionId = Number(log.sessions_id);
      if (!Number.isFinite(sessionId)) return;
      const dayIndex = days.findIndex((day) => day.exercises?.some((exercise) => Number(exercise.id) === Number(log.exercise_id)));
      const day = dayIndex >= 0 ? days[dayIndex] : null;
      const exerciseIndex = day?.exercises?.findIndex((exercise) => Number(exercise.id) === Number(log.exercise_id)) ?? -1;
      const exercise = exerciseIndex >= 0 ? day?.exercises?.[exerciseIndex] : null;
      const key = `${routine.id}:${sessionId}`;
      const existing = grouped.get(key);
      const enriched: LoggedSet = {
        ...log,
        routineId: routine.id,
        routineName: routine.name,
        dayName: day?.day_name ?? 'Training day',
        workoutTitle: day?.workout_title || 'Workout session',
        exerciseName: exercise?.name || `Exercise ${log.exercise_id}`,
        exerciseOrder: exerciseIndex >= 0 ? exerciseIndex : Number.MAX_SAFE_INTEGER,
      };

      if (existing) existing.sets.push(enriched);
      else grouped.set(key, {
        key,
        sessionId,
        routineName: routine.name,
        dayName: enriched.dayName,
        workoutTitle: enriched.workoutTitle,
        sets: [enriched],
      });
    });
  });

  return [...grouped.values()]
    .map((session) => ({
      ...session,
      sets: session.sets.sort((a, b) => a.exerciseOrder - b.exerciseOrder || a.sets - b.sets),
    }))
    .sort((a, b) => b.sessionId - a.sessionId);
}

export function TrainingLogView({ routines, onBack }: { routines: Routine[]; onBack?: () => void }) {
  const [sessions, setSessions] = useState<LoggedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const results = await Promise.allSettled(routines.map(async (routine) => {
        const [days, response] = await Promise.all([getRoutineDays(routine.id), getSessionLogs(routine.id)]);
        return { routine, days: Array.isArray(days) ? days : [], logs: Array.isArray(response?.logged_sessions) ? response.logged_sessions : [] };
      }));
      const available = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
      setSessions(makeSessions(available));
      if (results.some((result) => result.status === 'rejected')) {
        setError('Some routine logs could not be loaded. Pull to retry with the button below.');
      }
    } catch {
      setError('Training logs could not be loaded. Check your connection and try again.');
      setSessions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [routines]);

  useEffect(() => {
    const initialLoad = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(initialLoad);
  }, [load]);

  const totalSets = useMemo(() => sessions.reduce((sum, session) => sum + session.sets.length, 0), [sessions]);

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        {onBack ? <IconButton glyph="back" label="Back to menu" onPress={onBack} /> : null}
        <View style={[styles.brand, !onBack && styles.brandLeft]}><View style={styles.brandMark}><Glyph name="activity" size={16} color="#fff" /></View><Text style={styles.brandText}>PULSE</Text></View>
        <IconButton glyph="clock" label="Refresh training log" onPress={() => void load(true)} />
      </View>
      <View style={styles.heading}>
        <Eyebrow>Training history</Eyebrow>
        <Text style={styles.title}>Your sessions</Text>
        <Text style={styles.subtitle}>{sessions.length} {sessions.length === 1 ? 'workout' : 'workouts'} · {totalSets} sets logged</Text>
      </View>

      {error ? <View style={styles.errorCard}><Text style={styles.errorText}>{error}</Text><ActionButton title={refreshing ? 'Loading…' : 'Try again'} onPress={() => void load(true)} loading={refreshing} style={styles.retryButton} /></View> : null}

      {loading ? (
        <View style={styles.loading}><ActivityIndicator color={PulseColors.accentLight} /><Text style={styles.muted}>Loading your sessions…</Text></View>
      ) : sessions.length ? (
        <ScrollView style={styles.listScroll} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {sessions.map((session) => {
            const expanded = expandedKey === session.key;
            const exerciseGroups = session.sets.reduce<{ exerciseId: number; name: string; sets: LoggedSet[] }[]>((groups, log) => {
              const group = groups.find((item) => item.exerciseId === log.exercise_id);
              if (group) group.sets.push(log);
              else groups.push({ exerciseId: log.exercise_id, name: log.exerciseName, sets: [log] });
              return groups;
            }, []);
            return (
              <View key={session.key} style={[styles.sessionCard, expanded && styles.sessionCardExpanded]}>
                <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpandedKey(expanded ? null : session.key)} style={styles.sessionSummary}>
                  <View style={styles.sessionIcon}><Glyph name="activity" size={20} color={PulseColors.accentLight} /></View>
                  <View style={styles.sessionCopy}>
                    <Text style={styles.workoutTitle} numberOfLines={1}>{session.workoutTitle}</Text>
                    <Text style={styles.sessionMeta}>{session.routineName} · {session.dayName.replace('Day', 'Day ')}</Text>
                    <Text style={styles.sessionSub}>{exerciseGroups.length} {exerciseGroups.length === 1 ? 'exercise' : 'exercises'} · {session.sets.length} sets</Text>
                  </View>
                  <View style={styles.expandWrap}><Text style={styles.expandLabel}>{expanded ? 'Hide' : 'View'}</Text><Glyph name="chevron" size={21} color="#9AB9E8" /></View>
                </Pressable>

                {expanded ? (
                  <View style={styles.details}>
                    {exerciseGroups.map((group) => (
                      <View key={`${session.key}:${group.exerciseId}`} style={styles.exerciseGroup}>
                        <Text style={styles.exerciseName}>{group.name}</Text>
                        {group.sets.map((log) => (
                          <View key={log.id} style={styles.setRow}>
                            <Text style={styles.setNumber}>SET {log.sets}</Text>
                            <Text style={styles.setValues}>{log.reps} reps</Text>
                            <Text style={styles.setValues}>{formatWeight(log.weight)}</Text>
                            <Text style={styles.restValue}>{formatRest(log.rest_time)}</Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}><Glyph name="activity" size={24} color={PulseColors.accentLight} /></View>
          <Text style={styles.emptyTitle}>No training logs yet</Text>
          <Text style={styles.muted}>Sets you save during a session will show up here, grouped by workout.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 112, gap: 16 },
  topBar: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandLeft: { marginRight: 'auto' },
  brandMark: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: PulseColors.accent },
  brandText: { color: '#F4F7FF', fontWeight: '800', fontSize: 15, letterSpacing: 0.35 },
  heading: { gap: 5, paddingTop: 4 },
  title: { color: '#fff', fontSize: 30, lineHeight: 35, fontWeight: '800', letterSpacing: -1 },
  subtitle: { color: PulseColors.muted, fontSize: 12 },
  listScroll: { flex: 1 },
  list: { gap: 10, paddingBottom: 12 },
  sessionCard: { overflow: 'hidden', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(111,153,219,0.2)', backgroundColor: 'rgba(14,29,59,0.82)' },
  sessionCardExpanded: { borderColor: 'rgba(76,145,245,0.52)', backgroundColor: 'rgba(16,35,70,0.94)' },
  sessionSummary: { minHeight: 90, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 13, paddingVertical: 12 },
  sessionIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: 'rgba(59,130,246,0.16)' },
  sessionCopy: { flex: 1, gap: 3 },
  workoutTitle: { color: '#F3F7FF', fontSize: 15, fontWeight: '800' },
  sessionMeta: { color: '#AFC5E5', fontSize: 10, fontWeight: '600' },
  sessionSub: { color: PulseColors.muted, fontSize: 10 },
  expandWrap: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  expandLabel: { color: '#9AB9E8', fontSize: 9, fontWeight: '700' },
  details: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: 'rgba(111,153,219,0.16)' },
  exerciseGroup: { paddingTop: 12, gap: 7 },
  exerciseName: { color: '#DCE8FA', fontSize: 12, fontWeight: '700' },
  setRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, borderRadius: 10, backgroundColor: 'rgba(4,14,31,0.55)' },
  setNumber: { color: PulseColors.accentLight, fontSize: 8, fontWeight: '800', letterSpacing: 0.5, width: 36 },
  setValues: { color: '#D5E1F2', fontSize: 9, fontWeight: '600' },
  restValue: { flex: 1, color: PulseColors.muted, fontSize: 8, textAlign: 'right' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 11 },
  muted: { color: PulseColors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  emptyCard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 26 },
  emptyIcon: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: 'rgba(59,130,246,0.15)' },
  emptyTitle: { color: '#F4F7FF', fontSize: 17, fontWeight: '800' },
  errorCard: { padding: 13, gap: 10, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,119,135,0.3)', backgroundColor: 'rgba(92,31,48,0.26)' },
  errorText: { color: '#FFC5CC', fontSize: 11, lineHeight: 16 },
  retryButton: { alignSelf: 'flex-start', minHeight: 38 },
});
