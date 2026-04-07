import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { API_BASE_URL, NLP_BASE_URL } from '@/lib/api';
import { MASTER_SKILL_SET } from '@/lib/skills';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const JOB_SCORE_STORAGE_KEY = 'job_score_by_job_id';

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

type AnalysisResult = {
  final_score: number;
  extracted_resume_text?: string;
};

function getScoreLabel(score: number) {
  if (score >= 80) {
    return 'Strong match';
  }

  if (score >= 60) {
    return 'Good potential';
  }

  return 'Needs tuning';
}

function ScoreInsight({ score, dark }: { score: number; dark: boolean }) {
  const roundedScore = Math.max(0, Math.min(100, Math.round(score)));
  const scoreLabel = getScoreLabel(roundedScore);
  const accent = roundedScore >= 80 ? '#2f9e44' : roundedScore >= 60 ? '#ff922b' : '#ef5548';

  return (
    <View style={[styles.scoreInsightCard, { backgroundColor: dark ? '#1d1a20' : '#fff8f3' }]}>
      <View style={styles.scoreInsightHeader}>
        <View>
          <Text style={[styles.scoreKicker, { color: dark ? '#e8d5c8' : '#9a4d16' }]}>
            Resume fit
          </Text>
          <Text style={[styles.scoreNumber, { color: dark ? '#f2edf4' : '#261d17' }]}>
            {roundedScore}%
          </Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: `${accent}22` }]}>
          <Text style={[styles.scoreBadgeText, { color: accent }]}>{scoreLabel}</Text>
        </View>
      </View>
      <View style={[styles.scoreTrack, { backgroundColor: dark ? '#3b343f' : '#eaded7' }]}>
        <View style={[styles.scoreFill, { width: `${roundedScore}%`, backgroundColor: accent }]} />
      </View>
      <Text style={[styles.scoreHint, { color: dark ? '#d6c1b5' : '#7a6152' }]}>
        Based on the uploaded resume against this job description.
      </Text>
    </View>
  );
}

export default function ApplicationsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const palette = Colors[scheme];
  const [applications, setApplications] = useState<BackendApplication[]>([]);
  const [jobTitleById, setJobTitleById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scoreByJobId, setScoreByJobId] = useState<Record<string, number>>({});
  const [jobDescriptionById, setJobDescriptionById] = useState<Record<string, string>>({});
  const [updatingApplicationId, setUpdatingApplicationId] = useState<string | null>(null);

  const saveJobScore = async (jobId: string, score: number) => {
    const storedScores = await AsyncStorage.getItem(JOB_SCORE_STORAGE_KEY);
    const current = storedScores ? JSON.parse(storedScores) : {};
    const next = {
      ...current,
      [jobId]: score,
    };

    await AsyncStorage.setItem(JOB_SCORE_STORAGE_KEY, JSON.stringify(next));
    setScoreByJobId(next);
  };

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

      console.log('Applications screen status:', applicationsResponse.status);
      console.log('Applications screen response:', applicationsRaw);

      if (!applicationsResponse.ok) {
        setError('Failed to load applications');
        return;
      }

      const applicationData = (JSON.parse(applicationsRaw) ?? []) as BackendApplication[];
      const storedScores = await AsyncStorage.getItem(JOB_SCORE_STORAGE_KEY);
      setApplications(applicationData);
      setScoreByJobId(storedScores ? JSON.parse(storedScores) : {});

      if (jobsResponse.ok) {
        const jobsData = JSON.parse(jobsRaw) as BackendJob[];
        setJobTitleById(
          Object.fromEntries(jobsData.map((job) => [job.ID, job.Title]))
        );
        setJobDescriptionById(
          Object.fromEntries(jobsData.map((job) => [job.ID, job.Description]))
        );
      }
    } catch (loadError) {
      console.log('Applications screen error:', loadError);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveExtractedResumeText = async (applicationId: string, resumeText?: string) => {
    if (!resumeText?.trim()) {
      return;
    }

    const token = await AsyncStorage.getItem('token');

    if (!token) {
      return;
    }

    const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/resume-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        resume_text: resumeText,
      }),
    });

    const raw = await response.text();

    console.log('Update extracted resume text status:', response.status);
    console.log('Update extracted resume text response:', raw);
  };

  const updateResumeAndRescore = async (application: BackendApplication) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const jobDescription = jobDescriptionById[application.JobID];

      if (!token) {
        setError('No token found');
        return;
      }

      if (!jobDescription) {
        setError('Job description not found for scoring');
        return;
      }

      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (pickerResult.canceled) {
        return;
      }

      const file = pickerResult.assets[0];

      if (!file) {
        return;
      }

      setUpdatingApplicationId(application.ID);
      setError('');

      const presignResponse = await fetch(
        `${API_BASE_URL}/applications/${application.ID}/resume/presign`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const presignRaw = await presignResponse.text();

      if (!presignResponse.ok) {
        console.log('Applied resume presign failed:', presignRaw);
        setError('Failed to prepare resume upload');
        return;
      }

      const presignData = JSON.parse(presignRaw);
      const uploadUrl = presignData.upload_url;

      if (!uploadUrl) {
        setError('Upload URL missing');
        return;
      }

      const fileResponse = await fetch(file.uri);
      const fileBlob = await fileResponse.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/pdf',
        },
        body: fileBlob,
      });

      const uploadRaw = await uploadResponse.text();

      if (!uploadResponse.ok) {
        console.log('Applied resume upload failed:', uploadRaw);
        setError('Failed to upload resume');
        return;
      }

      const confirmResponse = await fetch(
        `${API_BASE_URL}/applications/${application.ID}/resume/confirm`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const confirmRaw = await confirmResponse.text();

      if (!confirmResponse.ok) {
        console.log('Applied resume confirm failed:', confirmRaw);
        setError('Failed to confirm resume upload');
        return;
      }

      const formData = new FormData();
      formData.append('resume_pdf', {
        uri: file.uri,
        name: file.name || 'resume.pdf',
        type: file.mimeType || 'application/pdf',
      } as unknown as Blob);
      formData.append('job_description', jobDescription);
      formData.append('skills', JSON.stringify(MASTER_SKILL_SET));

      const scoreResponse = await fetch(`${NLP_BASE_URL}/rank-pdf`, {
        method: 'POST',
        body: formData,
      });

      const scoreRaw = await scoreResponse.text();

      if (!scoreResponse.ok) {
        console.log('Applied resume scoring failed:', scoreRaw);
        setError('Resume uploaded, but scoring failed');
        await loadApplications();
        return;
      }

      const scoreData = JSON.parse(scoreRaw) as AnalysisResult;
      await saveJobScore(application.JobID, scoreData.final_score);
      await saveExtractedResumeText(application.ID, scoreData.extracted_resume_text);
      await loadApplications();
    } catch (updateError) {
      console.log('Update resume error:', updateError);
      setError('Failed to update resume');
    } finally {
      setUpdatingApplicationId(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadApplications();
    }, [loadApplications])
  );

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
          const finalScore = scoreByJobId[application.JobID];
          const isUpdating = updatingApplicationId === application.ID;
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

              {application.Status === 'resume_uploaded' && typeof finalScore === 'number' ? (
                <View style={styles.scoreSection}>
                  <ScoreInsight score={finalScore} dark={isDark} />
                </View>
              ) : null}

              {application.Status === 'resume_uploaded' && typeof finalScore !== 'number' ? (
                <View style={[styles.scoreMissingCard, { backgroundColor: isDark ? '#1d1a20' : '#fff8f3' }]}>
                  <Text style={[styles.scoreKicker, { color: isDark ? '#e8d5c8' : '#9a4d16' }]}>
                    Resume fit
                  </Text>
                  <Text style={[styles.scoreHint, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
                    Score not generated yet. Update the resume once to calculate it for this job.
                  </Text>
                </View>
              ) : null}

              {application.Status === 'resume_uploaded' ? (
                <Pressable
                  onPress={() => updateResumeAndRescore(application)}
                  disabled={isUpdating}
                  style={[styles.updateButton, isUpdating && styles.pendingButton]}>
                  <Text style={styles.updateButtonText}>
                    {isUpdating ? 'Updating & scoring...' : 'Update Resume & Rescore'}
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
  scoreSection: {
    marginTop: 8,
  },
  scoreMissingCard: {
    borderRadius: 22,
    padding: 18,
    gap: 8,
    marginTop: 8,
  },
  scoreInsightCard: {
    borderRadius: 22,
    padding: 18,
    gap: 14,
  },
  scoreInsightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 14,
  },
  scoreKicker: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreNumber: {
    marginTop: 2,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '900',
  },
  scoreBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scoreBadgeText: {
    fontSize: 12,
    fontWeight: '900',
  },
  scoreTrack: {
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: 999,
  },
  scoreHint: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  updateButton: {
    marginTop: 6,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#22577a',
  },
  pendingButton: {
    opacity: 0.75,
  },
  updateButtonText: {
    color: '#f4fbff',
    fontSize: 15,
    fontWeight: '800',
  },
});
