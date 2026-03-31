import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Linking } from 'react-native';

type BackendApplication = {
  ID : string;
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

export default function RecruiterCandidatesScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const palette = Colors[scheme];

  const [applications, setApplications] = useState<BackendApplication[]>([]);
  const [jobTitleById, setJobTitleById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingApplicationId, setDownloadingApplicationId] = useState<string | null>(null);

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

      console.log('Recruiter applications status:', applicationsResponse.status);
      console.log('Recruiter applications response:', applicationsRaw);

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
      console.log('RECRUITER SCREEN ERROR:', loadError);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  },[]);

  const downloadResume = async (applicationId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        console.log('No token found');
        return;
      }

      setDownloadingApplicationId(applicationId);

      const response = await fetch(
        `${API_BASE_URL}/applications/${applicationId}/resume/download`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const raw = await response.text();

      console.log('Download status:', response.status);
      console.log('Download response:', raw);

      if (!response.ok) {
        console.log('Download failed');
        return;
      }

      const data = JSON.parse(raw);

      if (!data.download_url) {
        console.log('No download URL returned');
        return;
      }

      await Linking.openURL(data.download_url);
    } catch (downloadError) {
      console.log('Download error:', downloadError);
    } finally {
      setDownloadingApplicationId(null);
    }
  };

  if (loading) {
  return (
    <View>
      <Text>Loading candidates...</Text>
    </View>
  );
}

if (error) {
  return (
    <View>
      <Text>{error}</Text>
    </View>
  );
}
  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: palette.text }]}>Applicants</Text>
      <Text style={[styles.subtitle, { color: isDark ? '#d2bfb2' : '#846b5d' }]}>
        Review applications for your jobs and track resume status.
      </Text>

      {applications.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
          <Text style={[styles.emptyTitle, { color: palette.text }]}>No applications yet</Text>
          <Text style={[styles.emptyCopy, { color: isDark ? '#d2bfb2' : '#846b5d' }]}>
            Candidate applications for your jobs will show up here.
          </Text>
        </View>
      ) : (
        applications.map((application) => {
        const jobTitle = jobTitleById[application.JobID] ?? application.JobID;
        const statusLabel =
          application.Status === 'resume_uploaded'
            ? 'Resume uploaded'
            : application.Status === 'resume_pending'
              ? 'Resume upload pending'
              : application.Status;
        const statusTone = application.Status === 'resume_uploaded' ? '#2f9e44' : '#d9480f';

        return (
          <View key={application.ID} style={[styles.card, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
            <View style={styles.row}>
              <View style={styles.copy}>
                <Text style={[styles.name, { color: palette.text }]}>{jobTitle}</Text>
                <Text style={[styles.status, { color: isDark ? '#d2bfb2' : '#846b5d' }]}>
                  Candidate: {application.CandidateID}
                </Text>
              </View>
              <View style={[styles.scoreBadge, { backgroundColor: `${statusTone}20` }]}>
                <Text style={[styles.scoreText, { color: statusTone }]}>{statusLabel}</Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <MaterialIcons name="event" size={18} color="#ff7a29" />
                <Text style={[styles.metaText, { color: palette.text }]}>
                  Applied on {new Date(application.AppliedAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialIcons name="badge" size={18} color="#2f9e44" />
                <Text style={[styles.metaText, { color: palette.text }]}>
                  Application ID: {application.ID}
                </Text>
              </View>
            </View>
            {application.Status === 'resume_uploaded' ? (
              <Pressable
                onPress={() => downloadResume(application.ID)}
                disabled={downloadingApplicationId === application.ID}
                style={[
                  styles.downloadButton,
                  downloadingApplicationId === application.ID && styles.pendingButton,
                ]}>
                <Text style={styles.downloadButtonText}>
                  {downloadingApplicationId === application.ID ? 'Opening...' : 'Download Resume'}
                </Text>
              </Pressable>
            ) : null}
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
  title: {
    fontSize: 32,
    fontWeight: '900',
  },
  subtitle: {
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
  downloadButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#22577a',
  },
  pendingButton: {
    opacity: 0.75,
  },
  downloadButtonText: {
    color: '#f4fbff',
    fontSize: 15,
    fontWeight: '800',
  },
});
