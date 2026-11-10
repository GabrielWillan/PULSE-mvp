import { StyleSheet, Text, View } from 'react-native';

import type { RoutineDay, WorkoutExercise } from '@/api/pulse-api';
import { PulseColors, PulseRadii } from '@/constants/pulse-theme';
import { ActionButton, Eyebrow, Glyph } from '@/components/pulse/PulseUI';
import { ModalScroll, PulseModal } from '@/components/pulse/PulseModal';

function formatRest(exercise: WorkoutExercise, unit: 'seconds' | 'minutes') {
  const seconds = Number(exercise.rest_time);
  if (!Number.isFinite(seconds)) return 'Rest not set';
  const value = unit === 'minutes' ? Number((seconds / 60).toFixed(2)) : seconds;
  return `${value} ${unit === 'minutes' ? 'min' : 'sec'} rest`;
}

export function SessionPreview({
  visible,
  routineName,
  day,
  restUnitPreferences,
  loading,
  error,
  onClose,
  onStart,
  onDismiss,
}: {
  visible: boolean;
  routineName: string;
  day: RoutineDay;
  restUnitPreferences: Record<number, 'seconds' | 'minutes'>;
  loading: boolean;
  error: string;
  onClose: () => void;
  onStart: () => void;
  onDismiss?: () => void;
}) {
  const exercises = day.exercises ?? [];
  const totalSets = exercises.reduce((sum, item) => sum + Number(item.sets || 0), 0);
  const estimatedMinutes = Math.max(1, Math.round(exercises.reduce((sum, item) => sum + Number(item.sets || 0) * 100 + Math.max(Number(item.sets || 0) - 1, 0) * Number(item.rest_time || 0) + 120, 0) / 60));

  return (
    <PulseModal visible={visible} onClose={onClose} onDismiss={onDismiss} dialogMinHeight={540}>
      <ModalScroll fill>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Eyebrow>Session review · {day.day_name}</Eyebrow>
            <Text style={styles.title}>{day.workout_title || routineName}</Text>
            <Text style={styles.subtitle}>Review your workout before you start.</Text>
          </View>
          <ActionButton title="Close" variant="quiet" glyph="close" onPress={onClose} style={styles.closeButton} />
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.statLabel}>EXERCISES</Text><Text style={styles.statValue}>{exercises.length}</Text></View>
          <View style={styles.stat}><Text style={styles.statLabel}>TOTAL SETS</Text><Text style={styles.statValue}>{totalSets}</Text></View>
          <View style={styles.stat}><Text style={styles.statLabel}>EST. TIME</Text><Text style={styles.statValue}>~{estimatedMinutes}<Text style={styles.statUnit}> min</Text></Text></View>
        </View>
        {exercises.length ? (
          <View style={styles.exerciseList}>
            {exercises.map((exercise, index) => (
              <View key={exercise.exercise_detail_id} style={styles.exerciseCard}>
                <Text style={styles.number}>{index + 1}</Text>
                <View style={styles.exerciseCopy}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseMeta}>{exercise.sets} sets × {exercise.reps} reps · {formatRest(exercise, restUnitPreferences[exercise.exercise_detail_id] ?? 'seconds')}</Text>
                  {exercise.note ? <Text style={styles.exerciseNote}>ⓘ {exercise.note}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.empty}><Glyph name="activity" size={20} color={PulseColors.muted} /><Text style={styles.emptyText}>Add an exercise before starting this session.</Text></View>
        )}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <View style={styles.actions}>
          <ActionButton title="Cancel" variant="secondary" onPress={onClose} style={styles.action} />
          <ActionButton title="Start workout" glyph="arrow" onPress={onStart} loading={loading} disabled={!exercises.length} style={styles.action} />
        </View>
      </ModalScroll>
    </PulseModal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  headerCopy: { flex: 1, gap: 6 },
  title: { color: PulseColors.textStrong, fontSize: 28, lineHeight: 31, fontWeight: '800', letterSpacing: -1 },
  subtitle: { color: PulseColors.mutedLight, fontSize: 13 },
  closeButton: { minWidth: 42, width: 42, paddingHorizontal: 0 },
  stats: { flexDirection: 'row', gap: 7 },
  stat: { flex: 1, minHeight: 74, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 6, backgroundColor: '#08152C', borderWidth: 1, borderColor: '#1A3769', borderRadius: PulseRadii.medium },
  statLabel: { color: PulseColors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.9 },
  statValue: { color: PulseColors.textStrong, fontSize: 19, fontWeight: '800' },
  statUnit: { color: PulseColors.mutedLight, fontSize: 10, fontWeight: '600' },
  exerciseList: { gap: 7 },
  exerciseCard: { minHeight: 59, flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 10, backgroundColor: '#08152C', borderWidth: 1, borderColor: '#1A3769', borderRadius: 14 },
  number: { width: 30, height: 30, textAlign: 'center', textAlignVertical: 'center', overflow: 'hidden', color: '#9BC4FF', backgroundColor: '#1B3E70', borderRadius: 10, fontSize: 13, lineHeight: 30, fontWeight: '800' },
  exerciseCopy: { flex: 1, gap: 3, paddingTop: 1 },
  exerciseName: { color: PulseColors.textStrong, fontSize: 13, fontWeight: '700' },
  exerciseMeta: { color: PulseColors.mutedLight, fontSize: 11, lineHeight: 15 },
  exerciseNote: { marginTop: 3, color: '#8FC0FF', fontSize: 10, lineHeight: 14 },
  empty: { minHeight: 100, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: PulseColors.border, borderRadius: 14 },
  emptyText: { color: PulseColors.muted, fontSize: 12, textAlign: 'center' },
  error: { color: PulseColors.danger, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 9, paddingTop: 3 },
  action: { flex: 1 },
});
