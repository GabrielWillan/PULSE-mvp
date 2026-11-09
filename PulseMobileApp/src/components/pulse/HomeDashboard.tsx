import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Routine, RoutineDay } from '@/api/pulse-api';
import { PulseColors, PulseRadii, PulseSpacing } from '@/constants/pulse-theme';
import { ActionButton, Card, Eyebrow, Glyph, IconButton, Notice, PageFrame, PulseHeader } from '@/components/pulse/PulseUI';

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
  onAddWorkout,
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
  onAddWorkout: () => void;
  onEditWorkout: () => void;
  onStartSession: () => void;
  onRetry: () => void;
}) {
  const selectedDay = days.find((day) => day.id === selectedDayId) ?? days[0] ?? null;
  const today = new Date();
  const dateLabel = today.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const exerciseCount = selectedDay?.exercises?.length ?? 0;

  return (
    <PageFrame contentStyle={styles.page}>
      <PulseHeader
        subtitle={dateLabel}
        right={<View style={styles.headerRight}><Text numberOfLines={1} style={styles.date}>{dateLabel}</Text><IconButton glyph="add" label="Add a workout" accent onPress={onAddWorkout} /></View>}
      />
      <View style={styles.hero}>
        <Eyebrow>Your training calendar</Eyebrow>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.subtitle}>A quick look at your week and what’s next.</Text>
      </View>

      <Card style={styles.weekCard}>
        <View style={styles.weekHeader}><Text style={styles.weekTitle}>Week {getWeekNumber(today)}</Text><Text style={styles.weekCaption}>{days.length || 7} training days</Text></View>
        {routine ? <Pressable accessibilityRole="button" onPress={onOpenRoutinePicker} style={styles.routineChip}><Text style={styles.routineChipLabel}>ROUTINE</Text><Text numberOfLines={1} style={styles.routineChipName}>{routine.name}</Text><Glyph name="chevron" size={18} color={PulseColors.muted} /></Pressable> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
          {days.map((day) => {
            const selected = day.id === selectedDay?.id;
            const selectedRest = restDays[day.id] ?? Boolean(day.is_rest_day);
            return <Pressable key={day.id} onPress={() => onSelectDay(day)} accessibilityRole="button" accessibilityState={{ selected }} style={[styles.dayItem, selected && styles.dayItemSelected]}><Text style={[styles.dayText, selected && styles.dayTextSelected]}>{day.day_name.replace('Day', 'Day ')}</Text><View style={[styles.dayDot, Boolean(selectedRest || day.exercises?.length) && styles.dayDotActive]} /></Pressable>;
          })}
        </ScrollView>
      </Card>

      {error ? <Notice tone="error">{error} <Text onPress={onRetry} style={styles.retry}>Try again</Text></Notice> : null}
      {loading ? <Card style={styles.loadingCard}><Text style={styles.loadingText}>Loading your routine…</Text></Card> : null}
      {!loading && !routine ? <Card style={styles.emptyCard}><Eyebrow>Get started</Eyebrow><Text style={styles.emptyTitle}>Create your first routine</Text><Text style={styles.subtitle}>Your seven training days will appear here.</Text><ActionButton title="Open routines" glyph="arrow" onPress={onOpenRoutines} /></Card> : null}
      {!loading && routine && selectedDay ? (
        <>
          <Card style={styles.workoutCard}>
            <Eyebrow>Selected · {selectedDay.day_name}</Eyebrow>
            {restDay ? <View style={styles.restBadge}><Glyph name="moon" size={15} color={PulseColors.accentLight} /><Text style={styles.restBadgeText}>Rest day</Text></View> : <Text style={styles.workoutTitle}>{selectedDay.workout_title || 'Workout not named yet'}</Text>}
            <Text style={styles.workoutMeta}>{restDay ? 'Recovery is part of the plan.' : `${exerciseCount} ${exerciseCount === 1 ? 'exercise' : 'exercises'} assigned`}</Text>
            <View style={styles.actions}>
              <ActionButton title="Edit workout" variant="secondary" onPress={onEditWorkout} style={styles.actionButton} />
              <ActionButton title="Start session" glyph="activity" onPress={onStartSession} disabled={restDay || exerciseCount === 0} style={styles.actionButton} />
            </View>
            {!restDay && exerciseCount === 0 ? <Text style={styles.emptyHint}>Add exercises to this day before starting.</Text> : null}
          </Card>
          <Card style={styles.lastSession}>
            <View style={styles.weekHeader}><Text style={styles.lastTitle}>Last session</Text><Text style={styles.weekCaption}>Session history</Text></View>
            <Text style={styles.lastEmpty}>Your completed workouts will appear here.</Text>
          </Card>
        </>
      ) : null}
      {!loading && routines.length === 0 && !error ? <Notice>Create a routine from the Routines tab to get started.</Notice> : null}
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  page: { gap: PulseSpacing.lg, paddingTop: 8 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  date: { color: PulseColors.muted, fontSize: 11, fontWeight: '600', maxWidth: 150 },
  hero: { alignItems: 'center', gap: 5, paddingVertical: 7 },
  greeting: { color: '#fff', fontSize: 32, lineHeight: 37, fontWeight: '800', letterSpacing: -1.2 },
  subtitle: { color: PulseColors.mutedLight, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  weekCard: { gap: 12, padding: 14, backgroundColor: 'rgba(14,29,59,0.92)', borderRadius: PulseRadii.large },
  weekHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  weekTitle: { color: PulseColors.textStrong, fontSize: 15, fontWeight: '800' },
  weekCaption: { color: PulseColors.muted, fontSize: 10 },
  routineChip: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, backgroundColor: 'rgba(5,14,31,0.7)', borderWidth: 1, borderColor: PulseColors.border, borderRadius: 11 },
  routineChipLabel: { color: PulseColors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  routineChipName: { flex: 1, color: '#B8D4FF', fontSize: 11, fontWeight: '700' },
  dayStrip: { gap: 5 },
  dayItem: { width: 67, minHeight: 59, alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12 },
  dayItemSelected: { backgroundColor: '#1A3E78' },
  dayText: { color: '#B4C5E2', fontSize: 10, fontWeight: '600' },
  dayTextSelected: { color: '#8FC0FF', fontWeight: '800' },
  dayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#284674' },
  dayDotActive: { backgroundColor: PulseColors.accent },
  workoutCard: { gap: 8, padding: 17, backgroundColor: 'rgba(28,69,131,0.65)', borderColor: '#2860A8', borderRadius: PulseRadii.large },
  workoutTitle: { color: '#fff', fontSize: 23, lineHeight: 27, fontWeight: '800', letterSpacing: -0.75 },
  workoutMeta: { color: PulseColors.mutedLight, fontSize: 13 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionButton: { flex: 1, paddingHorizontal: 9 },
  emptyHint: { color: PulseColors.muted, fontSize: 10, marginTop: 3 },
  restBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  restBadgeText: { color: '#B8D4FF', fontSize: 22, fontWeight: '800' },
  lastSession: { minHeight: 104, gap: 11 },
  lastTitle: { color: PulseColors.textStrong, fontSize: 14, fontWeight: '700' },
  lastEmpty: { color: PulseColors.mutedLight, fontSize: 12 },
  loadingCard: { alignItems: 'center' },
  loadingText: { color: PulseColors.mutedLight, fontSize: 12 },
  emptyCard: { gap: 12 },
  emptyTitle: { color: '#fff', fontSize: 19, fontWeight: '800' },
  retry: { color: '#8FC0FF', fontWeight: '800' },
});
