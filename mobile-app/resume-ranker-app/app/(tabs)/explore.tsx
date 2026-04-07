import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { API_BASE_URL } from '@/lib/api';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const JOB_SCORE_STORAGE_KEY = 'job_score_by_job_id';

type BackendApplication = {
  ID: string;
  JobID: string;
  CandidateID: string;
  AppliedAt: string;
  ResumeUrl?: string;
  Status: string;
};

type BackendJob = {
  ID: string;
  Title: string;
  Description: string;
  RecruiterID: string;
  Status: string;
  Deadline: string;
  CreatedAt: string;
};

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const palette = Colors[scheme];
  const [displayName, setDisplayName] = useState('Candidate');
  const [displayRole, setDisplayRole] = useState('Candidate');
  const [displayEmail, setDisplayEmail] = useState('No email saved');
  const [avatarText, setAvatarText] = useState('CA');
  const [applications, setApplications] = useState<BackendApplication[]>([]);
  const [jobTitleById, setJobTitleById] = useState<Record<string, string>>({});
  const [scoreByJobId, setScoreByJobId] = useState<Record<string, number>>({});

  const loadProfile = useCallback(async () => {
    try {
      const storedName = await AsyncStorage.getItem('profile_name');
      const storedEmail = await AsyncStorage.getItem('profile_email');
      const storedRole = await AsyncStorage.getItem('role');
      const token = await AsyncStorage.getItem('token');
      const storedScores = await AsyncStorage.getItem(JOB_SCORE_STORAGE_KEY);
      const nextName = storedName?.trim() || 'Candidate';
      const nextRole = storedRole === 'recruiter' ? 'Recruiter' : 'Candidate';

      setDisplayName(nextName);
      setDisplayRole(nextRole);
      setDisplayEmail(storedEmail?.trim() || 'No email saved');
      setAvatarText(getInitials(nextName) || 'CA');
      setScoreByJobId(storedScores ? JSON.parse(storedScores) : {});

      if (!token || storedRole !== 'candidate') {
        setApplications([]);
        setJobTitleById({});
        return;
      }

      const [applicationsResponse, jobsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/applications`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_BASE_URL}/jobs`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (applicationsResponse.ok) {
        const applicationData = (await applicationsResponse.json()) as BackendApplication[];
        setApplications(applicationData ?? []);
      }

      if (jobsResponse.ok) {
        const jobsData = (await jobsResponse.json()) as BackendJob[];
        setJobTitleById(Object.fromEntries((jobsData ?? []).map((job) => [job.ID, job.Title])));
      }
    } catch (profileError) {
      console.log('Profile load error:', profileError);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

  const uploadedApplications = applications.filter((application) => application.Status === 'resume_uploaded');
  const pendingApplications = applications.filter((application) => application.Status === 'resume_pending');
  const latestApplication = [...applications].sort(
    (first, second) => new Date(second.AppliedAt).getTime() - new Date(first.AppliedAt).getTime()
  )[0];
  const latestTarget = latestApplication
    ? jobTitleById[latestApplication.JobID] ?? latestApplication.JobID
    : 'No applications yet';
  const savedScores = Object.values(scoreByJobId).filter((score) => typeof score === 'number');
  const bestScore = savedScores.length ? `${Math.max(...savedScores).toFixed(0)}%` : 'Not scored';
  const completionChecks = [
    displayName !== 'Candidate',
    displayEmail !== 'No email saved',
    Boolean(displayRole),
    applications.length > 0,
    uploadedApplications.length > 0,
    savedScores.length > 0,
  ];
  const completion = Math.round(
    (completionChecks.filter(Boolean).length / completionChecks.length) * 100
  );

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['token', 'role']);
    router.replace('/auth/login');
  };

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
            {displayEmail}
          </Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Application activity</Text>
          <MaterialIcons name="insights" size={18} color="#ff7a29" />
        </View>
        <View style={styles.healthRow}>
          <View style={styles.healthItem}>
            <Text style={styles.healthValue}>{applications.length}</Text>
            <Text style={[styles.healthLabel, { color: isDark ? '#d3c0b3' : '#846b5d' }]}>Applied</Text>
          </View>
          <View style={styles.healthItem}>
            <Text style={styles.healthValue}>{uploadedApplications.length}</Text>
            <Text style={[styles.healthLabel, { color: isDark ? '#d3c0b3' : '#846b5d' }]}>Uploaded</Text>
          </View>
          <View style={styles.healthItem}>
            <Text style={styles.healthValue}>{pendingApplications.length}</Text>
            <Text style={[styles.healthLabel, { color: isDark ? '#d3c0b3' : '#846b5d' }]}>Pending</Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
        <Text style={[styles.cardTitle, { color: palette.text }]}>Current status</Text>
        {[
          { label: 'Latest target role', helper: latestTarget },
          { label: 'Best resume fit', helper: bestScore },
          { label: 'Profile completion', helper: `${completion}% based on real account activity` },
        ].map((item, index, rows) => (
          <View key={item.label} style={[styles.preferenceRow, index === rows.length - 1 && styles.lastPreferenceRow]}>
            <View style={styles.preferenceCopy}>
              <Text style={[styles.preferenceLabel, { color: palette.text }]}>{item.label}</Text>
              <Text style={[styles.preferenceHelper, { color: isDark ? '#d3c0b3' : '#846b5d' }]}>{item.helper}</Text>
            </View>
            <MaterialIcons name="check-circle" size={22} color={isDark ? '#ffd5bb' : '#ff7a29'} />
          </View>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
        <Text style={[styles.cardTitle, { color: palette.text }]}>Next step</Text>
        <Text style={[styles.summary, { color: isDark ? '#d5c1b5' : '#735b4c' }]}>
          {applications.length === 0
            ? 'Apply to a job so your profile can track real progress.'
            : pendingApplications.length > 0
              ? 'Upload your resume for pending applications to unlock fit scores.'
              : savedScores.length === 0
                ? 'Run resume analysis after upload so your best fit score appears here.'
                : 'Your profile is synced with your latest application activity.'}
        </Text>
      </View>

      <PressableLogout
        label="Log out"
        onPress={handleLogout}
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
