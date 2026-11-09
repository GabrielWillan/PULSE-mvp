import { StyleSheet, Text, View } from 'react-native';

import type { Routine } from '@/api/pulse-api';
import { PulseColors } from '@/constants/pulse-theme';
import { ActionButton, Eyebrow, Notice } from '@/components/pulse/PulseUI';
import { PulseModal } from '@/components/pulse/PulseModal';

export function DeleteRoutineModal({
  routine,
  error,
  loading,
  onClose,
  onDelete,
}: {
  routine: Routine | null;
  error: string;
  loading: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <PulseModal visible={Boolean(routine)} onClose={onClose}>
      <View style={styles.content}>
        <Eyebrow>Delete routine</Eyebrow>
        <Text style={styles.title}>Delete {routine?.name}?</Text>
        <Text style={styles.body}>This removes this routine and its scheduled workout days.</Text>
        {error ? <Notice tone="error">{error}</Notice> : null}
        <View style={styles.actions}><ActionButton title="Cancel" variant="secondary" onPress={onClose} style={styles.action} /><ActionButton title="Delete" variant="danger" onPress={onDelete} loading={loading} style={styles.action} /></View>
      </View>
    </PulseModal>
  );
}

const styles = StyleSheet.create({
  content: { padding: 21, gap: 12 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  body: { color: PulseColors.mutedLight, fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1 },
});
