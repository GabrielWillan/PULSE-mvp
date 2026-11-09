import { useState } from 'react';
import { Alert, Keyboard, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { removeExercise, updateExercise, type ExerciseSearchResult, type WorkoutExercise } from '@/api/pulse-api';
import { PulseColors, PulseRadii } from '@/constants/pulse-theme';
import { ActionButton, Card, Eyebrow, Notice, TextField } from '@/components/pulse/PulseUI';
import { useExerciseSearch } from '@/hooks/use-exercise-search';

export function ExerciseDetailsEditor({
  dayId,
  exercise,
  restUnit,
  onRestUnitChange,
  onSaved,
  onDeleted,
}: {
  dayId: number;
  exercise: WorkoutExercise;
  restUnit: 'seconds' | 'minutes';
  onRestUnitChange: (unit: 'seconds' | 'minutes') => void;
  onSaved: () => Promise<void> | void;
  onDeleted: () => Promise<void> | void;
}) {
  const [nameQuery, setNameQuery] = useState(exercise.name);
  const [selectedReplacement, setSelectedReplacement] = useState<ExerciseSearchResult | null>(null);
  const [sets, setSets] = useState(String(exercise.sets));
  const [reps, setReps] = useState(String(exercise.reps));
  const [restValue, setRestValue] = useState(String(restUnit === 'minutes' ? Number((exercise.rest_time / 60).toFixed(2)) : exercise.rest_time));
  const [note, setNote] = useState(exercise.note ?? '');
  const [message, setMessage] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);
  const [saving, setSaving] = useState(false);
  const replacementSearchEnabled = !selectedReplacement && nameQuery.trim().toLowerCase() !== exercise.name.toLowerCase();
  const { results: searchResults, loading: searching, error: searchError, searched, canSearch } = useExerciseSearch(nameQuery, replacementSearchEnabled);

  function changeRestUnit(unit: 'seconds' | 'minutes') {
    if (unit === restUnit) return;
    const value = Number(restValue);
    if (Number.isFinite(value)) setRestValue(String(unit === 'minutes' ? Number((value / 60).toFixed(2)) : Math.round(value * 60)));
    onRestUnitChange(unit);
  }

  async function save() {
    const setCount = Number(sets);
    const repCount = Number(reps);
    const shownRest = Number(restValue);
    if (!Number.isInteger(setCount) || setCount < 1 || !Number.isInteger(repCount) || repCount < 1 || !Number.isFinite(shownRest) || shownRest < 0) {
      setMessage('Enter valid sets, reps, and rest time.');
      setMessageIsError(true);
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await updateExercise({
        day_id: dayId,
        exercise_detail_id: exercise.exercise_detail_id,
        exercise_id: selectedReplacement?.id ?? exercise.id,
        sets: setCount,
        reps: repCount,
        rest_time: Math.round(shownRest * (restUnit === 'minutes' ? 60 : 1)),
        note: note.trim() || null,
      });
      setMessage('Exercise saved.');
      setMessageIsError(false);
      await onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save exercise');
      setMessageIsError(true);
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Delete exercise?', `Remove ${exercise.name} from this workout?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            await removeExercise(dayId, exercise.exercise_detail_id);
            await onDeleted();
          } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Could not delete exercise');
            setMessageIsError(true);
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  }

  return (
    <Card style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}><Eyebrow>Selected exercise</Eyebrow><Text style={styles.exerciseName}>{exercise.name}</Text></View>
        <Pressable onPress={confirmDelete} accessibilityRole="button" accessibilityLabel={`Delete ${exercise.name}`} style={styles.deleteButton}><Text style={styles.deleteText}>Delete</Text></Pressable>
      </View>
      <View style={styles.searchWrap}>
        <TextField
          label="EXERCISE NAME"
          value={selectedReplacement?.name ?? nameQuery}
          onChangeText={(value) => { setSelectedReplacement(null); setNameQuery(value); }}
          placeholder="Search to replace"
          autoCorrect={false}
        />
        {searchResults.length > 0 ? <ScrollView style={styles.searchResults} nestedScrollEnabled keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>{searchResults.map((result) => <Pressable key={result.id} onPress={() => { Keyboard.dismiss(); setSelectedReplacement(result); setNameQuery(result.name); }} style={styles.searchResult}><Text style={styles.resultName}>{result.name}</Text></Pressable>)}</ScrollView> : null}
        {searching ? <Text style={styles.searchHint}>Searching exercises…</Text> : null}
        {searchError ? <Text accessibilityRole="alert" style={styles.searchError}>{searchError}</Text> : null}
        {searched && !searchError && searchResults.length === 0 ? <Text style={styles.searchHint}>No exercises found. Try another name.</Text> : null}
        {replacementSearchEnabled && !canSearch && nameQuery.trim().length > 0 ? <Text style={styles.searchHint}>Type at least 2 characters to search.</Text> : null}
      </View>
      <View style={styles.fields}>
        <TextField label="SETS" value={sets} onChangeText={setSets} keyboardType="number-pad" />
        <TextField label="REPS" value={reps} onChangeText={setReps} keyboardType="number-pad" />
      </View>
      <View style={styles.restSection}>
        <Text style={styles.fieldLabel}>REST</Text>
        <View style={styles.restRow}>
          <TextField label="DURATION" value={restValue} onChangeText={setRestValue} keyboardType="decimal-pad" inputStyle={styles.restInput} />
          <View style={styles.unitToggle}>{(['seconds', 'minutes'] as const).map((unit) => <Pressable key={unit} onPress={() => changeRestUnit(unit)} accessibilityRole="button" accessibilityState={{ selected: restUnit === unit }} style={[styles.unitButton, restUnit === unit && styles.unitActive]}><Text style={[styles.unitLabel, restUnit === unit && styles.unitLabelActive]}>{unit === 'seconds' ? 'sec' : 'min'}</Text></Pressable>)}</View>
        </View>
      </View>
      <TextField label="EXERCISE NOTE" value={note} onChangeText={setNote} placeholder="Add a cue, tempo, or reminder…" multiline inputStyle={styles.noteInput} />
      {message ? <Notice tone={messageIsError ? 'error' : 'success'}>{message}</Notice> : null}
      <ActionButton title="Save exercise" onPress={save} loading={saving} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 13, backgroundColor: 'rgba(5,14,31,0.78)', borderColor: 'rgba(49,80,120,0.82)', borderRadius: PulseRadii.large },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  headingCopy: { flex: 1, gap: 4 },
  exerciseName: { color: PulseColors.textStrong, fontSize: 16, fontWeight: '800' },
  deleteButton: { minHeight: 36, paddingHorizontal: 10, justifyContent: 'center', borderRadius: 10, backgroundColor: 'rgba(255,119,135,0.08)', borderWidth: 1, borderColor: 'rgba(255,119,135,0.25)' },
  deleteText: { color: PulseColors.danger, fontSize: 11, fontWeight: '700' },
  searchWrap: { zIndex: 2, gap: 5 },
  searchResults: { maxHeight: 140, padding: 4, backgroundColor: '#071226', borderWidth: 1, borderColor: PulseColors.border, borderRadius: 12 },
  searchResult: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 8 },
  resultName: { color: PulseColors.text, fontSize: 12 },
  searchHint: { color: PulseColors.muted, fontSize: 11, paddingHorizontal: 2 },
  searchError: { color: PulseColors.danger, fontSize: 11, paddingHorizontal: 2 },
  fields: { flexDirection: 'row', gap: 10 },
  fieldLabel: { color: '#B9CCE7', fontSize: 11, fontWeight: '700' },
  restSection: { gap: 6 },
  restRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 9 },
  restInput: { minWidth: 82 },
  unitToggle: { height: 46, flex: 1, flexDirection: 'row', alignItems: 'center', padding: 3, backgroundColor: 'rgba(5,14,31,0.82)', borderWidth: 1, borderColor: PulseColors.borderStrong, borderRadius: 12 },
  unitButton: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  unitActive: { backgroundColor: PulseColors.accent },
  unitLabel: { color: PulseColors.mutedLight, fontSize: 12, fontWeight: '700' },
  unitLabelActive: { color: '#fff' },
  noteInput: { minHeight: 74, textAlignVertical: 'top' },
});
