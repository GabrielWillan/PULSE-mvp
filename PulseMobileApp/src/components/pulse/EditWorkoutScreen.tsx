import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { reorderExercises, updateWorkoutTitle, type RoutineDay } from '@/api/pulse-api';
import { PulseColors, PulseSpacing } from '@/constants/pulse-theme';
import { ActionButton, Card, Eyebrow, Glyph, IconButton, Notice, PageFrame, PulseHeader, TextField } from '@/components/pulse/PulseUI';
import { ExerciseDetailsEditor } from '@/components/pulse/ExerciseDetailsEditor';
import { WorkoutExerciseList } from '@/components/pulse/WorkoutExerciseList';

export function EditWorkoutScreen({
  routineName,
  day,
  restDay,
  restUnitPreferences,
  onRestUnitChange,
  onRestDayChange,
  onAddExercise,
  onRefresh,
  onClose,
}: {
  routineName: string;
  day: RoutineDay;
  restDay: boolean;
  restUnitPreferences: Record<number, 'seconds' | 'minutes'>;
  onRestUnitChange: (exerciseDetailId: number, unit: 'seconds' | 'minutes') => void;
  onRestDayChange: (value: boolean) => void;
  onAddExercise: () => void;
  onRefresh: () => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(day.workout_title ?? '');
  const [exercises, setExercises] = useState(day.exercises ?? []);
  const [selectedId, setSelectedId] = useState<number | null>(day.exercises?.[0]?.exercise_detail_id ?? null);
  const [savingTitle, setSavingTitle] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [editingTitle, setEditingTitle] = useState(!day.workout_title);

  const selectedExercise = useMemo(
    () => exercises.find((exercise) => exercise.exercise_detail_id === selectedId) ?? null,
    [exercises, selectedId],
  );
  const totalSets = exercises.reduce((total, exercise) => total + Number(exercise.sets || 0), 0);
  const estimateMinutes = Math.max(1, Math.round(exercises.reduce((total, exercise) => total + Number(exercise.sets || 0) * 100 + Math.max(Number(exercise.sets || 0) - 1, 0) * Number(exercise.rest_time || 0) + 120, 0) / 60));

  async function refresh() {
    await onRefresh();
    setMessage('Changes saved.');
    setIsError(false);
  }

  async function saveWorkoutTitle() {
    const nextTitle = title.trim();
    if (!nextTitle) {
      setMessage('Add a name for this workout day.');
      setIsError(true);
      return;
    }
    if (nextTitle === (day.workout_title ?? '')) {
      setEditingTitle(false);
      onClose();
      return;
    }
    setSavingTitle(true);
    try {
      await updateWorkoutTitle(day.id, nextTitle);
      await refresh();
      onClose();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save the workout name');
      setIsError(true);
    } finally {
      setSavingTitle(false);
    }
  }

  async function moveExercise(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= exercises.length) return;
    const reordered = [...exercises];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    const previous = exercises;
    setExercises(reordered);
    try {
      await reorderExercises(day.id, reordered.map((item) => item.exercise_detail_id));
      setMessage('Exercise order saved.');
      setIsError(false);
      await onRefresh();
    } catch (error) {
      setExercises(previous);
      setMessage(error instanceof Error ? error.message : 'Could not save the exercise order');
      setIsError(true);
    }
  }

  return (
    <PageFrame contentStyle={styles.page}>
      <PulseHeader right={<IconButton glyph="close" label="Close workout editor" onPress={onClose} />} />
      <View style={styles.headingBlock}>
        <Eyebrow>EDIT WORKOUT · {day.day_name.toUpperCase()}</Eyebrow>
        {editingTitle ? (
          <View style={styles.titleEditor}>
            <TextField label="WORKOUT NAME" value={title} onChangeText={setTitle} placeholder="e.g. Shoulders & Chest" autoFocus returnKeyType="go" onSubmitEditing={() => { if (!savingTitle) void saveWorkoutTitle(); }} />
            <View style={styles.titleActions}><ActionButton title="Save name" onPress={saveWorkoutTitle} loading={savingTitle} /><Pressable onPress={() => { setTitle(day.workout_title ?? ''); setEditingTitle(false); }} style={styles.cancelTitle}><Text style={styles.cancelTitleText}>Cancel</Text></Pressable></View>
          </View>
        ) : (
          <View style={styles.titleRow}><Text style={styles.title}>{title || 'Untitled workout'}</Text><Pressable onPress={() => setEditingTitle(true)} style={styles.editName}><Glyph name="edit" size={15} color={PulseColors.accentLight} /><Text style={styles.editNameText}>Edit name</Text></Pressable></View>
        )}
        <Text style={styles.subtitle}>Reorder exercises and adjust their details.</Text>
        <Text style={styles.routineName}>{routineName} · {day.day_name}</Text>
      </View>

      <View style={styles.metrics}>
        <Card style={styles.metric}><Text style={styles.metricLabel}>EXERCISES</Text><Text style={styles.metricValue}>{exercises.length}</Text></Card>
        <Card style={styles.metric}><Text style={styles.metricLabel}>TOTAL SETS</Text><Text style={styles.metricValue}>{totalSets}</Text></Card>
        <Card style={styles.metric}><Text style={styles.metricLabel}>EST. TIME</Text><Text style={styles.metricValue}>~{estimateMinutes}<Text style={styles.metricUnit}> min</Text></Text></Card>
      </View>

      <Pressable onPress={() => onRestDayChange(!restDay)} accessibilityRole="button" accessibilityState={{ selected: restDay }} style={[styles.restButton, restDay && styles.restButtonActive]}>
        <Glyph name="moon" size={17} color={PulseColors.accentLight} />
        <Text style={styles.restButtonText}>{restDay ? 'Rest day selected' : 'Mark as rest day'}</Text>
        <Text style={styles.restButtonAction}>{restDay ? 'Undo' : 'Set'}</Text>
      </Pressable>

      {restDay ? <Notice tone="success">This day is marked as a rest day on this device.</Notice> : null}
      <WorkoutExerciseList exercises={exercises} selectedId={selectedId} onSelect={(exercise) => setSelectedId(exercise.exercise_detail_id)} onMove={moveExercise} />
      <ActionButton title="Add exercise" glyph="add" variant="secondary" onPress={onAddExercise} />
      {selectedExercise && !restDay ? (
        <ExerciseDetailsEditor
          key={selectedExercise.exercise_detail_id}
          dayId={day.id}
          exercise={selectedExercise}
          restUnit={restUnitPreferences[selectedExercise.exercise_detail_id] ?? 'seconds'}
          onRestUnitChange={(unit) => onRestUnitChange(selectedExercise.exercise_detail_id, unit)}
          onSaved={refresh}
          onDeleted={async () => {
            await onRefresh();
            const remaining = exercises.filter((item) => item.exercise_detail_id !== selectedExercise.exercise_detail_id);
            setExercises(remaining);
            setSelectedId(remaining[0]?.exercise_detail_id ?? null);
          }}
        />
      ) : null}
      {message ? <Notice tone={isError ? 'error' : 'success'}>{message}</Notice> : null}
      <View style={styles.footer}>
        <ActionButton title="Cancel" variant="secondary" onPress={onClose} style={styles.footerButton} />
        <ActionButton title="Save workout" glyph="arrow" onPress={saveWorkoutTitle} loading={savingTitle} style={styles.footerButton} />
      </View>
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  page: { gap: PulseSpacing.lg, paddingTop: 10 },
  headingBlock: { gap: 7 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, color: PulseColors.textStrong, fontSize: 27, lineHeight: 31, fontWeight: '800', letterSpacing: -1 },
  editName: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 7 },
  editNameText: { color: PulseColors.mutedLight, fontSize: 11, fontWeight: '700' },
  subtitle: { color: PulseColors.mutedLight, fontSize: 13 },
  routineName: { color: PulseColors.muted, fontSize: 11 },
  titleEditor: { gap: 9 },
  titleActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cancelTitle: { padding: 10 },
  cancelTitleText: { color: PulseColors.mutedLight, fontSize: 12, fontWeight: '700' },
  metrics: { flexDirection: 'row', gap: 7 },
  metric: { flex: 1, minHeight: 69, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8, backgroundColor: 'rgba(5,14,31,0.76)', borderRadius: 14 },
  metricLabel: { color: PulseColors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.9 },
  metricValue: { color: PulseColors.textStrong, fontSize: 19, fontWeight: '800' },
  metricUnit: { color: PulseColors.mutedLight, fontSize: 10, fontWeight: '600' },
  restButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, borderRadius: 13, backgroundColor: 'rgba(59,130,246,0.08)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.28)' },
  restButtonActive: { backgroundColor: 'rgba(59,130,246,0.18)', borderColor: PulseColors.accent },
  restButtonText: { flex: 1, color: '#C4D9FF', fontSize: 12, fontWeight: '700' },
  restButtonAction: { color: PulseColors.accentLight, fontSize: 11, fontWeight: '800' },
  footer: { flexDirection: 'row', gap: 9, paddingTop: 5 },
  footerButton: { flex: 1 },
});
