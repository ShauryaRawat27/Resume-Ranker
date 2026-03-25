import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const weeklyWins = [
  { label: 'Resume score', value: '86', tone: '#2f9e44' },
  { label: 'Matched skills', value: '14', tone: '#ff7a29' },
  { label: 'Missing skills', value: '3', tone: '#d9480f' },
];

const checklist = [
  'Add one measurable impact bullet to your latest role.',
  'Move React Native and TypeScript into the top skills block.',
  'Shorten the summary so recruiters see experience faster.',
];

export default function DashboardScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const palette = Colors[scheme];

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}>
      <View style={[styles.heroCard, { backgroundColor: isDark ? '#33241b' : '#fff1e5' }]}>
        <View style={styles.heroGlow} />
        <Text style={[styles.eyebrow, { color: isDark ? '#ffd7bd' : '#9a4d16' }]}>Resume Ranker</Text>
        <Text style={[styles.heroTitle, { color: palette.text }]}>Make your resume feel job-ready in minutes.</Text>
        <Text style={[styles.heroBody, { color: isDark ? '#e8d2c3' : '#6f5749' }]}>
          Upload once, compare against roles, and see exactly what to improve before you apply.
        </Text>

        <View style={styles.heroActions}>
          <View style={[styles.primaryAction, { backgroundColor: '#ff7a29' }]}>
            <MaterialIcons name="upload-file" size={18} color="#fffaf5" />
            <Text style={styles.primaryActionText}>Upload Resume</Text>
          </View>
          <View style={[styles.secondaryAction, { borderColor: isDark ? '#7c5a47' : '#e9c8b1' }]}>
            <MaterialIcons name="work-outline" size={18} color={palette.text} />
            <Text style={[styles.secondaryActionText, { color: palette.text }]}>Paste Job Description</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>This week</Text>
        <Text style={[styles.sectionMeta, { color: isDark ? '#c7b6aa' : '#8e6e5b' }]}>Updated 2 hours ago</Text>
      </View>

      <View style={styles.statsRow}>
        {weeklyWins.map((item) => (
          <View
            key={item.label}
            style={[
              styles.statCard,
              {
                backgroundColor: isDark ? '#2a201a' : '#fffdf9',
                borderColor: isDark ? '#45342a' : '#f1ddd0',
              },
            ]}>
            <Text style={[styles.statValue, { color: item.tone }]}>{item.value}</Text>
            <Text style={[styles.statLabel, { color: isDark ? '#d9c6b8' : '#7b6557' }]}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.featureCard, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
        <View style={styles.featureHeader}>
          <View>
            <Text style={[styles.cardTitle, { color: palette.text }]}>Target role</Text>
            <Text style={[styles.cardSubtitle, { color: isDark ? '#d3c0b3' : '#846b5d' }]}>
              Senior Frontend Developer at Orbit Labs
            </Text>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: isDark ? '#3d2a1f' : '#fff1e5' }]}>
            <Text style={styles.scoreBadgeText}>86%</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressValue, { width: '86%' }]} />
        </View>

        <View style={styles.signalRow}>
          <View style={styles.signalItem}>
            <MaterialIcons name="check-circle" size={18} color="#2f9e44" />
            <Text style={[styles.signalText, { color: palette.text }]}>Strong on React, UI systems, and APIs</Text>
          </View>
          <View style={styles.signalItem}>
            <MaterialIcons name="error-outline" size={18} color="#d9480f" />
            <Text style={[styles.signalText, { color: palette.text }]}>Needs stronger metrics and testing language</Text>
          </View>
        </View>
      </View>

      <View style={[styles.featureCard, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Quick improvements</Text>
          <MaterialIcons name="auto-awesome" size={18} color="#ff7a29" />
        </View>
        {checklist.map((item, index) => (
          <View key={item} style={[styles.checklistItem, index === checklist.length - 1 && styles.lastChecklistItem]}>
            <View style={[styles.checklistDot, { backgroundColor: '#ff7a29' }]} />
            <Text style={[styles.checklistText, { color: palette.text }]}>{item}</Text>
          </View>
        ))}
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
  heroCard: {
    overflow: 'hidden',
    borderRadius: 28,
    padding: 24,
    gap: 14,
  },
  heroGlow: {
    position: 'absolute',
    right: -20,
    top: -10,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 122, 41, 0.16)',
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontFamily: Fonts.serif,
    fontWeight: '700',
  },
  heroBody: {
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 320,
  },
  heroActions: {
    gap: 12,
    marginTop: 8,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    paddingVertical: 14,
  },
  primaryActionText: {
    color: '#fffaf5',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  sectionMeta: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  featureCard: {
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
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
  scoreBadgeText: {
    color: '#ff7a29',
    fontSize: 18,
    fontWeight: '900',
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 122, 41, 0.14)',
    overflow: 'hidden',
  },
  progressValue: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#ff7a29',
  },
  signalRow: {
    gap: 12,
  },
  signalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  signalText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(142, 110, 91, 0.35)',
  },
  lastChecklistItem: {
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  checklistDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 7,
  },
  checklistText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
});
