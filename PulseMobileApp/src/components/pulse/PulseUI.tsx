import { ReactNode, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TextInputProps,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TextInputInstance } from 'react-native';

import { PulseColors, PulseRadii, PulseSpacing } from '@/constants/pulse-theme';
import { KeyboardFocusProvider, KeyboardFocusScrollView, useKeyboardFocus } from '@/components/pulse/KeyboardFocus';

const glyphs: Record<string, string> = {
  menu: '☰',
  add: '+',
  chevron: '›',
  close: '×',
  edit: '✎',
  delete: '⌫',
  moon: '☾',
  check: '✓',
  arrow: '→',
  play: '▶',
  grip: '⠿',
  activity: '∿',
  clock: '◷',
  search: '⌕',
  back: '‹',
};

export function Glyph({ name, size = 20, color = PulseColors.text }: { name: string; size?: number; color?: string }) {
  return <Text accessibilityElementsHidden style={{ color, fontSize: size, lineHeight: size + 2, fontWeight: '700' }}>{glyphs[name] ?? name}</Text>;
}

export function PulseMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.brandMark, compact && styles.brandMarkCompact]}>
      <View style={styles.pulseLine}>
        <View style={[styles.pulseBar, styles.pulseBarShort]} />
        <View style={[styles.pulseBar, styles.pulseBarTall]} />
        <View style={[styles.pulseBar, styles.pulseBarMid]} />
        <View style={[styles.pulseBar, styles.pulseBarShort]} />
      </View>
    </View>
  );
}

export function PulseHeader({
  right,
  subtitle,
}: {
  right?: ReactNode;
  subtitle?: string;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <PulseMark compact />
        <Text style={styles.brandText}>PULSE</Text>
      </View>
      {right ?? <Text style={styles.headerDate}>{subtitle}</Text>}
    </View>
  );
}

export function PageFrame({ children, contentStyle }: { children: ReactNode; contentStyle?: StyleProp<ViewStyle> }) {
  const { width } = useWindowDimensions();
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View pointerEvents="none" style={styles.glowOne} />
      <View pointerEvents="none" style={styles.glowTwo} />
      <KeyboardFocusProvider>
        <KeyboardFocusScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.pageContent, { paddingHorizontal: width < 390 ? 16 : 20 }, contentStyle]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          {children}
        </KeyboardFocusScrollView>
      </KeyboardFocusProvider>
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Eyebrow({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <Text style={[styles.eyebrow, style]}>{children}</Text>;
}

export function ActionButton({
  title,
  onPress,
  variant = 'primary',
  glyph,
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  glyph?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const variantStyle = variant === 'primary'
    ? styles.buttonPrimary
    : variant === 'danger'
      ? styles.buttonDanger
      : variant === 'quiet'
        ? styles.buttonQuiet
        : styles.buttonSecondary;
  const textStyle = variant === 'primary' ? styles.buttonTextPrimary : variant === 'danger' ? styles.buttonTextDanger : styles.buttonTextSecondary;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [styles.button, variantStyle, style, (disabled || loading) && styles.buttonDisabled, pressed && !disabled && styles.pressed]}>
      {loading ? <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : PulseColors.accentLight} /> : null}
      {!loading && glyph ? <Glyph name={glyph} size={17} color={variant === 'primary' ? '#fff' : variant === 'danger' ? PulseColors.danger : PulseColors.accentLight} /> : null}
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82} style={[textStyle, styles.buttonLabel]}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({
  glyph,
  label,
  onPress,
  accent = false,
}: {
  glyph: string;
  label: string;
  onPress: () => void;
  accent?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, accent && styles.iconButtonAccent, pressed && styles.pressed]}>
      <Glyph name={glyph} size={21} color={accent ? '#fff' : PulseColors.text} />
    </Pressable>
  );
}

export function TextField({
  label,
  inputStyle,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & { label: string; inputStyle?: StyleProp<TextStyle> }) {
  const inputRef = useRef<TextInputInstance | null>(null);
  const keyboardFocus = useKeyboardFocus();
  useEffect(() => keyboardFocus?.registerInput(inputRef.current), [keyboardFocus]);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        ref={inputRef}
        placeholderTextColor="#7087AD"
        selectionColor={PulseColors.accentLight}
        style={[styles.textInput, inputStyle]}
        onFocus={(event) => {
          keyboardFocus?.onInputFocus(inputRef.current, event.nativeEvent.target);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          keyboardFocus?.onInputBlur(event.nativeEvent.target);
          onBlur?.(event);
        }}
        {...props}
      />
    </View>
  );
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'error' | 'success' }) {
  return (
    <View style={[styles.notice, tone === 'error' && styles.noticeError, tone === 'success' && styles.noticeSuccess]}>
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PulseColors.background, overflow: 'hidden' },
  glowOne: { position: 'absolute', top: -260, left: -150, width: 520, height: 430, borderRadius: 260, backgroundColor: PulseColors.backgroundTop, opacity: 0.47 },
  glowTwo: { position: 'absolute', top: -190, right: -260, width: 500, height: 450, borderRadius: 250, backgroundColor: '#0A3671', opacity: 0.22 },
  scroll: { flex: 1 },
  pageContent: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: PulseSpacing.page, paddingTop: PulseSpacing.md, paddingBottom: 96, gap: PulseSpacing.lg },
  header: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: PulseColors.accent, shadowColor: PulseColors.accent, shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  brandMarkCompact: { width: 34, height: 34, borderRadius: 11 },
  pulseLine: { height: 18, flexDirection: 'row', alignItems: 'center', gap: 2 },
  pulseBar: { width: 2, borderRadius: 2, backgroundColor: '#fff' },
  pulseBarShort: { height: 6 },
  pulseBarTall: { height: 17 },
  pulseBarMid: { height: 11 },
  brandText: { color: PulseColors.textStrong, fontSize: 17, fontWeight: '800', letterSpacing: 0.4 },
  headerDate: { color: PulseColors.muted, fontSize: 12, fontWeight: '600' },
  card: { padding: 16, backgroundColor: 'rgba(14,29,59,0.94)', borderWidth: 1, borderColor: PulseColors.border, borderRadius: PulseRadii.card },
  eyebrow: { color: '#70AAFF', fontSize: 10, fontWeight: '800', letterSpacing: 1.55, textTransform: 'uppercase' },
  button: { minHeight: 46, borderWidth: 1, borderRadius: 13, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonPrimary: { backgroundColor: PulseColors.accent, borderColor: '#4B8EF5', shadowColor: PulseColors.accent, shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  buttonSecondary: { backgroundColor: 'rgba(14,29,59,0.68)', borderColor: '#315078' },
  buttonQuiet: { backgroundColor: 'transparent', borderColor: 'transparent' },
  buttonDanger: { backgroundColor: 'rgba(255,119,135,0.1)', borderColor: 'rgba(255,119,135,0.38)' },
  buttonTextPrimary: { color: '#fff', fontSize: 13, fontWeight: '700' },
  buttonTextSecondary: { color: '#B8D4FF', fontSize: 13, fontWeight: '700' },
  buttonTextDanger: { color: PulseColors.danger, fontSize: 13, fontWeight: '700' },
  buttonLabel: { flexShrink: 1, textAlign: 'center' },
  buttonDisabled: { opacity: 0.5 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
  iconButton: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: PulseColors.surface, borderWidth: 1, borderColor: PulseColors.border },
  iconButtonAccent: { backgroundColor: PulseColors.accent, borderColor: PulseColors.accentLight },
  fieldWrap: { gap: 7 },
  fieldLabel: { color: '#B9CCE7', fontSize: 11, fontWeight: '700', letterSpacing: 0.25 },
  textInput: { minHeight: 46, paddingHorizontal: 13, paddingVertical: 10, color: PulseColors.textStrong, backgroundColor: 'rgba(5,14,31,0.82)', borderWidth: 1, borderColor: PulseColors.borderStrong, borderRadius: 12, fontSize: 15 },
  notice: { padding: 12, backgroundColor: 'rgba(59,130,246,0.12)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.26)', borderRadius: 12 },
  noticeError: { backgroundColor: 'rgba(255,119,135,0.1)', borderColor: 'rgba(255,119,135,0.32)' },
  noticeSuccess: { backgroundColor: 'rgba(77,225,154,0.1)', borderColor: 'rgba(77,225,154,0.3)' },
  noticeText: { color: PulseColors.mutedLight, fontSize: 12, lineHeight: 17 },
});

export const pulseUIStyles = styles;
