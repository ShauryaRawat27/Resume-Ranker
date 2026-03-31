import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { API_BASE_URL } from '@/lib/api';
import { Colors } from '@/constants/theme';
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

export default function ApplicationsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const palette = Colors[scheme];
  const [applications, setApplications] = useState<BackendApplication[]>([]);
  const [jobTitleById, setJobTitleById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError('');

      const token = await AsyncStorage.getItem('token');

      if (!token) {
        setError('No token found');
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

      const applicationsRaw = await applicationsResponse.text();
      const jobsRaw = await jobsResponse.text();

      console.log('Applications screen status:', applicationsResponse.status);
      console.log('Applications screen response:', applicationsRaw);

      if (!applicationsResponse.ok) {
        setError('Failed to load applications');
        return;
      }

      const applicationData = JSON.parse(applicationsRaw) as BackendApplication[];
      setApplications(applicationData);

      if (jobsResponse.ok) {
        const jobsData = JSON.parse(jobsRaw) as BackendJob[];
        setJobTitleById(
          Object.fromEntries(jobsData.map((job) => [job.ID, job.Title]))
        );
      }
    } catch (loadError) {
      console.log('Applications screen error:', loadError);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  if (loading) {
    return (
      <View style={[styles.stateScreen, { backgroundColor: palette.background }]}>
        <Text style={[styles.stateText, { color: palette.text }]}>Loading applications...</Text>
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
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.text }]}>My Applications</Text>
        <Text style={[styles.helper, { color: isDark ? '#cfbcb0' : '#846b5d' }]}>
          Track your submitted jobs and resume status in one place.
        </Text>
      </View>

      {applications.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
          <Text style={[styles.emptyTitle, { color: palette.text }]}>No applications yet</Text>
          <Text style={[styles.emptyCopy, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
            Apply to a job from the Jobs tab and it will show up here.
          </Text>
        </View>
      ) : (
        applications.map((application) => {
          const title = jobTitleById[application.JobID] ?? application.JobID;
          const statusLabel =
            application.Status === 'resume_uploaded'
              ? 'Resume uploaded'
              : application.Status === 'resume_pending'
                ? 'Resume upload pending'
                : application.Status;

          return (
            <View
              key={application.ID}
              style={[styles.applicationCard, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.jobTitle, { color: palette.text }]}>{title}</Text>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        application.Status === 'resume_uploaded'
                          ? 'rgba(47, 158, 68, 0.16)'
                          : isDark
                            ? '#3d2921'
                            : '#fff1e5',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.statusText,
                      { color: application.Status === 'resume_uploaded' ? '#2f9e44' : '#d9480f' },
                    ]}>
                    {statusLabel}
                  </Text>
                </View>
              </View>

              <Text style={[styles.metaLabel, { color: isDark ? '#e8d5c8' : '#9a4d16' }]}>
                Applied on
              </Text>
              <Text style={[styles.metaValue, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
                {new Date(application.AppliedAt).toLocaleDateString()}
              </Text>

              <Text style={[styles.metaLabel, { color: isDark ? '#e8d5c8' : '#9a4d16' }]}>
                Application ID
              </Text>
              <Text style={[styles.metaValue, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
                {application.ID}
              </Text>
            </View>
          );
        })
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
  emptyCard: {
    borderRadius: 24,
    padding: 24,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  emptyCopy: {
    fontSize: 14,
    lineHeight: 22,
  },
  applicationCard: {
    borderRadius: 24,
    padding: 20,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  jobTitle: {
    flex: 1,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  metaLabel: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metaValue: {
    fontSize: 14,
    lineHeight: 22,
  },
});
