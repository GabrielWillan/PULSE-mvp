import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  findNodeHandle,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RefObject } from 'react';
import type { ScrollViewInstance, TextInputInstance } from 'react-native';

type KeyboardFocusValue = {
  scrollRef: RefObject<ScrollViewInstance | null>;
  keyboardHeight: number;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onInputFocus: (input: TextInputInstance | null, target: number) => void;
  onInputBlur: (target: number) => void;
  registerInput: (input: TextInputInstance | null) => (() => void) | undefined;
};

const KeyboardFocusContext = createContext<KeyboardFocusValue | null>(null);

export function useKeyboardFocus() {
  return useContext(KeyboardFocusContext);
}

export function KeyboardFocusProvider({ children }: { children: ReactNode }) {
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  const focusedTarget = useRef<number | null>(null);
  const inputTargets = useRef(new Set<number>());
  const scrollOffset = useRef(0);
  const keyboardHeight = useRef(0);
  const [visibleKeyboardHeight, setVisibleKeyboardHeight] = useState(0);
  const scheduledScroll = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const showEvent = Keyboard.addListener('keyboardWillShow', (event) => {
      keyboardHeight.current = event.endCoordinates.height;
      setVisibleKeyboardHeight(event.endCoordinates.height);
    });
    const didShowEvent = Keyboard.addListener('keyboardDidShow', (event) => {
      keyboardHeight.current = event.endCoordinates.height;
      setVisibleKeyboardHeight(event.endCoordinates.height);
    });
    const hideEvent = Keyboard.addListener('keyboardWillHide', () => {
      keyboardHeight.current = 0;
      setVisibleKeyboardHeight(0);
    });
    const didHideEvent = Keyboard.addListener('keyboardDidHide', () => {
      keyboardHeight.current = 0;
      setVisibleKeyboardHeight(0);
    });
    return () => {
      showEvent.remove();
      didShowEvent.remove();
      hideEvent.remove();
      didHideEvent.remove();
      if (scheduledScroll.current) clearTimeout(scheduledScroll.current);
    };
  }, []);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffset.current = event.nativeEvent.contentOffset.y;
  }, []);

  const onInputFocus = useCallback((input: TextInputInstance | null, target: number) => {
    focusedTarget.current = target;
    if (scheduledScroll.current) clearTimeout(scheduledScroll.current);
    if (!input) return;

    scheduledScroll.current = setTimeout(() => {
      if (focusedTarget.current !== target || keyboardHeight.current <= 0) return;
      input.measureInWindow((_x, y, _width, inputHeight) => {
        const visibleBottom = height - keyboardHeight.current;
        const visibleCenter = (insets.top + visibleBottom) / 2;
        const inputCenter = y + inputHeight / 2;
        const nextOffset = Math.max(0, scrollOffset.current + inputCenter - visibleCenter);
        scrollRef.current?.scrollTo({ y: nextOffset, animated: true });
      });
    }, 320);
  }, [height, insets.top]);

  const onInputBlur = useCallback((target: number) => {
    if (focusedTarget.current === target) focusedTarget.current = null;
  }, []);

  const registerInput = useCallback((input: TextInputInstance | null) => {
    const target = findNodeHandle(input);
    if (target == null) return undefined;
    inputTargets.current.add(target);
    return () => { inputTargets.current.delete(target); };
  }, []);

  const onTouchStart = useCallback((event: GestureResponderEvent) => {
    const target = event.nativeEvent.target;
    const previousTarget = focusedTarget.current;
    if (keyboardHeight.current <= 0 || previousTarget == null || typeof target !== 'number' || inputTargets.current.has(target)) return;

    setTimeout(() => {
      if (focusedTarget.current === previousTarget || focusedTarget.current == null) Keyboard.dismiss();
    }, 0);
  }, []);

  const value = useMemo(() => ({ scrollRef, keyboardHeight: visibleKeyboardHeight, onScroll, onInputFocus, onInputBlur, registerInput }), [onScroll, onInputBlur, onInputFocus, registerInput, visibleKeyboardHeight]);

  return (
    <KeyboardFocusContext.Provider value={value}>
      <View style={{ flex: 1 }} onTouchStart={onTouchStart}>
        {children}
      </View>
    </KeyboardFocusContext.Provider>
  );
}

export function KeyboardFocusScrollView({ onScroll, contentContainerStyle, ...props }: ScrollViewProps) {
  const keyboardFocus = useKeyboardFocus();
  const { height } = useWindowDimensions();
  const baseContentStyle = StyleSheet.flatten(contentContainerStyle) ?? {};
  const focusPadding = keyboardFocus?.keyboardHeight
    ? Math.max(0, (height - keyboardFocus.keyboardHeight) / 2)
    : 0;
  const adjustedContentStyle = focusPadding > 0
    ? [{
        ...baseContentStyle,
        paddingTop: (typeof baseContentStyle.paddingTop === 'number' ? baseContentStyle.paddingTop : 0) + focusPadding,
        paddingBottom: (typeof baseContentStyle.paddingBottom === 'number' ? baseContentStyle.paddingBottom : 0) + focusPadding,
      }]
    : contentContainerStyle;

  return (
    <ScrollView
      {...props}
      contentContainerStyle={adjustedContentStyle}
      ref={keyboardFocus?.scrollRef}
      onScroll={(event) => {
        keyboardFocus?.onScroll(event);
        onScroll?.(event);
      }}
      scrollEventThrottle={16}
    />
  );
}
