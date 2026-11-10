import { StyleSheet, Text, View } from 'react-native';

import { Card, Eyebrow, Glyph, PageFrame, PulseHeader } from '@/components/pulse/PulseUI';
import { PulseColors } from '@/constants/pulse-theme';

export function CaloriesScreen() {
  return (
    <PageFrame contentStyle={styles.page}>
      <PulseHeader subtitle="Your daily nutrition" />
      <View style={styles.heading}>
        <Eyebrow>Nutrition</Eyebrow>
        <Text style={styles.title}>Calorie tracker</Text>
        <Text style={styles.subtitle}>A simple view of your daily nutrition goals.</Text>
      </View>
      <Card style={styles.card}>
        <View style={styles.icon}><Glyph name="activity" size={23} color={PulseColors.accentLight} /></View>
        <Text style={styles.cardTitle}>Coming soon</Text>
        <Text style={styles.cardText}>Nutrition and daily calorie tracking will be added in a future update.</Text>
        <Text style={styles.badge}>IN DEVELOPMENT</Text>
      </Card>
    </PageFrame>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16, paddingTop: 8, paddingBottom: 112 },
  heading: { gap: 5, paddingTop: 6 },
  title: { color: PulseColors.textStrong, fontSize: 29, lineHeight: 35, fontWeight: '800', letterSpacing: -0.9 },
  subtitle: { color: PulseColors.mutedLight, fontSize: 12, lineHeight: 17 },
  card: { minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 25, backgroundColor: 'rgba(14,29,59,0.88)' },
  icon: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: PulseColors.accentSoft },
  cardTitle: { color: PulseColors.textStrong, fontSize: 19, fontWeight: '800' },
  cardText: { maxWidth: 270, color: PulseColors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  badge: { marginTop: 5, paddingHorizontal: 11, paddingVertical: 8, color: PulseColors.accentLight, fontSize: 8, fontWeight: '800', letterSpacing: 1, borderWidth: 1, borderColor: PulseColors.border, borderRadius: 10 },
});
