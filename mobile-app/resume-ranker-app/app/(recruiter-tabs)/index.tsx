import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const stages = [
  { label: 'Applied', value: 124, tone: '#868e96' },
  { label: 'Reviewed', value: 38, tone: '#f08c00' },
  { label: 'Shortlisted', value: 12, tone: '#2f9e44' },
];

export default function RecruiterPipelineScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const palette = Colors[scheme];

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: isDark ? '#31231b' : '#fff1e5' }]}>
        <Text style={[styles.kicker, { color: isDark ? '#ffd5bb' : '#a0541c' }]}>Recruiter workspace</Text>
        <Text style={[styles.title, { color: palette.text }]}>Keep hiring organized across every opening.</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#dcc7ba' : '#765c4d' }]}>
          Review match quality, see candidate movement, and decide where to spend screening time first.
        </Text>
      </View>

      <View style={styles.stageRow}>
        {stages.map((stage) => (
          <View
            key={stage.label}
            style={[
              styles.stageCard,
              {
                backgroundColor: isDark ? '#261d17' : '#fffdf9',
                borderColor: isDark ? '#433228' : '#f0ddd0',
              },
            ]}>
            <Text style={[styles.stageValue, { color: stage.tone }]}>{stage.value}</Text>
            <Text style={[styles.stageLabel, { color: palette.text }]}>{stage.label}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.cardTitle, { color: palette.text }]}>Hiring priority</Text>
            <Text style={[styles.cardSubtitle, { color: isDark ? '#d2bfb2' : '#846b5d' }]}>
              Senior Frontend Engineer, Orbit Labs
            </Text>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: isDark ? '#3d2a1f' : '#fff2e7' }]}>
            <Text style={styles.scoreText}>12 strong fits</Text>
          </View>
        </View>

        <View style={styles.insightRow}>
          <MaterialIcons name="insights" size={18} color="#ff7a29" />
          <Text style={[styles.insightText, { color: palette.text }]}>
            Most drop-offs are happening on automated testing and metrics-based experience.
          </Text>
        </View>
        <View style={styles.insightRow}>
          <MaterialIcons name="schedule" size={18} color="#2f9e44" />
          <Text style={[styles.insightText, { color: palette.text }]}>
            Reviewing the top 20 applicants first should cover nearly all profiles above 80% fit.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 120,
    gap: 18,
  },
  hero: {
    borderRadius: 28,
    padding: 24,
    gap: 10,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontFamily: Fonts.serif,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
  },
  stageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stageCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  stageValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  stageLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  cardHeader: {
    gap: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
  },
  scoreBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  scoreText: {
    color: '#ff7a29',
    fontSize: 14,
    fontWeight: '800',
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  insightText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
});
