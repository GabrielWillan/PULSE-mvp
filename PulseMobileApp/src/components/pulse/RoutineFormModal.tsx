import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PulseColors } from '@/constants/pulse-theme';
import { ActionButton, Eyebrow, Glyph, Notice, TextField } from '@/components/pulse/PulseUI';
import { ModalScroll, PulseModal } from '@/components/pulse/PulseModal';

export function RoutineFormModal({
  visible,
  mode,
  initialName,
  error,
  loading,
  onClose,
  onSave,
}: {
  visible: boolean;
  mode: 'create' | 'rename';
  initialName: string;
  error: string;
  loading: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(initialName);
  return (
    <PulseModal visible={visible} onClose={onClose}>
      <ModalScroll>
        <View style={styles.header}><View style={styles.copy}><Eyebrow>Routine</Eyebrow><Text style={styles.title}>{mode === 'create' ? 'Create routine' : 'Rename routine'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.close}><Glyph name="close" size={22} color={PulseColors.mutedLight} /></Pressable></View>
        <TextField label="ROUTINE NAME" value={name} onChangeText={setName} placeholder="e.g. Strength block" autoFocus />
        {error ? <Notice tone="error">{error}</Notice> : null}
        <View style={styles.actions}><ActionButton title="Cancel" variant="secondary" onPress={onClose} style={styles.action} /><ActionButton title={mode === 'create' ? 'Create routine' : 'Save name'} onPress={() => onSave(name.trim())} loading={loading} disabled={!name.trim()} style={styles.action} /></View>
      </ModalScroll>
    </PulseModal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  copy: { flex: 1, gap: 5 },
  title: { color: '#fff', fontSize: 23, fontWeight: '800', letterSpacing: -0.5 },
  close: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: 'rgba(148,163,184,0.08)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.22)' },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1 },
});
