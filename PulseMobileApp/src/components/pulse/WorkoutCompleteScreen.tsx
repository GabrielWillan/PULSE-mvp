import { StyleSheet, Text, View } from 'react-native';

import { PulseColors } from '@/constants/pulse-theme';
import { ActionButton, Card, Eyebrow, PageFrame, PulseHeader } from '@/components/pulse/PulseUI';

export function WorkoutCompleteScreen({
  exerciseCount,
  totalSets,
  elapsed,
  onDone,
}: {
  exerciseCount: number;
  totalSets: number;
  elapsed: string;
  onDone: () => void;
}) {
  return (
    <PageFrame contentStyle={styles.page}>
      <PulseHeader />
      <View style={styles.center}>
        <View style={styles.checkmark}><Text style={styles.checkText}>✓</Text></View>
        <Eyebrow>Session complete</Eyebrow>
        <Text style={styles.title}>Strong work.</Text>
        <Text style={styles.subtitle}>Your workout is saved. Take a moment to recover.</Text>
        <Card style={styles.summary}>
          <View><Text style={styles.value}>{exerciseCount}</Text><Text style={styles.label}>EXERCISES</Text></View>
          <View><Text style={styles.value}>{totalSets}</Text><Text style={styles.label}>SETS</Text></View>
          <View><Text style={styles.value}>{elapsed}</Text><Text style={styles.label}>DURATION</Text></View>
        </Card>
        <ActionButton title="Back to dashboard" onPress={onDone} style={styles.done} />
      </View>
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 13, paddingBottom: 40 },
  checkmark: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: PulseColors.accent, shadowColor: PulseColors.accent, shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  checkText: { color: '#fff', fontSize: 36, fontWeight: '800' },
  title: { color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: -1.5 },
  subtitle: { maxWidth: 300, color: PulseColors.mutedLight, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  summary: { width: '100%', flexDirection: 'row', justifyContent: 'space-around', marginTop: 8, backgroundColor: 'rgba(14,29,59,0.9)' },
  value: { color: PulseColors.textStrong, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  label: { marginTop: 4, color: PulseColors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1, textAlign: 'center' },
  done: { width: '100%', marginTop: 6 },
});
