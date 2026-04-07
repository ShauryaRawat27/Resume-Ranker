import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { API_BASE_URL, NLP_BASE_URL } from '@/lib/api';
import { MASTER_SKILL_SET } from '@/lib/skills';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type AnalysisResult = {
  skill_match: number;
  semantic_score: number;
  final_score: number;
  matched_skills: string[];
  missing_skills: string[];
};

type LeaderboardEntry = AnalysisResult & {
  candidateName: string;
  applicationID: string;
};

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

export default function RecruiterLeaderboardScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const palette = Colors[scheme];

  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [applications, setApplications] = useState<BackendApplication[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState(false);
  const [error, setError] = useState('');

  const loadLeaderboardData = async () => {
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

      console.log('Leaderboard jobs status:', jobsResponse.status);
      console.log('Leaderboard jobs response:', jobsRaw);
      console.log('Leaderboard applications status:', applicationsResponse.status);
      console.log('Leaderboard applications response:', applicationsRaw);

      if (!jobsResponse.ok || !applicationsResponse.ok) {
        setError('Failed to load leaderboard data');
        return;
      }

      const jobsData = (JSON.parse(jobsRaw) ?? []) as BackendJob[];
      const applicationsData = (JSON.parse(applicationsRaw) ?? []) as BackendApplication[];

      setJobs(jobsData);
      setApplications(applicationsData);
    } catch (loadError) {
      console.log('Leaderboard load error:', loadError);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboardData();
  }, []);

  const selectedJob = jobs.find((job) => job.ID === selectedJobId);
  const selectedApplications = applications.filter((application) => application.JobID === selectedJobId);

  const generateLeaderboard = async () => {
    if (!selectedJob) {
      setError('Please select a job');
      return;
    }

    try {
      setRanking(true);
      setError('');
      setEntries([]);

      const candidatesForJob = selectedApplications.filter(
        (application) =>
          application.Status === 'resume_uploaded' &&
          application.ResumeText &&
          application.ResumeText.trim()
      );

      if (candidatesForJob.length === 0) {
        setError('No uploaded resumes with extracted text found for this job');
        return;
      }

      const results = await Promise.all(
        candidatesForJob.map(async (application) => {
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

          console.log('Recruiter NLP status:', response.status);
          console.log('Recruiter NLP response:', raw);

          if (!response.ok) {
            throw new Error(`NLP failed for ${application.CandidateID}: ${raw}`);
          }

          const data = JSON.parse(raw) as AnalysisResult;

          return {
            candidateName: application.CandidateID,
            applicationID: application.ID,
            ...data,
          };
        })
      );

      setEntries(results.sort((a, b) => b.final_score - a.final_score));
    } catch (rankError) {
      console.log('Generate leaderboard error:', rankError);
      setError('Failed to generate leaderboard');
    } finally {
      setRanking(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.stateScreen, { backgroundColor: palette.background }]}>
        <Text style={[styles.stateText, { color: palette.text }]}>Loading leaderboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: isDark ? '#31231b' : '#fff1e5' }]}>
        <Text style={[styles.kicker, { color: isDark ? '#ffd5bb' : '#a0541c' }]}>Recruiter tools</Text>
        <Text style={[styles.title, { color: palette.text }]}>Candidate leaderboard</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#dcc7ba' : '#765c4d' }]}>
          Select one of your jobs and generate a ranked shortlist from uploaded resumes.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
        <View style={styles.leaderboardHeader}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Choose a job</Text>
          <Text style={[styles.helper, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
            Ranking uses the selected job description for all candidates.
          </Text>
        </View>

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
                  style={[
                    styles.jobButtonCopy,
                    { color: selectedJobId === job.ID ? '#fff3ea' : isDark ? '#d6c1b5' : '#7a6152' },
                  ]}>
                  {job.Description}
                </Text>
              </Pressable>
            ))
          )}
        </View>

        <Pressable
          onPress={generateLeaderboard}
          disabled={ranking || !selectedJobId}
          style={[styles.primaryButton, (ranking || !selectedJobId) && styles.disabledButton]}>
          <Text style={styles.primaryButtonText}>
            {ranking ? 'Generating...' : 'Generate Leaderboard'}
          </Text>
        </Pressable>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        {selectedJob ? (
          <View style={[styles.selectedJobCard, { backgroundColor: isDark ? '#2d221b' : '#fff8f3' }]}>
            <Text style={[styles.metaLabel, { color: palette.text }]}>Selected job</Text>
            <Text style={[styles.selectedJobTitle, { color: palette.text }]}>{selectedJob.Title}</Text>
            <Text style={[styles.metaText, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
              {selectedApplications.length} application(s) found
            </Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
        <View style={styles.leaderboardHeader}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Leaderboard</Text>
          <Text style={[styles.helper, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
            Highest final score ranks first.
          </Text>
        </View>

        {entries.length === 0 ? (
          <Text style={[styles.emptyLine, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
            {selectedJobId
              ? 'Generate the leaderboard to rank candidates for this job.'
              : 'Select a job above to build the leaderboard.'}
          </Text>
        ) : (
          entries.map((entry, index) => (
            <View
              key={`${entry.candidateName}-${index}`}
              style={[styles.entryCard, { backgroundColor: isDark ? '#2d221b' : '#fff8f3' }]}>
              <View style={styles.entryHeader}>
                <View style={styles.entryCopy}>
                  <Text style={[styles.rankText, { color: isDark ? '#ffd5bb' : '#a0541c' }]}>
                    #{index + 1}
                  </Text>
                  <Text style={[styles.candidateName, { color: palette.text }]}>
                    {entry.candidateName}
                  </Text>
                </View>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>{entry.final_score}</Text>
                </View>
              </View>

              <Text style={[styles.metaText, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
                Skill match: {entry.skill_match} | Semantic: {entry.semantic_score}
              </Text>

              <Text style={[styles.metaText, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
                Application ID: {entry.applicationID}
              </Text>

              <Text style={[styles.metaLabel, { color: palette.text }]}>Matched skills</Text>
              <Text style={[styles.metaText, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
                {entry.matched_skills.length > 0 ? entry.matched_skills.join(', ') : 'No matched skills'}
              </Text>

              <Text style={[styles.metaLabel, { color: palette.text }]}>Missing skills</Text>
              <Text style={[styles.metaText, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
                {entry.missing_skills.length > 0 ? entry.missing_skills.join(', ') : 'No missing skills'}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 56,
    gap: 18,
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
    gap: 18,
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
  },
  jobList: {
    gap: 10,
  },
  jobButton: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 6,
  },
  jobButtonTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  jobButtonCopy: {
    fontSize: 14,
    lineHeight: 21,
  },
  primaryButton: {
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#ff7a29',
  },
  disabledButton: {
    opacity: 0.75,
  },
  primaryButtonText: {
    color: '#fffaf5',
    fontSize: 15,
    fontWeight: '800',
  },
  errorText: {
    color: '#d9480f',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  leaderboardHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  helper: {
    fontSize: 14,
    lineHeight: 21,
  },
  emptyLine: {
    fontSize: 14,
    lineHeight: 22,
  },
  selectedJobCard: {
    borderRadius: 18,
    padding: 16,
    gap: 6,
  },
  selectedJobTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  entryCard: {
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  entryCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '900',
  },
  candidateName: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  scoreBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(47, 158, 68, 0.16)',
  },
  scoreText: {
    color: '#2f9e44',
    fontSize: 16,
    fontWeight: '900',
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  metaText: {
    fontSize: 14,
    lineHeight: 21,
  },
});
