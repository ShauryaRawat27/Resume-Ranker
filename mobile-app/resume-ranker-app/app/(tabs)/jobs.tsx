import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const jobs = [
  {
    company: 'Orbit Labs',
    role: 'Senior Frontend Engineer',
    score: 86,
    tone: '#2f9e44',
    missing: ['Jest', 'A/B testing'],
    matched: ['React', 'TypeScript', 'Design systems'],
  },
  {
    company: 'Northstar AI',
    role: 'Product UI Engineer',
    score: 78,
    tone: '#f08c00',
    missing: ['GraphQL', 'Analytics ownership'],
    matched: ['React Native', 'Mobile UI', 'API integration'],
  },
  {
    company: 'Canvas Cloud',
    role: 'Frontend Developer',
    score: 72,
    tone: '#e8590c',
    missing: ['Cypress', 'Accessibility audits'],
    matched: ['JavaScript', 'Responsive UI', 'REST APIs'],
  },
];

export default function MatchesScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const palette = Colors[scheme];

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.text }]}>Top matches</Text>
        <Text style={[styles.helper, { color: isDark ? '#cfbcb0' : '#846b5d' }]}>
          Ranked by resume fit and keyword coverage
        </Text>
      </View>

      {jobs.map((job) => (
        <View key={`${job.company}-${job.role}`} style={[styles.jobCard, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
          <View style={styles.jobHeader}>
            <View style={styles.jobCopy}>
              <Text style={[styles.company, { color: isDark ? '#e8d5c8' : '#9a4d16' }]}>{job.company}</Text>
              <Text style={[styles.role, { color: palette.text }]}>{job.role}</Text>
            </View>
            <View style={[styles.scorePill, { backgroundColor: `${job.tone}20` }]}>
              <Text style={[styles.scoreText, { color: job.tone }]}>{job.score}%</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressValue, { width: `${job.score}%`, backgroundColor: job.tone }]} />
          </View>

          <View style={styles.group}>
            <View style={styles.groupHeader}>
              <MaterialIcons name="check-circle" size={18} color="#2f9e44" />
              <Text style={[styles.groupTitle, { color: palette.text }]}>Strong matches</Text>
            </View>
            <View style={styles.tagWrap}>
              {job.matched.map((item) => (
                <View key={item} style={[styles.tag, { backgroundColor: isDark ? '#2f362b' : '#edf9ee' }]}>
                  <Text style={[styles.tagText, { color: palette.text }]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.group}>
            <View style={styles.groupHeader}>
              <MaterialIcons name="warning-amber" size={18} color="#d9480f" />
              <Text style={[styles.groupTitle, { color: palette.text }]}>Gaps to improve</Text>
            </View>
            <View style={styles.tagWrap}>
              {job.missing.map((item) => (
                <View key={item} style={[styles.tag, { backgroundColor: isDark ? '#3d2921' : '#fff1e5' }]}>
                  <Text style={[styles.tagText, { color: palette.text }]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ))}
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
  header: {
    gap: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
  },
  helper: {
    fontSize: 15,
    lineHeight: 22,
  },
  jobCard: {
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  jobCopy: {
    flex: 1,
    gap: 4,
  },
  company: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  role: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  scorePill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '900',
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
    overflow: 'hidden',
  },
  progressValue: {
    height: '100%',
    borderRadius: 999,
  },
  group: {
    gap: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
