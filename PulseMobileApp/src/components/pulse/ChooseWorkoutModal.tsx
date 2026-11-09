import { useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { addExercise, type ExerciseSearchResult } from '@/api/pulse-api';
import { PulseColors, PulseRadii, PulseSpacing } from '@/constants/pulse-theme';
import { ActionButton, Eyebrow, Glyph, Notice, TextField } from '@/components/pulse/PulseUI';
import { ModalScroll, PulseModal } from '@/components/pulse/PulseModal';
import { useExerciseSearch } from '@/hooks/use-exercise-search';

export function ChooseWorkoutModal({
  visible,
  dayId,
  dayName,
  isRestDay,
  onRestDayChange,
  onClose,
  onAdded,
}: {
  visible: boolean;
  dayId: number | null;
  dayName: string;
  isRestDay: boolean;
  onRestDayChange: (value: boolean) => void;
  onClose: () => void;
  onAdded: (exerciseId: number, restUnit: 'seconds' | 'minutes') => Promise<void> | void;
}) {
  const [search, setSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseSearchResult | null>(null);
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [restValue, setRestValue] = useState('90');
  const [restUnit, setRestUnit] = useState<'seconds' | 'minutes'>('seconds');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const { results, loading: searching, error: searchError, searched, canSearch } = useExerciseSearch(search, visible && !selectedExercise);

  function close() {
    setSearch('');
    setSelectedExercise(null);
    setSets('3');
    setReps('10');
    setRestValue('90');
    setRestUnit('seconds');
    setNote('');
    setMessage('');
    setIsError(false);
    onClose();
  }

  function chooseRestUnit(nextUnit: 'seconds' | 'minutes') {
    if (nextUnit === restUnit) return;
    const value = Number(restValue);
    if (Number.isFinite(value)) {
      setRestValue(String(nextUnit === 'minutes' ? Number((value / 60).toFixed(2)) : Math.round(value * 60)));
    }
    setRestUnit(nextUnit);
  }

  async function saveExercise() {
    if (isRestDay) {
      await onRestDayChange(true);
      close();
      return;
    }
    if (!dayId || !selectedExercise) {
      setMessage('Choose an exercise for this day.');
      setIsError(true);
      return;
    }
    const setCount = Number(sets);
    const repCount = Number(reps);
    const shownRest = Number(restValue);
    if (!Number.isInteger(setCount) || setCount < 1 || !Number.isInteger(repCount) || repCount < 1 || !Number.isFinite(shownRest) || shownRest < 0) {
      setMessage('Enter valid sets, reps, and rest time.');
      setIsError(true);
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      await addExercise({
        day_id: dayId,
        exercise_id: selectedExercise.id,
        sets: setCount,
        reps: repCount,
        rest_time: Math.round(shownRest * (restUnit === 'minutes' ? 60 : 1)),
        note: note.trim() || null,
      });
      await onAdded(selectedExercise.id, restUnit);
      close();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not add this exercise');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PulseModal visible={visible} onClose={close}>
      <ModalScroll>
        <View style={styles.topRow}>
          <View style={styles.titleGroup}>
            <Eyebrow>{dayName} · Schedule</Eyebrow>
            <Text style={styles.title}>Choose a workout</Text>
            <Text style={styles.subtitle}>Add an exercise to this day.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={styles.close}><Glyph name="close" size={24} color={PulseColors.mutedLight} /></Pressable>
        </View>

        <Pressable onPress={() => onRestDayChange(!isRestDay)} style={[styles.restOption, isRestDay && styles.restOptionSelected]} accessibilityRole="button" accessibilityState={{ selected: isRestDay }}>
          <View style={styles.restGlyph}><Glyph name="moon" size={18} color={PulseColors.accentLight} /></View>
          <View style={styles.restCopy}><Text style={styles.restTitle}>Mark as rest day</Text><Text style={styles.restSubtitle}>Keep this day free from training.</Text></View>
          <Switch value={isRestDay} onValueChange={onRestDayChange} trackColor={{ false: '#263B60', true: PulseColors.accent }} thumbColor="#EAF1FF" />
        </Pressable>

        {isRestDay ? (
          <Notice tone="success">This day is marked as a rest day on this device.</Notice>
        ) : (
          <>
            <View style={styles.searchBlock}>
              <TextField
                label="EXERCISE NAME"
                value={selectedExercise?.name ?? search}
                onChangeText={(value) => {
                  setSelectedExercise(null);
                  setSearch(value);
                  setMessage('');
                  setIsError(false);
                }}
                placeholder="Search exercises"
                autoCorrect={false}
              />
              {!selectedExercise && results.length > 0 ? (
                <ScrollView style={styles.searchResults} nestedScrollEnabled keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
                  {results.map((exercise) => (
                    <Pressable key={exercise.id} onPress={() => { Keyboard.dismiss(); setSelectedExercise(exercise); setSearch(exercise.name); }} style={styles.searchResult}>
                      <Text style={styles.searchResultText}>{exercise.name}</Text><Glyph name="chevron" size={20} color={PulseColors.muted} />
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}
              {!selectedExercise && searching ? <Text style={styles.searchHint}>Searching exercises…</Text> : null}
              {!selectedExercise && searchError ? <Text accessibilityRole="alert" style={styles.searchError}>{searchError}</Text> : null}
              {!selectedExercise && searched && !searchError && results.length === 0 ? <Text style={styles.searchHint}>No exercises found. Try another name.</Text> : null}
              {!selectedExercise && !canSearch && search.trim().length > 0 ? <Text style={styles.searchHint}>Type at least 2 characters to search.</Text> : null}
            </View>

            <View style={styles.inputGrid}>
              <TextField label="SETS" value={sets} onChangeText={setSets} keyboardType="number-pad" />
              <TextField label="REPS" value={reps} onChangeText={setReps} keyboardType="number-pad" />
            </View>
            <Text style={styles.fieldLabel}>REST TIME</Text>
            <View style={styles.restRow}>
              <TextField label="DURATION" value={restValue} onChangeText={setRestValue} keyboardType="decimal-pad" inputStyle={styles.restInput} />
              <View style={styles.unitPicker}>
                {(['seconds', 'minutes'] as const).map((unit) => (
                  <Pressable key={unit} accessibilityRole="button" accessibilityState={{ selected: restUnit === unit }} onPress={() => chooseRestUnit(unit)} style={[styles.unitOption, restUnit === unit && styles.unitOptionActive]}>
                    <Text style={[styles.unitText, restUnit === unit && styles.unitTextActive]}>{unit === 'seconds' ? 'sec' : 'min'}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <TextField label="NOTE (OPTIONAL)" value={note} onChangeText={setNote} placeholder="Add a cue, tempo, or reminder…" multiline inputStyle={styles.noteInput} />
          </>
        )}

        {message ? <Notice tone={isError ? 'error' : 'info'}>{message}</Notice> : null}
        <View style={styles.actions}>
          <ActionButton title="Cancel" variant="secondary" onPress={close} style={styles.actionButton} />
          <ActionButton title={isRestDay ? 'Save rest day' : 'Add exercise'} glyph={isRestDay ? 'check' : 'add'} onPress={saveExercise} loading={loading} disabled={!isRestDay && (!selectedExercise || !dayId)} style={styles.actionButton} />
        </View>
      </ModalScroll>
    </PulseModal>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  titleGroup: { flex: 1, gap: 5 },
  title: { color: PulseColors.textStrong, fontSize: 23, lineHeight: 27, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: PulseColors.mutedLight, fontSize: 13, lineHeight: 18 },
  close: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: 'rgba(148,163,184,0.08)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.22)' },
  restOption: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: PulseRadii.medium, borderWidth: 1, borderColor: 'rgba(96,165,250,0.28)', backgroundColor: 'rgba(59,130,246,0.08)' },
  restOptionSelected: { backgroundColor: 'rgba(59,130,246,0.17)', borderColor: PulseColors.accent },
  restGlyph: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: PulseColors.accentSoft },
  restCopy: { flex: 1, gap: 3 },
  restTitle: { color: PulseColors.text, fontSize: 12, fontWeight: '700' },
  restSubtitle: { color: PulseColors.muted, fontSize: 10 },
  searchBlock: { gap: 7, zIndex: 2 },
  searchResults: { maxHeight: 180, overflow: 'scroll', padding: 5, borderRadius: 13, borderWidth: 1, borderColor: PulseColors.border, backgroundColor: '#071226' },
  searchResult: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 11, borderRadius: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: PulseColors.border },
  searchResultText: { flex: 1, color: PulseColors.text, fontSize: 13 },
  searchHint: { color: PulseColors.muted, fontSize: 11, paddingHorizontal: 2 },
  searchError: { color: PulseColors.danger, fontSize: 11, paddingHorizontal: 2 },
  inputGrid: { flexDirection: 'row', gap: 10 },
  restRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  restInput: { minWidth: 90 },
  unitPicker: { flex: 1, height: 46, flexDirection: 'row', alignItems: 'center', padding: 3, borderRadius: 12, borderWidth: 1, borderColor: PulseColors.borderStrong, backgroundColor: 'rgba(5,14,31,0.82)' },
  unitOption: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  unitOptionActive: { backgroundColor: PulseColors.accent },
  unitText: { color: PulseColors.mutedLight, fontSize: 12, fontWeight: '700' },
  unitTextActive: { color: '#fff' },
  fieldLabel: { color: '#B9CCE7', fontSize: 11, fontWeight: '700', letterSpacing: 0.25 },
  noteInput: { minHeight: 76, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: PulseSpacing.sm, paddingTop: 3 },
  actionButton: { flex: 1 },
});
