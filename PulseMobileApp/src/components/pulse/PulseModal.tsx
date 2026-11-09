import { ReactNode, useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import { KeyboardFocusProvider, KeyboardFocusScrollView } from '@/components/pulse/KeyboardFocus';

export function PulseModal({
  visible,
  onClose,
  onDismiss,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  children: ReactNode;
}) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const maxDialogHeight = Math.max(280, height - insets.top - insets.bottom - 28);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (!visible) return undefined;
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} onDismiss={onDismiss} statusBarTranslucent>
      <View style={[styles.backdrop, { paddingHorizontal: width < 400 ? 12 : 18, paddingVertical: 12, backgroundColor: keyboardVisible ? 'rgba(3,8,19,0.42)' : 'rgba(3,8,19,0.72)' }]}>
        {keyboardVisible ? <BlurView pointerEvents="none" intensity={42} tint="dark" style={StyleSheet.absoluteFill} /> : null}
        <Pressable accessibilityLabel={keyboardVisible ? 'Dismiss keyboard' : 'Close dialog'} style={StyleSheet.absoluteFill} onPress={() => { if (keyboardVisible) Keyboard.dismiss(); else onClose(); }} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.keyboardWrap, { maxHeight: maxDialogHeight }]}>
          <View style={styles.dialog}>{children}</View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function ModalScroll({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  return (
    <KeyboardFocusProvider>
      <KeyboardFocusScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { padding: width < 400 ? 16 : 20, gap: width < 400 ? 12 : 15 }]}>
        {children}
      </KeyboardFocusScrollView>
    </KeyboardFocusProvider>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 18, backgroundColor: 'rgba(3,8,19,0.72)' },
  keyboardWrap: { width: '100%', maxWidth: 560, alignSelf: 'center', flexShrink: 1 },
  dialog: { maxHeight: '100%', flexShrink: 1, overflow: 'hidden', backgroundColor: '#0B1930', borderColor: '#315078', borderWidth: 1, borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 28, shadowOffset: { width: 0, height: 16 }, elevation: 15 },
  scroll: { flexShrink: 1 },
  scrollContent: { flexGrow: 1 },
});
