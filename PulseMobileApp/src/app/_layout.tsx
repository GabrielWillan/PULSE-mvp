import { DarkTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import AppTabs from '@/components/app-tabs';
import { PulseRoutinesProvider } from '@/components/pulse/PulseRoutinesContext';
import { Colors } from '@/constants/theme';

const pulseNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.backgroundSelected,
    background: Colors.dark.background,
    card: Colors.dark.backgroundElement,
    text: Colors.dark.text,
    border: '#1A2F5A',
    notification: '#3B82F6',
  },
};

export default function TabLayout() {
  return (
    <ThemeProvider value={pulseNavigationTheme}>
      <PulseRoutinesProvider>
        <StatusBar style="light" />
        <AppTabs />
      </PulseRoutinesProvider>
    </ThemeProvider>
  );
}
