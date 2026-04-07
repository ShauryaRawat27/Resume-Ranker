import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { API_BASE_URL, NLP_BASE_URL } from '@/lib/api';
import { MASTER_SKILL_SET } from '@/lib/skills';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type BackendApplication = {
  ID: string;
  JobID: string;
  CandidateID: string;
  AppliedAt: string;
  ResumeUrl?: string;
  Status: string;
  ResumeText?: string;
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
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingApplicationId, setDownloadingApplicationId] = useState<string | null>(null);
  const [scoreByApplicationId, setScoreByApplicationId] = useState<Record<string, number>>({});

  const loadApplicantScores = useCallback(async (applicationData: BackendApplication[], jobsData: BackendJob[]) => {
    const jobById = Object.fromEntries(jobsData.map((job) => [job.ID, job]));
    const scoreableApplications = applicationData.filter(
      (application) =>
        application.Status === 'resume_uploaded' &&
        application.ResumeText &&
        application.ResumeText.trim() &&
        jobById[application.JobID]
    );

    if (scoreableApplications.length === 0) {
      setScoreByApplicationId({});
      return;
    }

    const scores = await Promise.all(
      scoreableApplications.map(async (application) => {
        const job = jobById[application.JobID];

        try {
          const response = await fetch(`${NLP_BASE_URL}/rank`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              resume_text: application.ResumeText,
              job_description: job.Description,
              skills: MASTER_SKILL_SET,
            }),
          });

          const raw = await response.text();

          if (!response.ok) {
            console.log('Applicant score failed:', raw);
            return null;
          }

          const data = JSON.parse(raw) as { final_score: number };
          return [application.ID, Math.round(data.final_score)] as const;
        } catch (scoreError) {
          console.log('Applicant score error:', scoreError);
          return null;
        }
      })
    );

    setScoreByApplicationId(
      Object.fromEntries(scores.filter((score): score is readonly [string, number] => Boolean(score)))
    );
  }, []);

  const loadApplications = useCallback(async () => {
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
        setJobs(jobsData);
        void loadApplicantScores(applicationData, jobsData);
      }
    } catch (loadError) {
      console.log('RECRUITER SCREEN ERROR:', loadError);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [loadApplicantScores]);

  useFocusEffect(
    useCallback(() => {
      void loadApplications();
    }, [loadApplications])
  );

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

  const applicationsByJobId = applications.reduce<Record<string, BackendApplication[]>>(
    (acc, application) => {
      acc[application.JobID] = [...(acc[application.JobID] ?? []), application];
      return acc;
    },
    {}
  );
  const applicationsWithoutJob = applications.filter((application) => !jobs.some((job) => job.ID === application.JobID));
  const jobSections = [
    ...jobs.map((job) => ({
      id: job.ID,
      title: job.Title,
      helper: `${job.Status} - Deadline ${new Date(job.Deadline).toLocaleDateString()}`,
      applications: applicationsByJobId[job.ID] ?? [],
    })),
    ...(applicationsWithoutJob.length > 0
      ? [
          {
            id: 'unknown-job',
            title: 'Other applications',
            helper: 'Applications linked to jobs not returned by the jobs endpoint',
            applications: applicationsWithoutJob,
          },
        ]
      : []),
  ];

  if (loading) {
    return (
      <View style={[styles.stateScreen, { backgroundColor: palette.background }]}>
        <Text style={[styles.stateText, { color: palette.text }]}>Loading applicants...</Text>
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
      <Text style={[styles.title, { color: palette.text }]}>Applicants</Text>
      <Text style={[styles.subtitle, { color: isDark ? '#d2bfb2' : '#846b5d' }]}>
        Review applications for your jobs and track resume status.
      </Text>

      {jobs.length === 0 && applications.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
          <Text style={[styles.emptyTitle, { color: palette.text }]}>No jobs or applications yet</Text>
          <Text style={[styles.emptyCopy, { color: isDark ? '#d2bfb2' : '#846b5d' }]}>
            Create a job first. Applicants will be grouped under each job here.
          </Text>
        </View>
      ) : (
        jobSections.map((section) => {
          const uploadedCount = section.applications.filter(
            (application) => application.Status === 'resume_uploaded'
          ).length;

          return (
            <View key={section.id} style={[styles.jobSection, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
              <View style={styles.jobSectionHeader}>
                <View style={styles.copy}>
                  <Text style={[styles.jobTitle, { color: palette.text }]}>{section.title}</Text>
                  <Text style={[styles.status, { color: isDark ? '#d2bfb2' : '#846b5d' }]}>
                    {section.helper}
                  </Text>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: isDark ? '#3d2921' : '#fff1e5' }]}>
                  <Text style={[styles.scoreText, { color: '#d9480f' }]}>
                    {section.applications.length} applicants
                  </Text>
                </View>
              </View>

              <View style={styles.sectionStats}>
                <View style={[styles.statPill, { backgroundColor: 'rgba(47, 158, 68, 0.14)' }]}>
                  <Text style={[styles.statText, { color: '#2f9e44' }]}>{uploadedCount} resumes ready</Text>
                </View>
                <View style={[styles.statPill, { backgroundColor: 'rgba(217, 72, 15, 0.12)' }]}>
                  <Text style={[styles.statText, { color: '#d9480f' }]}>
                    {section.applications.length - uploadedCount} pending
                  </Text>
                </View>
              </View>

              {section.applications.length === 0 ? (
                <View style={[styles.emptyMiniCard, { backgroundColor: isDark ? '#201914' : '#fff8f3' }]}>
                  <Text style={[styles.emptyCopy, { color: isDark ? '#d2bfb2' : '#846b5d' }]}>
                    No applicants for this job yet.
                  </Text>
                </View>
              ) : (
                section.applications.map((application) => {
                  const statusLabel =
                    application.Status === 'resume_uploaded'
                      ? 'Resume uploaded'
                      : application.Status === 'resume_pending'
                        ? 'Resume upload pending'
                        : application.Status;
                  const statusTone = application.Status === 'resume_uploaded' ? '#2f9e44' : '#d9480f';
                  const applicantScore = scoreByApplicationId[application.ID];
                  const canScore =
                    application.Status === 'resume_uploaded' &&
                    application.ResumeText &&
                    application.ResumeText.trim();

                  return (
                    <View
                      key={application.ID}
                      style={[styles.applicantCard, { backgroundColor: isDark ? '#201914' : '#fff8f3' }]}>
                      <View style={styles.row}>
                        <View style={styles.copy}>
                          <Text style={[styles.name, { color: palette.text }]}>
                            Candidate {application.CandidateID}
                          </Text>
                          <Text style={[styles.status, { color: isDark ? '#d2bfb2' : '#846b5d' }]}>
                            Applied on {new Date(application.AppliedAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={styles.applicantRight}>
                          {application.Status === 'resume_uploaded' ? (
                            <View style={[styles.fitScoreBadge, { backgroundColor: isDark ? '#352b22' : '#fff1e5' }]}>
                              <Text style={styles.fitScoreText}>
                                {typeof applicantScore === 'number'
                                  ? `${applicantScore}%`
                                  : canScore
                                    ? 'Scoring'
                                    : 'No score'}
                              </Text>
                            </View>
                          ) : null}
                          <View style={[styles.scoreBadge, { backgroundColor: `${statusTone}20` }]}>
                            <Text style={[styles.scoreText, { color: statusTone }]}>{statusLabel}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.metaRow}>
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
  emptyMiniCard: {
    borderRadius: 18,
    padding: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  emptyCopy: {
    fontSize: 14,
    lineHeight: 22,
  },
  jobSection: {
    borderRadius: 26,
    padding: 18,
    gap: 14,
  },
  jobSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statText: {
    fontSize: 12,
    fontWeight: '900',
  },
  applicantCard: {
    borderRadius: 22,
    padding: 16,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  applicantRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  jobTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
  },
  name: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
  },
  status: {
    fontSize: 14,
    lineHeight: 20,
  },
  scoreBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '900',
  },
  fitScoreBadge: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  fitScoreText: {
    color: '#ff7a29',
    fontSize: 18,
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
    fontSize: 13,
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
