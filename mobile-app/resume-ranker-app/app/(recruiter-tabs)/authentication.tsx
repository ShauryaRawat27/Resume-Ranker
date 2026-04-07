import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { API_BASE_URL, NLP_BASE_URL } from '@/lib/api';
import { MASTER_SKILL_SET } from '@/lib/skills';
import { Colors, Fonts } from '@/constants/theme';
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

type CertificationResult = {
  certification: string;
  provider_trusted: boolean;
  has_credential_id: boolean;
  link_valid: boolean;
  verification_link?: boolean;
  score: number;
  verdict: string;
  llm_opinion: string;
};

type AuthenticationEntry = {
  applicationId: string;
  candidateId: string;
  certifications: CertificationResult[];
};

export default function RecruiterAuthenticationScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const palette = Colors[scheme];
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [applications, setApplications] = useState<BackendApplication[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [entries, setEntries] = useState<AuthenticationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
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

      if (!jobsResponse.ok || !applicationsResponse.ok) {
        setError('Failed to load authentication data');
        return;
      }

      const jobsData = (JSON.parse(jobsRaw) ?? []) as BackendJob[];
      const applicationsData = (JSON.parse(applicationsRaw) ?? []) as BackendApplication[];

      setJobs(jobsData);
      setApplications(applicationsData);

      if (!selectedJobId && jobsData.length > 0) {
        setSelectedJobId(jobsData[0].ID);
      }
    } catch (loadError) {
      console.log('Authentication load error:', loadError);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [selectedJobId]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const selectedJob = jobs.find((job) => job.ID === selectedJobId);
  const selectedApplications = applications.filter((application) => application.JobID === selectedJobId);
  const uploadedApplications = selectedApplications.filter(
    (application) =>
      application.Status === 'resume_uploaded' &&
      application.ResumeText &&
      application.ResumeText.trim()
  );

  const validateCertifications = async () => {
    if (!selectedJob) {
      setError('Please select a job');
      return;
    }

    if (uploadedApplications.length === 0) {
      setError('No uploaded resumes with extracted text found for this job');
      return;
    }

    try {
      setValidating(true);
      setError('');
      setEntries([]);

      const results = await Promise.all(
        uploadedApplications.map(async (application) => {
          const response = await fetch(`${NLP_BASE_URL}/rank`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              resume_text: application.ResumeText,
              job_description: selectedJob.Description,
              skills: MASTER_SKILL_SET,
            }),
          });

          const raw = await response.text();

          if (!response.ok) {
            throw new Error(`Certification validation failed for ${application.ID}: ${raw}`);
          }

          const data = JSON.parse(raw) as { certifications?: CertificationResult[] };

          return {
            applicationId: application.ID,
            candidateId: application.CandidateID,
            certifications: data.certifications ?? [],
          };
        })
      );

      setEntries(results);
    } catch (validationError) {
      console.log('Certification validation error:', validationError);
      setError('Failed to validate certifications');
    } finally {
      setValidating(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['token', 'role']);
    router.replace('/auth/login');
  };

  if (loading) {
    return (
      <View style={[styles.stateScreen, { backgroundColor: palette.background }]}>
        <Text style={[styles.stateText, { color: palette.text }]}>Loading authentication...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: isDark ? '#31231b' : '#fff1e5' }]}>
        <Text style={[styles.kicker, { color: isDark ? '#ffd5bb' : '#a0541c' }]}>Recruiter tools</Text>
        <Text style={[styles.title, { color: palette.text }]}>Certificate authentication</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#dcc7ba' : '#765c4d' }]}>
          Validate certifications found in uploaded resumes using provider checks, credential IDs, links, and LLM review.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Choose a job</Text>
        <View style={styles.jobList}>
          {jobs.length === 0 ? (
            <Text style={[styles.emptyLine, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
              No recruiter jobs found yet.
            </Text>
          ) : (
            jobs.map((job) => (
              <Pressable
                key={job.ID}
                onPress={() => {
                  setSelectedJobId(job.ID);
                  setEntries([]);
                  setError('');
                }}
                style={[
                  styles.jobButton,
                  {
                    backgroundColor: selectedJobId === job.ID ? '#ff7a29' : isDark ? '#2d221b' : '#fff8f3',
                    borderColor: selectedJobId === job.ID ? '#ff7a29' : isDark ? '#4a392f' : '#f1ddd0',
                  },
                ]}>
                <Text
                  style={[
                    styles.jobButtonTitle,
                    { color: selectedJobId === job.ID ? '#fffaf5' : palette.text },
                  ]}>
                  {job.Title}
                </Text>
                <Text
                  numberOfLines={2}
                  style={[
                    styles.jobButtonCopy,
                    { color: selectedJobId === job.ID ? '#fff3ea' : isDark ? '#d6c1b5' : '#7a6152' },
                  ]}>
                  {selectedApplications.length} application(s), {uploadedApplications.length} ready for validation
                </Text>
              </Pressable>
            ))
          )}
        </View>

        <Pressable
          onPress={validateCertifications}
          disabled={validating || !selectedJob}
          style={[styles.primaryButton, (validating || !selectedJob) && styles.disabledButton]}>
          <Text style={styles.primaryButtonText}>
            {validating ? 'Validating...' : 'Validate Certifications'}
          </Text>
        </Pressable>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="verified-user" size={20} color="#ff7a29" />
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Authentication results</Text>
        </View>

        {entries.length === 0 ? (
          <Text style={[styles.emptyLine, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
            Run validation to view certification results for uploaded resumes.
          </Text>
        ) : (
          entries.map((entry) => (
            <View key={entry.applicationId} style={[styles.resultCard, { backgroundColor: isDark ? '#2d221b' : '#fff8f3' }]}>
              <Text style={[styles.candidateTitle, { color: palette.text }]}>Candidate {entry.candidateId}</Text>
              <Text style={[styles.metaText, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
                Application ID: {entry.applicationId}
              </Text>

              {entry.certifications.length === 0 ? (
                <Text style={[styles.emptyLine, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
                  No certifications detected in this resume.
                </Text>
              ) : (
                entry.certifications.map((certification) => (
                  <View
                    key={`${entry.applicationId}-${certification.certification}`}
                    style={[styles.certCard, { backgroundColor: isDark ? '#201914' : '#ffffff' }]}>
                    <View style={styles.certHeader}>
                      <Text style={[styles.certLabel, { color: isDark ? '#ffd5bb' : '#a0541c' }]}>
                        Detected certification
                      </Text>
                      <Text style={[styles.certTitle, { color: palette.text }]}>{certification.certification}</Text>
                      <View style={[styles.verdictPill, { backgroundColor: getVerdictColor(certification.verdict) + '22' }]}>
                        <Text style={[styles.verdictText, { color: getVerdictColor(certification.verdict) }]}>
                          {certification.verdict}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.checkGrid}>
                      <AuthCheck
                        label="Provider"
                        value={certification.provider_trusted ? 'Trusted' : 'Unknown'}
                        passed={certification.provider_trusted}
                        dark={isDark}
                      />
                      <AuthCheck
                        label="Credential ID"
                        value={certification.has_credential_id ? 'Found' : 'Missing'}
                        passed={certification.has_credential_id}
                        dark={isDark}
                      />
                      <AuthCheck
                        label="Link"
                        value={certification.link_valid ? 'Reachable' : 'Not verified'}
                        passed={certification.link_valid}
                        dark={isDark}
                      />
                      <AuthCheck
                        label="Candidate proof"
                        value={certification.verification_link ? 'Present' : 'Missing'}
                        passed={Boolean(certification.verification_link)}
                        dark={isDark}
                      />
                    </View>
                    <View style={[styles.confidenceCard, { backgroundColor: isDark ? '#2b211d' : '#fff8f3' }]}>
                      <Text style={[styles.confidenceLabel, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
                        Verification confidence
                      </Text>
                      <Text style={[styles.confidenceValue, { color: getVerdictColor(certification.verdict) }]}>
                        {certification.score}/100
                      </Text>
                      <Text style={[styles.explanationText, { color: isDark ? '#e8d5c8' : '#6f5546' }]}>
                        {getCertificationExplanation(certification)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          ))
        )}
      </View>

      <Pressable
        onPress={handleLogout}
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

function getVerdictColor(verdict: string) {
  if (verdict === 'Likely Valid') {
    return '#2f9e44';
  }

  if (verdict === 'Uncertain') {
    return '#f08c00';
  }

  return '#d9480f';
}

function getCertificationExplanation(certification: CertificationResult) {
  if (certification.verdict === 'Likely Valid') {
    return 'Trusted provider, credential ID, and candidate-specific verification evidence were found.';
  }

  if (certification.verdict === 'Uncertain') {
    return 'Some evidence was found, but candidate-specific verification is incomplete.';
  }

  return 'The resume did not provide enough trusted evidence to verify this certification.';
}

function AuthCheck({
  label,
  value,
  passed,
  dark,
}: {
  label: string;
  value: string;
  passed: boolean;
  dark: boolean;
}) {
  return (
    <View style={[styles.checkItem, { backgroundColor: dark ? '#2b211d' : '#fff8f3' }]}>
      <MaterialIcons
        name={passed ? 'check-circle' : 'error-outline'}
        size={17}
        color={passed ? '#2f9e44' : '#d9480f'}
      />
      <Text style={[styles.checkLabel, { color: dark ? '#d6c1b5' : '#7a6152' }]}>{label}</Text>
      <Text style={[styles.checkValue, { color: passed ? '#2f9e44' : '#d9480f' }]}>{value}</Text>
    </View>
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
  card: {
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  jobList: {
    gap: 10,
  },
  jobButton: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  jobButtonTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  jobButtonCopy: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#ff7a29',
  },
  disabledButton: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: '#fffaf5',
    fontSize: 15,
    fontWeight: '900',
  },
  errorText: {
    color: '#d9480f',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyLine: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },
  resultCard: {
    borderRadius: 22,
    padding: 16,
    gap: 12,
  },
  candidateTitle: {
    fontSize: 20,
    fontFamily: Fonts.serif,
    fontWeight: '900',
  },
  metaText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  certCard: {
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  certHeader: {
    gap: 8,
  },
  certLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  certTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: Fonts.serif,
    fontWeight: '900',
  },
  verdictPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  verdictText: {
    fontSize: 12,
    fontWeight: '900',
  },
  checkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  checkItem: {
    width: '47%',
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  checkLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  checkValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  confidenceCard: {
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  confidenceLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  confidenceValue: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
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
