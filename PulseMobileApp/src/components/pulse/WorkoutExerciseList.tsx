import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { WorkoutExercise } from '@/api/pulse-api';
import { PulseColors } from '@/constants/pulse-theme';

export function WorkoutExerciseList({
  exercises,
  selectedId,
  onSelect,
  onMove,
}: {
  exercises: WorkoutExercise[];
  selectedId: number | null;
  onSelect: (exercise: WorkoutExercise) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>EXERCISE ORDER</Text>
      {exercises.length === 0 ? (
        <Text style={styles.empty}>No exercises assigned yet.</Text>
      ) : (
        <ScrollView nestedScrollEnabled style={styles.scroll} contentContainerStyle={styles.list} showsVerticalScrollIndicator>
          {exercises.map((exercise, index) => (
            <Pressable
              key={exercise.exercise_detail_id}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedId === exercise.exercise_detail_id }}
              onPress={() => onSelect(exercise)}
              style={[styles.row, selectedId === exercise.exercise_detail_id && styles.rowSelected]}>
              <Text style={styles.number}>{index + 1}</Text>
              <View style={styles.copy}>
                <Text numberOfLines={1} style={styles.name}>{exercise.name}</Text>
                <Text style={styles.summary}>{exercise.sets} sets · {exercise.reps} reps</Text>
              </View>
              <View style={styles.reorderActions}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Move ${exercise.name} up`} disabled={index === 0} onPress={() => onMove(index, index - 1)} style={styles.arrowButton}>
                  <Text style={[styles.arrow, index === 0 && styles.arrowDisabled]}>↑</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={`Move ${exercise.name} down`} disabled={index === exercises.length - 1} onPress={() => onMove(index, index + 1)} style={styles.arrowButton}>
                  <Text style={[styles.arrow, index === exercises.length - 1 && styles.arrowDisabled]}>↓</Text>
                </Pressable>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 9 },
  heading: { color: PulseColors.mutedLight, fontSize: 10, fontWeight: '800', letterSpacing: 1.7 },
  scroll: { maxHeight: 214 },
  list: { gap: 7, paddingRight: 2 },
  row: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, backgroundColor: 'rgba(14,29,59,0.72)', borderWidth: 1, borderColor: 'transparent', borderRadius: 15 },
  rowSelected: { backgroundColor: 'rgba(26,62,120,0.58)', borderColor: '#2860A8' },
  number: { width: 34, height: 34, textAlign: 'center', textAlignVertical: 'center', overflow: 'hidden', borderRadius: 11, backgroundColor: '#1B3E70', color: '#9BC4FF', fontSize: 15, lineHeight: 34, fontWeight: '800' },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  name: { color: PulseColors.textStrong, fontSize: 13, fontWeight: '700' },
  summary: { color: PulseColors.muted, fontSize: 11 },
  reorderActions: { gap: 2 },
  arrowButton: { width: 29, height: 23, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: 'rgba(96,165,250,0.1)' },
  arrow: { color: '#9BC4FF', fontSize: 15, lineHeight: 18, fontWeight: '800' },
  arrowDisabled: { opacity: 0.28 },
  empty: { color: PulseColors.muted, fontSize: 12, paddingVertical: 12 },
});
