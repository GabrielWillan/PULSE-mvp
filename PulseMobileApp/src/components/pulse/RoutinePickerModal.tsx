import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Routine } from '@/api/pulse-api';
import { PulseColors } from '@/constants/pulse-theme';
import { ActionButton, Eyebrow, Glyph } from '@/components/pulse/PulseUI';
import { ModalScroll, PulseModal } from '@/components/pulse/PulseModal';

export function RoutinePickerModal({
  visible,
  routines,
  selectedId,
  onChoose,
  onClose,
}: {
  visible: boolean;
  routines: Routine[];
  selectedId: number | null;
  onChoose: (routine: Routine) => void;
  onClose: () => void;
}) {
  return (
    <PulseModal visible={visible} onClose={onClose}>
      <ModalScroll>
        <Eyebrow>Training plan</Eyebrow>
        <Text style={styles.title}>Choose a routine</Text>
        <Text style={styles.subtitle}>Your week follows the routine you select.</Text>
        <View style={styles.list}>
          {routines.map((routine) => (
            <Pressable key={routine.id} onPress={() => onChoose(routine)} style={[styles.row, selectedId === routine.id && styles.rowSelected]}>
              <View style={styles.rowCopy}><Text style={styles.name}>{routine.name}</Text><Text style={styles.detail}>7 training days</Text></View>
              {selectedId === routine.id ? <Glyph name="check" size={18} color={PulseColors.accentLight} /> : <Glyph name="chevron" size={23} color={PulseColors.muted} />}
            </Pressable>
          ))}
          {routines.length === 0 ? <Text style={styles.empty}>Create a routine from the Routines tab first.</Text> : null}
        </View>
        <ActionButton title="Done" onPress={onClose} variant="secondary" />
      </ModalScroll>
    </PulseModal>
  );
}

const styles = StyleSheet.create({
  title: { color: '#fff', fontSize: 23, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: PulseColors.mutedLight, fontSize: 12, marginTop: -7 },
  list: { gap: 7 },
  row: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  rowSelected: { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: 'rgba(96,165,250,0.5)' },
  rowCopy: { flex: 1, gap: 3 },
  name: { color: PulseColors.textStrong, fontSize: 13, fontWeight: '700' },
  detail: { color: PulseColors.muted, fontSize: 10 },
  empty: { paddingVertical: 18, color: PulseColors.muted, fontSize: 12, textAlign: 'center' },
});
