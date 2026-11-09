import { StyleSheet, Text, View } from 'react-native';

import type { WorkoutExercise } from '@/api/pulse-api';
import { PulseColors, PulseRadii } from '@/constants/pulse-theme';
import { ActionButton, Card, Eyebrow } from '@/components/pulse/PulseUI';

export function SetOverview({
  exercise,
  index,
  exerciseCount,
  setNumber,
  restUnit,
  onComplete,
}: {
  exercise: WorkoutExercise;
  index: number;
  exerciseCount: number;
  setNumber: number;
  restUnit: 'seconds' | 'minutes';
  onComplete: () => void;
}) {
  const totalSets = Math.max(1, Number(exercise.sets) || 1);
  return (
    <Card style={styles.card}>
      <Eyebrow>Set {setNumber} of {totalSets}</Eyebrow>
      <Text style={styles.title}>{exercise.name}</Text>
      <Text style={styles.reps}>{exercise.reps}</Text>
      <Text style={styles.target}>TARGET REPS</Text>
      <View style={styles.pills}><Text style={styles.pill}>Rest {restUnit === 'minutes' ? Number((exercise.rest_time / 60).toFixed(2)) : exercise.rest_time} {restUnit === 'minutes' ? 'min' : 'sec'}</Text><Text style={styles.pill}>{totalSets} sets total</Text></View>
      <View style={styles.dots}>{Array.from({ length: totalSets }, (_, dotIndex) => <View key={dotIndex} style={[styles.dot, dotIndex < setNumber - 1 && styles.dotDone]} />)}</View>
      <Text style={styles.exerciseCounter}>Exercise {index + 1} of {exerciseCount}</Text>
      <ActionButton title="Complete set" glyph="check" onPress={onComplete} style={styles.button} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 420, alignItems: 'center', justifyContent: 'center', gap: 11, padding: 22, backgroundColor: 'rgba(14,29,59,0.96)', borderRadius: PulseRadii.large },
  title: { color: '#fff', fontSize: 24, lineHeight: 29, fontWeight: '800', letterSpacing: -0.8, textAlign: 'center' },
  reps: { color: '#fff', fontSize: 100, lineHeight: 105, fontWeight: '800', letterSpacing: -7, marginTop: 5 },
  target: { color: '#70AAFF', fontSize: 9, fontWeight: '800', letterSpacing: 2.1 },
  pills: { flexDirection: 'row', gap: 6, marginTop: 5 },
  pill: { color: '#A9CAFF', fontSize: 10, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(59,130,246,0.12)', overflow: 'hidden' },
  dots: { flexDirection: 'row', gap: 6, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#284674' },
  dotDone: { backgroundColor: PulseColors.accent },
  exerciseCounter: { marginTop: 3, color: PulseColors.muted, fontSize: 10 },
  button: { width: '100%', marginTop: 8 },
});
