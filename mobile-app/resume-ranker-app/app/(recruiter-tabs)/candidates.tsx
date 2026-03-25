import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const candidates = [
  { name: 'Maya Patel', score: 92, status: 'Ready for interview', accent: '#2f9e44' },
  { name: 'Arjun Menon', score: 87, status: 'Needs recruiter screen', accent: '#f08c00' },
  { name: 'Sara Kim', score: 81, status: 'Strong portfolio, review tests', accent: '#ff7a29' },
];

export default function RecruiterCandidatesScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const palette = Colors[scheme];

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: palette.text }]}>Applicants</Text>
      <Text style={[styles.subtitle, { color: isDark ? '#d2bfb2' : '#846b5d' }]}>
        Highest-ranking candidates for your active frontend opening.
      </Text>

      {candidates.map((candidate) => (
        <View key={candidate.name} style={[styles.card, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
          <View style={styles.row}>
            <View style={styles.copy}>
              <Text style={[styles.name, { color: palette.text }]}>{candidate.name}</Text>
              <Text style={[styles.status, { color: isDark ? '#d2bfb2' : '#846b5d' }]}>{candidate.status}</Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: `${candidate.accent}20` }]}>
              <Text style={[styles.scoreText, { color: candidate.accent }]}>{candidate.score}%</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MaterialIcons name="description" size={18} color="#ff7a29" />
              <Text style={[styles.metaText, { color: palette.text }]}>Resume aligned to JD</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialIcons name="sticky-note-2" size={18} color="#2f9e44" />
              <Text style={[styles.metaText, { color: palette.text }]}>2 recruiter notes</Text>
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
  title: {
    fontSize: 32,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
  },
  status: {
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
    fontSize: 16,
    fontWeight: '900',
  },
  metaRow: {
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
