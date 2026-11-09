import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet, Text } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>Routines</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ref: _slotRef, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, isFocused && styles.tabButtonSelected, pressed && styles.pressed]}>
      <View>
        <Text style={[styles.tabText, isFocused && styles.tabTextSelected]}>{children}</Text>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={styles.innerContainer}>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    bottom: 0,
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: 20,
    backgroundColor: '#0E1D3B',
    borderWidth: 1,
    borderColor: '#1A2F5A',
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButton: {
    minWidth: 92,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 13,
    alignItems: 'center',
  },
  tabButtonSelected: {
    backgroundColor: '#173869',
  },
  tabText: {
    color: '#9AB0D2',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextSelected: {
    color: '#F3F7FF',
    fontWeight: '700',
  },
});
