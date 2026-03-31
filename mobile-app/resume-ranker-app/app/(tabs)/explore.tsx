import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const strengths = ['React Native', 'TypeScript', 'REST APIs', 'Design systems', 'Figma handoff'];
const goals = [
  { label: 'Remote-first product roles', helper: 'Prioritizing startup and SaaS teams' },
  { label: 'Salary target', helper: '$110k - $140k' },
  { label: 'Preferred markets', helper: 'US, EU, and India-based remote teams' },
];

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const palette = Colors[scheme];
  const [displayName, setDisplayName] = useState('Candidate');
  const [displayRole, setDisplayRole] = useState('Candidate');
  const [avatarText, setAvatarText] = useState('CA');

  useEffect(() => {
    const loadProfile = async () => {
      const storedName = await AsyncStorage.getItem('profile_name');
      const storedRole = await AsyncStorage.getItem('role');
      const nextName = storedName?.trim() || 'Candidate';
      const nextRole = storedRole === 'recruiter' ? 'Recruiter' : 'Candidate';
      const initials = nextName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');

      setDisplayName(nextName);
      setDisplayRole(nextRole);
      setAvatarText(initials || 'CA');
    };

    loadProfile();
  }, []);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}>
      <View style={[styles.profileHero, { backgroundColor: isDark ? '#31231b' : '#fff1e5' }]}>
        <View style={[styles.avatar, { backgroundColor: isDark ? '#493226' : '#ffd9bf' }]}>
          <Text style={styles.avatarText}>{avatarText}</Text>
        </View>
        <View style={styles.profileCopy}>
          <Text style={[styles.name, { color: palette.text }]}>{displayName}</Text>
          <Text style={[styles.role, { color: isDark ? '#e6d2c5' : '#805e49' }]}>{displayRole}</Text>
          <Text style={[styles.summary, { color: isDark ? '#d5c1b5' : '#735b4c' }]}>
            Profile settings for your ranking preferences, target roles, and the strengths you want to surface.
          </Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Top strengths</Text>
          <MaterialIcons name="verified" size={18} color="#ff7a29" />
        </View>
        <View style={styles.chipWrap}>
          {strengths.map((item) => (
            <View key={item} style={[styles.chip, { backgroundColor: isDark ? '#382a22' : '#fff3ea' }]}>
              <Text style={[styles.chipText, { color: palette.text }]}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
        <Text style={[styles.cardTitle, { color: palette.text }]}>Search preferences</Text>
        {goals.map((item, index) => (
          <View key={item.label} style={[styles.preferenceRow, index === goals.length - 1 && styles.lastPreferenceRow]}>
            <View style={styles.preferenceCopy}>
              <Text style={[styles.preferenceLabel, { color: palette.text }]}>{item.label}</Text>
              <Text style={[styles.preferenceHelper, { color: isDark ? '#d3c0b3' : '#846b5d' }]}>{item.helper}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={isDark ? '#ccb7aa' : '#9d7d69'} />
          </View>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
        <Text style={[styles.cardTitle, { color: palette.text }]}>Account health</Text>
        <View style={styles.healthRow}>
          <View style={styles.healthItem}>
            <Text style={styles.healthValue}>7</Text>
            <Text style={[styles.healthLabel, { color: isDark ? '#d3c0b3' : '#846b5d' }]}>Saved jobs</Text>
          </View>
          <View style={styles.healthItem}>
            <Text style={styles.healthValue}>3</Text>
            <Text style={[styles.healthLabel, { color: isDark ? '#d3c0b3' : '#846b5d' }]}>Resume versions</Text>
          </View>
          <View style={styles.healthItem}>
            <Text style={styles.healthValue}>92%</Text>
            <Text style={[styles.healthLabel, { color: isDark ? '#d3c0b3' : '#846b5d' }]}>Profile completion</Text>
          </View>
        </View>
      </View>

      <PressableLogout
        label="Log out"
        onPress={() => router.replace('/auth/login')}
        isDark={isDark}
        textColor={palette.text}
      />
    </ScrollView>
  );
}

function PressableLogout({
  label,
  onPress,
  isDark,
  textColor,
}: {
  label: string;
  onPress: () => void;
  isDark: boolean;
  textColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.logoutButton,
        {
          backgroundColor: isDark ? '#2b2019' : '#fff8f3',
          borderColor: isDark ? '#6b5142' : '#ebc8b2',
        },
      ]}>
      <Text style={[styles.logoutText, { color: textColor }]}>{label}</Text>
    </Pressable>
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
  profileHero: {
    borderRadius: 28,
    padding: 24,
    gap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#a44c15',
    fontSize: 24,
    fontWeight: '900',
  },
  profileCopy: {
    gap: 6,
  },
  name: {
    fontSize: 32,
    fontFamily: Fonts.serif,
    fontWeight: '700',
  },
  role: {
    fontSize: 16,
    fontWeight: '700',
  },
  summary: {
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 320,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(142, 110, 91, 0.35)',
  },
  lastPreferenceRow: {
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  preferenceCopy: {
    flex: 1,
    gap: 4,
  },
  preferenceLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  preferenceHelper: {
    fontSize: 14,
    lineHeight: 20,
  },
  healthRow: {
    flexDirection: 'row',
    gap: 12,
  },
  healthItem: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 122, 41, 0.1)',
    paddingVertical: 18,
    paddingHorizontal: 12,
    gap: 6,
  },
  healthValue: {
    color: '#ff7a29',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  healthLabel: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  logoutButton: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
