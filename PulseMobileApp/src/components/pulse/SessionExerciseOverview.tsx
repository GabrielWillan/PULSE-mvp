import { StyleSheet, Text, View } from 'react-native';

import type { WorkoutExercise } from '@/api/pulse-api';
import { PulseColors, PulseRadii } from '@/constants/pulse-theme';
import { ActionButton, Card, Eyebrow } from '@/components/pulse/PulseUI';

function restLabel(seconds: number, unit: 'seconds' | 'minutes') {
  const value = unit === 'minutes' ? Number((seconds / 60).toFixed(2)) : seconds;
  return `${value} ${unit === 'minutes' ? 'min' : 'sec'}`;
}

export function SessionExerciseOverview({
  exercise,
  index,
  exerciseCount,
  setNumber,
  restUnit,
  onStartSet,
}: {
  exercise: WorkoutExercise;
  index: number;
  exerciseCount: number;
  setNumber: number;
  restUnit: 'seconds' | 'minutes';
  onStartSet: () => void;
}) {
  const totalSets = Math.max(1, Number(exercise.sets) || 1);
  return (
    <Card style={styles.card}>
      <Eyebrow>Up next · Exercise {index + 1} of {exerciseCount}</Eyebrow>
      <Text style={styles.title}>{exercise.name}</Text>
      <View style={styles.tags}><Text style={styles.tag}>Day session</Text><Text style={styles.tag}>{totalSets} sets</Text></View>
      <View style={styles.stats}>
        <View style={styles.stat}><Text style={styles.statLabel}>SETS</Text><Text style={styles.statValue}>{totalSets}</Text></View>
        <View style={styles.stat}><Text style={styles.statLabel}>REPS</Text><Text style={styles.statValue}>{exercise.reps}</Text></View>
        <View style={styles.stat}><Text style={styles.statLabel}>REST</Text><Text style={styles.statValue}>{restLabel(exercise.rest_time, restUnit)}</Text></View>
      </View>
      {exercise.note ? <View style={styles.note}><Text style={styles.noteLabel}>EXERCISE NOTE</Text><Text style={styles.noteText}>{exercise.note}</Text></View> : null}
      <View style={styles.progressLine}><Text style={styles.progressLabel}>Sets completed</Text><View style={styles.dots}>{Array.from({ length: totalSets }, (_, dotIndex) => <View key={dotIndex} style={[styles.dot, dotIndex < setNumber - 1 && styles.dotDone]} />)}</View><Text style={styles.progressValue}>{setNumber - 1} / {totalSets}</Text></View>
      <ActionButton title="Start set" glyph="play" onPress={onStartSet} style={styles.start} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14, padding: 17, backgroundColor: 'rgba(14,29,59,0.96)', borderRadius: PulseRadii.large },
  title: { color: '#fff', fontSize: 25, lineHeight: 29, fontWeight: '800', letterSpacing: -0.9 },
  tags: { flexDirection: 'row', gap: 7 },
  tag: { color: '#A9CAFF', fontSize: 10, fontWeight: '700', paddingHorizontal: 9, paddingVertical: 6, backgroundColor: 'rgba(59,130,246,0.13)', borderColor: 'rgba(59,130,246,0.3)', borderWidth: 1, borderRadius: PulseRadii.small, overflow: 'hidden' },
  stats: { flexDirection: 'row', gap: 7 },
  stat: { flex: 1, minHeight: 68, alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#08152C', borderWidth: 1, borderColor: '#1A3769', borderRadius: 13 },
  statLabel: { color: PulseColors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.1 },
  statValue: { color: PulseColors.textStrong, fontSize: 15, fontWeight: '800' },
  note: { gap: 5, padding: 11, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.08)', borderLeftWidth: 2, borderLeftColor: PulseColors.accent },
  noteLabel: { color: PulseColors.accentLight, fontSize: 8, fontWeight: '800', letterSpacing: 1.1 },
  noteText: { color: '#D0DDF1', fontSize: 12, lineHeight: 17 },
  progressLine: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressLabel: { color: PulseColors.mutedLight, fontSize: 10 },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#284674' },
  dotDone: { backgroundColor: PulseColors.accent },
  progressValue: { marginLeft: 'auto', color: PulseColors.textStrong, fontSize: 11, fontWeight: '800' },
  start: { marginTop: 1 },
});
