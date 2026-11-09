import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PulseColors } from '@/constants/pulse-theme';
import { ActionButton, Eyebrow } from '@/components/pulse/PulseUI';
import { PulseModal } from '@/components/pulse/PulseModal';

export function SkipWarningModal({
  visible,
  dontAskAgain,
  onDontAskAgain,
  onLogAndSkip,
  onSkipWithoutLog,
  onContinue,
}: {
  visible: boolean;
  dontAskAgain: boolean;
  onDontAskAgain: (value: boolean) => void;
  onLogAndSkip: () => void;
  onSkipWithoutLog: () => void;
  onContinue: () => void;
}) {
  return (
    <PulseModal visible={visible} onClose={onContinue}>
      <View style={styles.content}>
        <Eyebrow>Set not logged</Eyebrow>
        <Text style={styles.title}>Skip this rest?</Text>
        <Text style={styles.body}>You haven’t saved this set yet. Keep your workout history accurate by logging it before you move on.</Text>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: dontAskAgain }} onPress={() => onDontAskAgain(!dontAskAgain)} style={styles.checkboxRow}>
          <View style={[styles.checkbox, dontAskAgain && styles.checkboxChecked]}><Text style={styles.check}>{dontAskAgain ? '✓' : ''}</Text></View>
          <Text style={styles.checkboxText}>Don’t ask me again</Text>
        </Pressable>
        <ActionButton title="Log set & skip rest" glyph="check" onPress={onLogAndSkip} />
        <ActionButton title="Skip without logging" variant="danger" onPress={onSkipWithoutLog} />
        <ActionButton title="Continue resting" variant="quiet" onPress={onContinue} />
      </View>
    </PulseModal>
  );
}

export function EndSessionModal({
  visible,
  loading,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <PulseModal visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <Eyebrow>Workout in progress</Eyebrow>
        <Text style={styles.title}>End this session?</Text>
        <Text style={styles.body}>Your saved sets will stay in your session history.</Text>
        <View style={styles.actions}><ActionButton title="Keep training" variant="secondary" onPress={onClose} style={styles.action} /><ActionButton title="End session" variant="danger" onPress={onConfirm} loading={loading} style={styles.action} /></View>
      </View>
    </PulseModal>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, padding: 22 },
  title: { color: '#fff', fontSize: 23, fontWeight: '800', letterSpacing: -0.5 },
  body: { color: PulseColors.mutedLight, fontSize: 13, lineHeight: 19 },
  checkboxRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 9 },
  checkbox: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#55739D', borderRadius: 6 },
  checkboxChecked: { backgroundColor: PulseColors.accent, borderColor: PulseColors.accent },
  check: { color: '#fff', fontSize: 13, fontWeight: '900' },
  checkboxText: { color: PulseColors.mutedLight, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1 },
});
