import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { createRoutine, deleteRoutine, renameRoutine, type Routine } from '@/api/pulse-api';
import { PulseColors, PulseSpacing } from '@/constants/pulse-theme';
import { ActionButton, Card, Eyebrow, Glyph, Notice, PageFrame, PulseHeader } from '@/components/pulse/PulseUI';
import { DeleteRoutineModal } from '@/components/pulse/DeleteRoutineModal';
import { RoutineFormModal } from '@/components/pulse/RoutineFormModal';
import { usePulseRoutines } from '@/components/pulse/PulseRoutinesContext';

type RoutineFormState = { mode: 'create' | 'rename'; routine: Routine | null } | null;

export function RoutinesScreen() {
  const { routines, loadingRoutines: loading, routinesError: error, refreshRoutines: loadRoutines } = usePulseRoutines();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [form, setForm] = useState<RoutineFormState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Routine | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [notice, setNotice] = useState('');

  async function saveRoutine(name: string) {
    if (!name) return;
    setSaving(true);
    setFormError('');
    try {
      if (form?.mode === 'rename' && form.routine) await renameRoutine(form.routine.id, name);
      else await createRoutine(name);
      await loadRoutines();
      setForm(null);
      setNotice(form?.mode === 'rename' ? 'Routine name updated.' : 'Routine created.');
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Could not save this routine');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    setDeleteError('');
    try {
      await deleteRoutine(deleteTarget.id);
      await loadRoutines();
      setNotice(`${deleteTarget.name} deleted.`);
      setDeleteTarget(null);
      setOpenMenuId(null);
    } catch (deleteFailure) {
      setDeleteError(deleteFailure instanceof Error ? deleteFailure.message : 'Could not delete this routine');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageFrame contentStyle={styles.page}>
      <PulseHeader subtitle="Your training library" />
      <View style={styles.heading}><Eyebrow>Training plans</Eyebrow><Text style={styles.title}>Your routines</Text><Text style={styles.subtitle}>Keep each week simple and ready to train.</Text></View>
      <ActionButton title="Create routine" glyph="add" onPress={() => { setFormError(''); setForm({ mode: 'create', routine: null }); }} style={styles.createButton} />
      {notice ? <Notice tone="success">{notice}</Notice> : null}
      {error ? <Notice tone="error">{error} <Text onPress={() => void loadRoutines()} style={styles.retry}>Try again</Text></Notice> : null}
      {loading ? <Card><Text style={styles.emptyText}>Loading routines…</Text></Card> : routines.length ? (
        <View style={styles.list}>
          {routines.map((routine) => {
            const open = openMenuId === routine.id;
            return (
              <View key={routine.id} style={[styles.routineCard, open && styles.routineCardOpen]}>
                <View style={styles.routineRow}>
                  <View style={styles.routineCopy}><Text style={styles.routineName}>{routine.name}</Text><Text style={styles.routineMeta}>7 training days</Text></View>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Options for ${routine.name}`} accessibilityState={{ expanded: open }} onPress={() => setOpenMenuId(open ? null : routine.id)} style={[styles.chevronButton, open && styles.chevronOpen]}><Glyph name="chevron" size={23} color={open ? '#C7E1FF' : PulseColors.muted} /></Pressable>
                </View>
                {open ? <View style={styles.actionsMenu}><Pressable accessibilityRole="button" onPress={() => { setFormError(''); setForm({ mode: 'rename', routine }); setOpenMenuId(null); }} style={styles.menuAction}><Glyph name="edit" size={17} color="#D5E2F7" /><Text style={styles.menuActionText}>Rename</Text></Pressable><View style={styles.menuDivider} /><Pressable accessibilityRole="button" onPress={() => { setDeleteError(''); setDeleteTarget(routine); }} style={styles.menuAction}><Glyph name="delete" size={17} color={PulseColors.danger} /><Text style={[styles.menuActionText, styles.deleteAction]}>Delete</Text></Pressable></View> : null}
              </View>
            );
          })}
        </View>
      ) : (
        <Card style={styles.empty}><View style={styles.emptyIcon}><Glyph name="activity" size={21} color={PulseColors.accentLight} /></View><Text style={styles.emptyTitle}>No routines yet</Text><Text style={styles.emptyText}>Create one and PULSE will add seven training days for you.</Text></Card>
      )}
      <RoutineFormModal key={form ? `${form.mode}-${form.routine?.id ?? 'new'}` : 'closed'} visible={Boolean(form)} mode={form?.mode ?? 'create'} initialName={form?.routine?.name ?? ''} error={formError} loading={saving} onClose={() => setForm(null)} onSave={saveRoutine} />
      <DeleteRoutineModal routine={deleteTarget} error={deleteError} loading={saving} onClose={() => setDeleteTarget(null)} onDelete={confirmDelete} />
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  page: { gap: PulseSpacing.lg, paddingTop: 8 },
  heading: { gap: 6, paddingTop: 10 },
  title: { color: '#fff', fontSize: 34, lineHeight: 38, fontWeight: '800', letterSpacing: -1.2 },
  subtitle: { color: PulseColors.mutedLight, fontSize: 13 },
  createButton: { alignSelf: 'flex-start', paddingHorizontal: 19, borderRadius: 999 },
  list: { gap: 9 },
  routineCard: { position: 'relative', paddingHorizontal: 13, backgroundColor: 'rgba(255,255,255,0.075)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 17 },
  routineCardOpen: { zIndex: 5, borderColor: 'rgba(96,165,250,0.36)', backgroundColor: 'rgba(255,255,255,0.095)' },
  routineRow: { minHeight: 69, flexDirection: 'row', alignItems: 'center', gap: 9 },
  routineCopy: { flex: 1, gap: 4 },
  routineName: { color: PulseColors.textStrong, fontSize: 15, fontWeight: '600' },
  routineMeta: { color: PulseColors.muted, fontSize: 10 },
  chevronButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.045)' },
  chevronOpen: { backgroundColor: 'rgba(0,113,227,0.2)', borderColor: 'rgba(91,162,255,0.35)', borderWidth: 1 },
  actionsMenu: { marginBottom: 9, paddingHorizontal: 8, backgroundColor: 'rgba(25,39,64,0.96)', borderWidth: 1, borderColor: 'rgba(152,175,214,0.24)', borderRadius: 14, overflow: 'hidden' },
  menuAction: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8 },
  menuActionText: { color: '#F1F5FF', fontSize: 13, fontWeight: '600' },
  deleteAction: { color: PulseColors.danger },
  menuDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.12)' },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 28 },
  emptyIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: PulseColors.accentSoft, borderRadius: 15 },
  emptyTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  emptyText: { color: PulseColors.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  retry: { color: '#8FC0FF', fontWeight: '800' },
});
