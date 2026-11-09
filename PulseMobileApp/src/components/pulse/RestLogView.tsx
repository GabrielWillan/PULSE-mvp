import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputInstance } from 'react-native';

import type { WorkoutExercise } from '@/api/pulse-api';
import { PulseColors } from '@/constants/pulse-theme';
import { ActionButton } from '@/components/pulse/PulseUI';
import { useKeyboardFocus } from '@/components/pulse/KeyboardFocus';

function formatTime(seconds: number) {
  const minutes = Math.floor(Math.max(0, seconds) / 60);
  const remainder = Math.max(0, seconds) % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export function RestLogView({
  exercise,
  setNumber,
  restDuration,
  restRemaining,
  reps,
  weight,
  saved,
  editing,
  saving,
  error,
  success,
  onRepsChange,
  onWeightChange,
  onSave,
  onEdit,
  onSkip,
  onAdjustTime,
}: {
  exercise: WorkoutExercise;
  setNumber: number;
  restDuration: number;
  restRemaining: number;
  reps: string;
  weight: string;
  saved: boolean;
  editing: boolean;
  saving: boolean;
  error: string;
  success: string;
  onRepsChange: (value: string) => void;
  onWeightChange: (value: string) => void;
  onSave: () => void;
  onEdit: () => void;
  onSkip: () => void;
  onAdjustTime: (delta: number) => void;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.restLabel}>REST · {exercise.name.toUpperCase()}</Text>
      <View style={styles.timerWrap}>
        <View style={styles.timerRing}><View style={styles.timerInner}><Text style={styles.time}>{formatTime(restRemaining)}</Text><Text style={styles.timeOf}>of {formatTime(restDuration)}</Text></View></View>
        <View style={styles.timeActions}><Pressable onPress={() => onAdjustTime(-15)} style={styles.timeAdjust}><Text style={styles.adjustText}>−15s</Text></Pressable><Pressable onPress={() => onAdjustTime(15)} style={styles.timeAdjust}><Text style={styles.adjustText}>+15s</Text></Pressable></View>
      </View>
      <View style={styles.fields}>
        <LogField label="SET" value={`${setNumber} / ${exercise.sets}`} editable={false} />
        <LogField label="REPS DONE" value={reps} onChangeText={onRepsChange} keyboardType="number-pad" editable={!saved || editing} />
        <LogField label="WEIGHT" value={weight} onChangeText={onWeightChange} keyboardType="decimal-pad" editable={!saved || editing} suffix="kg" />
      </View>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}
      <View style={styles.actions}>
        <ActionButton title="Skip rest" variant="secondary" onPress={onSkip} style={styles.action} />
        {saved && !editing ? <ActionButton title="Edit set" glyph="edit" onPress={onEdit} style={styles.action} /> : <ActionButton title={saving ? 'Saving…' : 'Save log'} glyph="check" onPress={onSave} loading={saving} style={styles.action} />}
      </View>
      <Text style={styles.next}>Next: Set {setNumber + 1} · {exercise.reps} reps target</Text>
    </View>
  );
}

function LogField({
  label,
  value,
  editable,
  onChangeText,
  keyboardType,
  suffix,
}: {
  label: string;
  value: string;
  editable: boolean;
  onChangeText?: (value: string) => void;
  keyboardType?: 'number-pad' | 'decimal-pad';
  suffix?: string;
}) {
  const inputRef = useRef<TextInputInstance | null>(null);
  const keyboardFocus = useKeyboardFocus();
  useEffect(() => keyboardFocus?.registerInput(inputRef.current), [keyboardFocus]);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          ref={inputRef}
          value={value}
          editable={editable}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          selectTextOnFocus
          style={styles.input}
          onFocus={(event) => keyboardFocus?.onInputFocus(inputRef.current, event.nativeEvent.target)}
          onBlur={(event) => keyboardFocus?.onInputBlur(event.nativeEvent.target)}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  restLabel: { color: '#70AAFF', textAlign: 'center', fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  timerWrap: { alignItems: 'center', gap: 8 },
  timerRing: { width: 178, height: 178, alignItems: 'center', justifyContent: 'center', borderRadius: 89, borderWidth: 8, borderColor: PulseColors.accent, backgroundColor: '#0B1930', shadowColor: PulseColors.accent, shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  timerInner: { alignItems: 'center', justifyContent: 'center', width: 148, height: 148, borderRadius: 74, backgroundColor: '#08152C' },
  time: { color: '#fff', fontSize: 38, fontWeight: '800', letterSpacing: -1.5 },
  timeOf: { color: PulseColors.mutedLight, fontSize: 10 },
  timeActions: { flexDirection: 'row', gap: 8 },
  timeAdjust: { minHeight: 30, justifyContent: 'center', paddingHorizontal: 11, borderRadius: 999, backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.22)' },
  adjustText: { color: '#A9CAFF', fontSize: 10, fontWeight: '700' },
  fields: { flexDirection: 'row', gap: 7 },
  field: { flex: 1, minWidth: 0, gap: 6 },
  fieldLabel: { color: PulseColors.mutedLight, fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  inputWrap: { minHeight: 47, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, backgroundColor: '#08152C', borderWidth: 1, borderColor: '#315078', borderRadius: 12 },
  input: { flex: 1, minWidth: 0, paddingVertical: 8, color: '#fff', fontSize: 15, fontWeight: '800' },
  suffix: { color: PulseColors.muted, fontSize: 9, fontWeight: '700' },
  error: { color: PulseColors.danger, fontSize: 11 },
  success: { color: PulseColors.success, fontSize: 11 },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1 },
  next: { color: PulseColors.muted, textAlign: 'center', fontSize: 10 },
});
