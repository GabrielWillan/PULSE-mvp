import { router } from 'expo-router';
import { Tabs, TabList, TabSlot, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomBarActionsProvider, useBottomBarActions } from '@/components/pulse/BottomBarActionsContext';
import { PulseColors } from '@/constants/pulse-theme';

type DockTabProps = TabTriggerSlotProps & {
  label: string;
  icon: {
    ios: 'house.fill' | 'square.stack.3d.up.fill' | 'flame.fill' | 'book.closed.fill';
    android: 'home' | 'view_list' | 'local_fire_department' | 'receipt_long';
    web: 'home' | 'view_list' | 'local_fire_department' | 'receipt_long';
  };
};

function DockTab({ label, icon, ...props }: DockTabProps) {
  const { isFocused, ref: _slotRef, ...pressableProps } = props;
  const color = isFocused ? PulseColors.accentLight : '#A1B4D2';

  return (
    <Pressable
      {...pressableProps}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [styles.tabButton, isFocused && styles.tabButtonSelected, pressed && styles.pressed]}>
      <SymbolView name={icon} size={19} tintColor={color} weight="semibold" style={styles.tabIcon} />
      <Text numberOfLines={2} style={[styles.tabLabel, isFocused && styles.tabLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

function AppTabsLayout() {
  const insets = useSafeAreaInsets();
  const { requestAddWorkout } = useBottomBarActions();

  function addWorkout() {
    requestAddWorkout();
    router.navigate('/');
  }

  return (
    <Tabs style={styles.root}>
      <TabSlot style={styles.slot} />

      {/* Declare the tab routes separately so the center action can sit between them. */}
      <TabList style={styles.hiddenRouteList}>
        <TabTrigger name="dashboard" href="/">Dashboard</TabTrigger>
        <TabTrigger name="routines" href="/explore">Routines</TabTrigger>
        <TabTrigger name="calories" href="/calories">Calorie tracker</TabTrigger>
        <TabTrigger name="training-log" href="/training-log">Training log</TabTrigger>
      </TabList>

      <View pointerEvents="box-none" style={[styles.dockHost, { bottom: Math.max(insets.bottom, 12) + 5 }]}>
        <View style={styles.dock}>
          <TabTrigger name="dashboard" asChild>
            <DockTab label="Dashboard" icon={{ ios: 'house.fill', android: 'home', web: 'home' }} />
          </TabTrigger>
          <TabTrigger name="routines" asChild>
            <DockTab label="Routines" icon={{ ios: 'square.stack.3d.up.fill', android: 'view_list', web: 'view_list' }} />
          </TabTrigger>

          <View style={styles.addSlot}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add a workout"
              onPress={addWorkout}
              style={({ pressed }) => [styles.addButton, pressed && styles.addPressed]}>
              <Text style={styles.addGlyph}>+</Text>
            </Pressable>
          </View>

          <TabTrigger name="calories" asChild>
            <DockTab label="Calorie tracker" icon={{ ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' }} />
          </TabTrigger>
          <TabTrigger name="training-log" asChild>
            <DockTab label="Training log" icon={{ ios: 'book.closed.fill', android: 'receipt_long', web: 'receipt_long' }} />
          </TabTrigger>
        </View>
      </View>
    </Tabs>
  );
}

export default function AppTabs() {
  return (
    <BottomBarActionsProvider>
      <AppTabsLayout />
    </BottomBarActionsProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PulseColors.background },
  slot: { flex: 1 },
  hiddenRouteList: { display: 'none' },
  dockHost: { position: 'absolute', left: 12, right: 12, alignItems: 'center' },
  dock: {
    width: '100%',
    maxWidth: 430,
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    paddingVertical: 6,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(124,166,229,0.28)',
    backgroundColor: 'rgba(13,31,62,0.94)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 13,
  },
  tabButton: { flex: 1, minWidth: 0, height: 61, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 18, paddingHorizontal: 1 },
  tabButtonSelected: { backgroundColor: 'rgba(59,130,246,0.13)' },
  tabIcon: { width: 20, height: 20 },
  tabLabel: { color: '#9AAECD', fontSize: 8.5, lineHeight: 10, fontWeight: '600', textAlign: 'center' },
  tabLabelSelected: { color: '#EAF3FF', fontWeight: '800' },
  addSlot: { width: 58, alignItems: 'center', justifyContent: 'center' },
  addButton: {
    width: 56,
    height: 56,
    marginTop: -22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    borderWidth: 4,
    borderColor: '#102544',
    backgroundColor: PulseColors.accent,
    shadowColor: PulseColors.accent,
    shadowOpacity: 0.32,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  addGlyph: { color: '#fff', fontSize: 33, lineHeight: 38, fontWeight: '400', marginTop: -2 },
  addPressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },
  pressed: { opacity: 0.78 },
});
