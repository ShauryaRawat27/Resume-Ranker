import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { API_BASE_URL } from '@/lib/api';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

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

export default function RecruiterPipelineScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const palette = Colors[scheme];
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [applications, setApplications] = useState<BackendApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPipeline = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const token = await AsyncStorage.getItem('token');

      if (!token) {
        setError('No token found');
        return;
      }

      const [jobsResponse, applicationsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/jobs`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_BASE_URL}/applications`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const jobsRaw = await jobsResponse.text();
      const applicationsRaw = await applicationsResponse.text();

      console.log('Recruiter home jobs status:', jobsResponse.status);
      console.log('Recruiter home applications status:', applicationsResponse.status);

      if (!jobsResponse.ok || !applicationsResponse.ok) {
        setError('Failed to load recruiter dashboard');
        return;
      }

      setJobs((JSON.parse(jobsRaw) ?? []) as BackendJob[]);
      setApplications((JSON.parse(applicationsRaw) ?? []) as BackendApplication[]);
    } catch (pipelineError) {
      console.log('Recruiter home error:', pipelineError);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPipeline();
    }, [loadPipeline])
  );

  const uploadedApplications = applications.filter((application) => application.Status === 'resume_uploaded');
  const pendingApplications = applications.filter((application) => application.Status === 'resume_pending');
  const openJobs = jobs.filter((job) => job.Status.toLowerCase() === 'open');
  const applicationsByJobId = applications.reduce<Record<string, BackendApplication[]>>((acc, application) => {
    acc[application.JobID] = [...(acc[application.JobID] ?? []), application];
    return acc;
  }, {});
  const priorityJob = [...jobs].sort(
    (first, second) =>
      (applicationsByJobId[second.ID]?.length ?? 0) - (applicationsByJobId[first.ID]?.length ?? 0)
  )[0];
  const priorityApplications = priorityJob ? applicationsByJobId[priorityJob.ID] ?? [] : [];
  const priorityUploadedCount = priorityApplications.filter(
    (application) => application.Status === 'resume_uploaded'
  ).length;
  const stages = [
    { label: 'Open jobs', value: openJobs.length, tone: '#868e96' },
    { label: 'Applicants', value: applications.length, tone: '#f08c00' },
    { label: 'Resumes ready', value: uploadedApplications.length, tone: '#2f9e44' },
  ];

  if (loading) {
    return (
      <View style={[styles.stateScreen, { backgroundColor: palette.background }]}>
        <Text style={[styles.stateText, { color: palette.text }]}>Loading recruiter dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.stateScreen, { backgroundColor: palette.background }]}>
        <Text style={[styles.stateText, { color: palette.text }]}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: isDark ? '#31231b' : '#fff1e5' }]}>
        <Text style={[styles.kicker, { color: isDark ? '#ffd5bb' : '#a0541c' }]}>Recruiter workspace</Text>
        <Text style={[styles.title, { color: palette.text }]}>Your hiring pipeline at a glance.</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#dcc7ba' : '#765c4d' }]}>
          Track live jobs, resume uploads, and where candidate follow-up is needed.
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

      {jobs.length === 0 ? (
        <View style={[styles.card, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>No jobs created yet</Text>
          <Text style={[styles.insightText, { color: isDark ? '#d2bfb2' : '#846b5d' }]}>
            Create your first job so applicants, resume uploads, and ranking activity can appear here.
          </Text>
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: palette.text }]}>Most active opening</Text>
              <Text style={[styles.cardSubtitle, { color: isDark ? '#d2bfb2' : '#846b5d' }]}>
                {priorityJob?.Title ?? 'No active opening'}
              </Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: isDark ? '#3d2a1f' : '#fff2e7' }]}>
              <Text style={styles.scoreText}>{priorityApplications.length} applicants</Text>
            </View>
          </View>

          <View style={styles.insightRow}>
            <MaterialIcons name="upload-file" size={18} color="#ff7a29" />
            <Text style={[styles.insightText, { color: palette.text }]}>
              {priorityUploadedCount} of {priorityApplications.length} applicants have uploaded resumes for this job.
            </Text>
          </View>
          <View style={styles.insightRow}>
            <MaterialIcons name="schedule" size={18} color="#2f9e44" />
            <Text style={[styles.insightText, { color: palette.text }]}>
              {pendingApplications.length > 0
                ? `${pendingApplications.length} applicants still need to upload resumes before ranking is useful.`
                : 'All current applicants with submitted applications are ready for review or ranking.'}
            </Text>
          </View>
        </View>
      )}
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
  stateScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stateText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
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
