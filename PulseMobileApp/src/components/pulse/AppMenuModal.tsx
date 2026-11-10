import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Routine } from '@/api/pulse-api';
import { PulseColors } from '@/constants/pulse-theme';
import { Glyph, IconButton, PulseMark } from '@/components/pulse/PulseUI';
import { TrainingLogView } from '@/components/pulse/TrainingLogView';

type MenuScreen = 'menu' | 'logs';

export function AppMenuModal({
  visible,
  routines,
  onClose,
  onNavigateHome,
  onNavigateRoutines,
}: {
  visible: boolean;
  routines: Routine[];
  onClose: () => void;
  onNavigateHome: () => void;
  onNavigateRoutines: () => void;
}) {
  const [screen, setScreen] = useState<MenuScreen>('menu');
  const closeMenu = () => {
    setScreen('menu');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={screen === 'logs' ? () => setScreen('menu') : closeMenu}>
      <View style={[styles.overlay, screen === 'logs' && styles.logsOverlay]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={closeMenu} style={styles.backdrop} />
        <SafeAreaView style={[styles.safe, screen === 'logs' && styles.safeLogs]} edges={['top', 'bottom', 'left', 'right']}>
          {screen === 'logs' ? (
            <TrainingLogView routines={routines} onBack={() => setScreen('menu')} />
          ) : (
            <View style={styles.panel}>
              <View style={styles.topRow}>
                <View style={styles.brandRow}><PulseMark compact /><Text style={styles.brandName}>PULSE</Text></View>
                <IconButton glyph="close" label="Close menu" onPress={closeMenu} />
              </View>
              <View style={styles.heading}>
                <Text style={styles.eyebrow}>YOUR TRAINING SPACE</Text>
                <Text style={styles.title}>Where to?</Text>
                <Text style={styles.subtitle}>Pick up where you left off.</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => setScreen('logs')} style={({ pressed }) => [styles.logLink, pressed && styles.pressed]}>
                <View style={styles.logIcon}><Glyph name="activity" size={20} color="#fff" /></View>
                <View style={styles.linkCopy}><Text style={styles.logTitle}>Training log</Text><Text style={styles.logSubtitle}>Review the sets you’ve saved</Text></View>
                <Glyph name="chevron" size={24} color="#B7D5FF" />
              </Pressable>
              <View style={styles.divider} />
              <View style={styles.quickLinks}>
                <Pressable accessibilityRole="button" onPress={() => { onClose(); onNavigateHome(); }} style={({ pressed }) => [styles.quickLink, pressed && styles.pressed]}>
                  <Glyph name="arrow" size={17} color={PulseColors.accentLight} /><Text style={styles.quickText}>Home</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => { onClose(); onNavigateRoutines(); }} style={({ pressed }) => [styles.quickLink, pressed && styles.pressed]}>
                  <Glyph name="activity" size={17} color={PulseColors.accentLight} /><Text style={styles.quickText}>Routines</Text>
                </Pressable>
              </View>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(2,8,20,0.76)' },
  logsOverlay: { backgroundColor: PulseColors.background },
  backdrop: { ...StyleSheet.absoluteFill },
  safe: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  safeLogs: { flex: 1, alignItems: 'stretch', justifyContent: 'flex-start' },
  panel: { width: '100%', maxWidth: 500, padding: 22, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(118,164,230,0.28)', backgroundColor: 'rgba(12,26,51,0.98)', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 28, shadowOffset: { width: 0, height: 14 }, elevation: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandName: { color: '#F2F6FF', fontSize: 15, fontWeight: '800', letterSpacing: 0.4 },
  heading: { gap: 5, marginTop: 25, marginBottom: 20 },
  eyebrow: { color: PulseColors.accentLight, fontSize: 9, fontWeight: '800', letterSpacing: 1.6 },
  title: { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { color: PulseColors.muted, fontSize: 12 },
  logLink: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 13, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(93,157,255,0.36)', backgroundColor: 'rgba(36,83,157,0.37)' },
  logIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: PulseColors.accent },
  linkCopy: { flex: 1, gap: 4 },
  logTitle: { color: '#F5F8FF', fontSize: 14, fontWeight: '800' },
  logSubtitle: { color: '#A8C1E5', fontSize: 10 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 17, backgroundColor: 'rgba(165,190,226,0.16)' },
  quickLinks: { flexDirection: 'row', gap: 10 },
  quickLink: { minHeight: 46, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(165,190,226,0.12)' },
  quickText: { color: '#C7D7EF', fontSize: 12, fontWeight: '700' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});
