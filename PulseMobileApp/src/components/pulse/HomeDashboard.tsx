import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import type { Routine, RoutineDay } from '@/api/pulse-api';
import { PulseColors, PulseRadii } from '@/constants/pulse-theme';
import { ActionButton, Card, Eyebrow, Glyph, Notice, PageFrame, PulseHeader } from '@/components/pulse/PulseUI';

function getWeekNumber(date: Date) {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNumber);
  const firstDay = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  return Math.ceil((((utcDate.getTime() - firstDay.getTime()) / 86400000) + 1) / 7);
}

export function HomeDashboard({
  routines,
  routine,
  days,
  selectedDayId,
  restDay,
  restDays,
  loading,
  error,
  onOpenRoutinePicker,
  onOpenRoutines,
  onSelectDay,
  onEditWorkout,
  onStartSession,
  onRetry,
}: {
  routines: Routine[];
  routine: Routine | null;
  days: RoutineDay[];
  selectedDayId: number | null;
  restDay: boolean;
  restDays: Record<number, boolean>;
  loading: boolean;
  error: string;
  onOpenRoutinePicker: () => void;
  onOpenRoutines: () => void;
  onSelectDay: (day: RoutineDay) => void;
  onEditWorkout: () => void;
  onStartSession: () => void;
  onRetry: () => void;
}) {
  const selectedDay = days.find((day) => day.id === selectedDayId) ?? days[0] ?? null;
  const { width: screenWidth } = useWindowDimensions();
  const dayItemWidth = Math.max(38, Math.min(48, (Math.min(screenWidth - 40, 760) - 38) / 7));
  const today = new Date();
  const dateLabel = today.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const exerciseCount = selectedDay?.exercises?.length ?? 0;

  return (
    <PageFrame contentStyle={styles.page}>
      <PulseHeader subtitle={dateLabel} />
      <View style={styles.hero}>
        <Eyebrow>Your training calendar</Eyebrow>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.subtitle}>A quick look at your week and what’s next.</Text>
      </View>

      <Card style={styles.weekCard}>
        <View style={styles.weekHeader}><Text style={styles.weekTitle}>Week {getWeekNumber(today)}</Text><Text style={styles.weekCaption}>{days.length || 7} training days</Text></View>
        {routine ? <Pressable accessibilityRole="button" onPress={onOpenRoutinePicker} style={styles.routineChip}><Text style={styles.routineChipLabel}>ROUTINE</Text><Text numberOfLines={1} style={styles.routineChipName}>{routine.name}</Text><Glyph name="chevron" size={17} color={PulseColors.muted} /></Pressable> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
          {days.map((day) => {
            const selected = day.id === selectedDay?.id;
            const selectedRest = restDays[day.id] ?? Boolean(day.is_rest_day);
            return <Pressable key={day.id} onPress={() => onSelectDay(day)} accessibilityRole="button" accessibilityState={{ selected }} style={[styles.dayItem, { width: dayItemWidth }, selected && styles.dayItemSelected]}><Text numberOfLines={1} style={[styles.dayText, selected && styles.dayTextSelected]}>{day.day_name.replace('Day', 'Day ')}</Text><View style={[styles.dayDot, Boolean(selectedRest || day.exercises?.length) && styles.dayDotActive]} /></Pressable>;
          })}
        </ScrollView>
      </Card>

      {error ? <Notice tone="error">{error} <Text onPress={onRetry} style={styles.retry}>Try again</Text></Notice> : null}
      {loading ? <Card style={styles.loadingCard}><Text style={styles.loadingText}>Loading your routine…</Text></Card> : null}
      {!loading && !routine ? <Card style={styles.emptyCard}><Eyebrow>Get started</Eyebrow><Text style={styles.emptyTitle}>Create your first routine</Text><Text style={styles.subtitle}>Your seven training days will appear here.</Text><ActionButton title="Open routines" glyph="arrow" onPress={onOpenRoutines} /></Card> : null}
      {!loading && routine && selectedDay ? (
        <>
          <Card style={styles.workoutCard}>
            <Eyebrow>Selected · {selectedDay.day_name.replace('Day', 'Day ')}</Eyebrow>
            {restDay ? <View style={styles.restBadge}><Glyph name="moon" size={15} color={PulseColors.accentLight} /><Text style={styles.restBadgeText}>Rest day</Text></View> : <Text style={styles.workoutTitle}>{selectedDay.workout_title || 'Workout not named yet'}</Text>}
            <Text style={styles.workoutMeta}>{restDay ? 'Recovery is part of the plan.' : `${exerciseCount} ${exerciseCount === 1 ? 'exercise' : 'exercises'} assigned`}</Text>
            <View style={styles.actions}>
              <ActionButton title="Edit workout" variant="secondary" onPress={onEditWorkout} style={styles.actionButton} />
              <ActionButton title="Start session" glyph="activity" onPress={onStartSession} disabled={restDay || exerciseCount === 0} style={styles.actionButton} />
            </View>
            {!restDay && exerciseCount === 0 ? <Text style={styles.emptyHint}>Add exercises to this day before starting.</Text> : null}
          </Card>
          <Card style={styles.lastSession}>
            <View style={styles.recentIcon}><Glyph name="clock" size={17} color={PulseColors.accentLight} /></View>
            <View style={styles.recentCopy}>
              <Text style={styles.lastTitle}>Recent session</Text>
              <Text style={styles.lastEmpty}>Your completed workouts will appear here.</Text>
            </View>
            <Glyph name="chevron" size={19} color={PulseColors.muted} />
          </Card>
        </>
      ) : null}
      {!loading && routines.length === 0 && !error ? <Notice>Create a routine from the Routines tab to get started.</Notice> : null}
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  page: { gap: 12, paddingTop: 6, paddingBottom: 112 },
  hero: { alignItems: 'flex-start', gap: 4, paddingTop: 5, paddingBottom: 2 },
  greeting: { color: '#fff', fontSize: 30, lineHeight: 35, fontWeight: '800', letterSpacing: -1.1 },
  subtitle: { color: PulseColors.mutedLight, fontSize: 12, lineHeight: 17 },
  weekCard: { gap: 10, padding: 13, backgroundColor: 'rgba(14,29,59,0.92)', borderRadius: PulseRadii.large },
  weekHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  weekTitle: { color: PulseColors.textStrong, fontSize: 15, fontWeight: '800' },
  weekCaption: { color: PulseColors.muted, fontSize: 10, fontWeight: '600' },
  routineChip: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 9, backgroundColor: 'rgba(5,14,31,0.56)', borderWidth: 1, borderColor: 'rgba(87,128,190,0.25)', borderRadius: 10 },
  routineChipLabel: { color: PulseColors.muted, fontSize: 7.5, fontWeight: '800', letterSpacing: 0.9 },
  routineChipName: { flex: 1, color: '#B8D4FF', fontSize: 10.5, fontWeight: '700' },
  dayStrip: { gap: 2 },
  dayItem: { minHeight: 55, alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 12 },
  dayItemSelected: { backgroundColor: '#1A3E78' },
  dayText: { color: '#B4C5E2', fontSize: 8.5, fontWeight: '600' },
  dayTextSelected: { color: '#8FC0FF', fontWeight: '800' },
  dayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#284674' },
  dayDotActive: { backgroundColor: PulseColors.accent },
  workoutCard: { gap: 7, padding: 15, backgroundColor: 'rgba(25,60,115,0.54)', borderColor: 'rgba(58,119,202,0.58)', borderRadius: PulseRadii.large },
  workoutTitle: { color: '#fff', fontSize: 22, lineHeight: 26, fontWeight: '800', letterSpacing: -0.65 },
  workoutMeta: { color: PulseColors.mutedLight, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 5 },
  actionButton: { flex: 1, paddingHorizontal: 9 },
  emptyHint: { color: PulseColors.muted, fontSize: 10, marginTop: 2 },
  restBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  restBadgeText: { color: '#B8D4FF', fontSize: 20, fontWeight: '800' },
  lastSession: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  recentIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.14)' },
  recentCopy: { flex: 1, gap: 3 },
  lastTitle: { color: PulseColors.textStrong, fontSize: 12, fontWeight: '700' },
  lastEmpty: { color: PulseColors.mutedLight, fontSize: 10, lineHeight: 14 },
  loadingCard: { alignItems: 'center' },
  loadingText: { color: PulseColors.mutedLight, fontSize: 12 },
  emptyCard: { gap: 12 },
  emptyTitle: { color: '#fff', fontSize: 19, fontWeight: '800' },
  retry: { color: '#8FC0FF', fontWeight: '800' },
});
