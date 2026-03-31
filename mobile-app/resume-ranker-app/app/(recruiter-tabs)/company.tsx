import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const settings = [
  { title: 'Score weighting', helper: 'Prioritize skills, metrics, and seniority fit' },
  { title: 'Team collaborators', helper: '5 hiring managers have access' },
  { title: 'Open roles', helper: '3 active positions' },
];

export default function RecruiterCompanyScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const palette = Colors[scheme];
  const [displayName, setDisplayName] = useState('Recruiter');

  useEffect(() => {
    const loadProfile = async () => {
      const storedName = await AsyncStorage.getItem('profile_name');
      setDisplayName(storedName?.trim() || 'Recruiter');
    };

    loadProfile();
  }, []);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: isDark ? '#31231b' : '#fff1e5' }]}>
        <Text style={[styles.name, { color: palette.text }]}>{displayName}</Text>
        <Text style={[styles.helper, { color: isDark ? '#dcc7ba' : '#765c4d' }]}>
          Configure how resumes are ranked for your team and how applicants move through the funnel.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
        {settings.map((item, index) => (
          <View key={item.title} style={[styles.settingRow, index === settings.length - 1 && styles.lastRow]}>
            <View style={styles.settingCopy}>
              <Text style={[styles.settingTitle, { color: palette.text }]}>{item.title}</Text>
              <Text style={[styles.settingHelper, { color: isDark ? '#d2bfb2' : '#846b5d' }]}>{item.helper}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={isDark ? '#cfb8ab' : '#8e6e5b'} />
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => router.replace('/auth/login')}
        style={[
          styles.logoutButton,
          {
            backgroundColor: isDark ? '#2b2019' : '#fff8f3',
            borderColor: isDark ? '#6b5142' : '#ebc8b2',
          },
        ]}>
        <Text style={[styles.logoutText, { color: palette.text }]}>Log out</Text>
      </Pressable>
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
    gap: 8,
  },
  name: {
    fontSize: 34,
    lineHeight: 40,
    fontFamily: Fonts.serif,
    fontWeight: '700',
  },
  helper: {
    fontSize: 15,
    lineHeight: 23,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(142, 110, 91, 0.35)',
  },
  lastRow: {
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  settingCopy: {
    flex: 1,
    gap: 4,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  settingHelper: {
    fontSize: 14,
    lineHeight: 20,
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
