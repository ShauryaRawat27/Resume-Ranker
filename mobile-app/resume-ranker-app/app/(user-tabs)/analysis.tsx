import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useState } from 'react';
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
  sections_detected?: string[];
  feedback?: string;
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

function parseFeedbackSections(feedback: string) {
  const normalized = feedback.replace(/\r/g, '').trim();
  const lines = normalized.split('\n').map((line) => line.trim()).filter(Boolean);
  const sections: { title: string; points: string[] }[] = [];

  lines.forEach((line) => {
    const cleaned = line.replace(/^#+\s*/, '').replace(/^\*\*(.*)\*\*$/, '$1').trim();
    const headingMatch = cleaned.match(/^-?\s*(Overall Summary|Key Gaps|Skills Analysis|Resume Improvements|ATS Optimization Tips)\s*:?\s*$/i);

    if (headingMatch) {
      sections.push({ title: headingMatch[1], points: [] });
      return;
    }

    const point = cleaned.replace(/^[-•*]\s*/, '').trim();

    if (!sections.length) {
      sections.push({ title: 'Recruiter Notes', points: [] });
    }

    if (point) {
      sections[sections.length - 1].points.push(point);
    }
  });

  return sections.length ? sections : [{ title: 'Recruiter Notes', points: [feedback] }];
}

export default function AnalysisScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const palette = Colors[scheme];

  const [resumePdf, setResumePdf] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [error, setError] = useState('');

  const selectedJob = jobs.find((job) => job.ID === selectedJobId);

  const loadJobs = useCallback(async () => {
    try {
      setLoadingJobs(true);

      const token = await AsyncStorage.getItem('token');

      if (!token) {
        setError('No token found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const raw = await response.text();

      console.log('Analysis jobs status:', response.status);
      console.log('Analysis jobs response:', raw);

      if (!response.ok) {
        setError('Failed to load jobs');
        return;
      }

      const data = (JSON.parse(raw) ?? []) as BackendJob[];
      setJobs(data);

      if (!selectedJobId && data.length > 0) {
        setSelectedJobId(data[0].ID);
      }
    } catch (jobsError) {
      console.log('Analysis jobs error:', jobsError);
      setError('Failed to load jobs');
    } finally {
      setLoadingJobs(false);
    }
  }, [selectedJobId]);

  useFocusEffect(
    useCallback(() => {
      void loadJobs();
    }, [loadJobs])
  );

  const pickResumePdf = async () => {
    const pickerResult = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (pickerResult.canceled) {
      return;
    }

    setResumePdf(pickerResult.assets[0] ?? null);
    setResult(null);
    setError('');
  };

  const handleAnalyze = async () => {
    if (!resumePdf) {
      setError('Resume PDF is required');
      return;
    }

    if (!selectedJob) {
      setError('Please select a job to analyze against');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);

      const formData = new FormData();
      formData.append('resume_pdf', {
        uri: resumePdf.uri,
        name: resumePdf.name || 'resume.pdf',
        type: resumePdf.mimeType || 'application/pdf',
      } as unknown as Blob);
      formData.append('job_description', selectedJob.Description.trim());
      formData.append('skills', JSON.stringify(MASTER_SKILL_SET));

      const response = await fetch(`${NLP_BASE_URL}/rank-pdf`, {
        method: 'POST',
        body: formData,
      });

      const raw = await response.text();

      console.log('NLP status:', response.status);
      console.log('NLP response:', raw);

      if (!response.ok) {
        setError('Failed to analyze resume');
        return;
      }

      const data = JSON.parse(raw) as AnalysisResult;
      setResult(data);
    } catch (analysisError) {
      console.log('NLP error:', analysisError);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setResumePdf(null);
    setSelectedJobId(jobs[0]?.ID ?? '');
    setResult(null);
    setError('');
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}>
      {!result ? (
        <>
          <View style={[styles.hero, { backgroundColor: isDark ? '#31231b' : '#fff1e5' }]}>
            <Text style={[styles.kicker, { color: isDark ? '#ffd5bb' : '#a0541c' }]}>Candidate tools</Text>
            <Text style={[styles.title, { color: palette.text }]}>Analyze your resume against a job.</Text>
            <Text style={[styles.subtitle, { color: isDark ? '#dcc7ba' : '#765c4d' }]}>
              Choose a role, upload your resume PDF, and see your score plus improvement scope.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
            <View style={styles.section}>
              <Text style={[styles.label, { color: palette.text }]}>Resume PDF</Text>
              <Pressable
                onPress={pickResumePdf}
                style={[
                  styles.filePicker,
                  {
                    backgroundColor: isDark ? '#332720' : '#fff5ee',
                    borderColor: isDark ? '#4a392f' : '#f1ddd0',
                  },
                ]}>
                <MaterialIcons name="upload-file" size={20} color="#ff7a29" />
                <Text style={[styles.filePickerText, { color: palette.text }]}>
                  {resumePdf ? resumePdf.name : 'Choose resume PDF'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: palette.text }]}>Choose job to compare against</Text>
              {loadingJobs ? (
                <Text style={[styles.emptyLine, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>Loading jobs...</Text>
              ) : jobs.length === 0 ? (
                <Text style={[styles.emptyLine, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
                  No jobs available yet. Ask a recruiter account to create one first.
                </Text>
              ) : (
                <View style={styles.jobOptions}>
                  {jobs.map((job) => {
                    const isSelected = selectedJobId === job.ID;

                    return (
                      <Pressable
                        key={job.ID}
                        onPress={() => {
                          setSelectedJobId(job.ID);
                          setResult(null);
                          setError('');
                        }}
                        style={[
                          styles.jobOption,
                          {
                            backgroundColor: isSelected
                              ? isDark
                                ? '#3d2a1f'
                                : '#fff1e5'
                              : isDark
                                ? '#332720'
                                : '#fff5ee',
                            borderColor: isSelected ? '#ff7a29' : isDark ? '#4a392f' : '#f1ddd0',
                          },
                        ]}>
                        <View style={styles.jobOptionHeader}>
                          <Text style={[styles.jobOptionTitle, { color: palette.text }]}>{job.Title}</Text>
                          <MaterialIcons
                            name={isSelected ? 'radio-button-checked' : 'radio-button-unchecked'}
                            size={20}
                            color={isSelected ? '#ff7a29' : isDark ? '#cfb8ab' : '#8e6e5b'}
                          />
                        </View>
                        <Text
                          numberOfLines={3}
                          style={[styles.jobOptionDescription, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
                          {job.Description}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={[styles.tipCard, { backgroundColor: isDark ? '#2d221b' : '#fff8f3' }]}>
              <View style={styles.tipHeader}>
                <MaterialIcons name="auto-awesome" size={18} color="#ff7a29" />
                <Text style={[styles.tipTitle, { color: palette.text }]}>Current setup</Text>
              </View>
              <Text style={[styles.tipCopy, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
                We use the selected job description from the backend, extract text from your PDF, then run multilingual scoring and OpenRouter feedback.
              </Text>
            </View>

            <Pressable
              onPress={handleAnalyze}
              disabled={loading || loadingJobs || !selectedJob}
              style={[styles.primaryButton, (loading || loadingJobs || !selectedJob) && styles.disabledButton]}>
              <Text style={styles.primaryButtonText}>
                {loading ? 'Analyzing...' : 'Analyze Resume'}
              </Text>
            </Pressable>

            {error ? (
              <Text style={[styles.errorText, { color: '#d9480f' }]}>{error}</Text>
            ) : null}
          </View>
        </>
      ) : null}

      {result ? (
        <View style={[styles.card, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
          <View style={styles.resultHeader}>
            <View style={styles.resultTitleBlock}>
              <Text style={[styles.resultTitle, { color: palette.text }]}>Analysis Result</Text>
              {selectedJob ? (
                <Text style={[styles.resultSubtitle, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
                  Compared against {selectedJob.Title}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={resetAnalysis}
              style={[styles.secondaryButton, { borderColor: isDark ? '#7c5a47' : '#e9c8b1' }]}>
              <Text style={[styles.secondaryButtonText, { color: palette.text }]}>Analyze another</Text>
            </Pressable>
          </View>

          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { backgroundColor: isDark ? '#2d221b' : '#fff8f3' }]}>
              <Text style={[styles.metricLabel, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>Final score</Text>
              <Text style={[styles.metricValue, { color: palette.text }]}>{result.final_score}</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: isDark ? '#2d221b' : '#fff8f3' }]}>
              <Text style={[styles.metricLabel, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>Skill match</Text>
              <Text style={[styles.metricValue, { color: palette.text }]}>{result.skill_match}</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: isDark ? '#2d221b' : '#fff8f3' }]}>
              <Text style={[styles.metricLabel, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>Semantic</Text>
              <Text style={[styles.metricValue, { color: palette.text }]}>{result.semantic_score}</Text>
            </View>
          </View>

          <View style={styles.resultSection}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="check-circle" size={18} color="#2f9e44" />
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Matched skills</Text>
            </View>
            <View style={styles.chipWrap}>
              {result.matched_skills.length > 0 ? (
                result.matched_skills.map((skill) => (
                  <View
                    key={skill}
                    style={[styles.chip, { backgroundColor: isDark ? '#2f362b' : '#edf9ee' }]}>
                    <Text style={[styles.chipText, { color: palette.text }]}>{skill}</Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyLine, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
                  No matched skills found yet.
                </Text>
              )}
            </View>
          </View>

          <View style={styles.resultSection}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="warning-amber" size={18} color="#d9480f" />
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Missing skills</Text>
            </View>
            <View style={styles.chipWrap}>
              {result.missing_skills.length > 0 ? (
                result.missing_skills.map((skill) => (
                  <View
                    key={skill}
                    style={[styles.chip, { backgroundColor: isDark ? '#3d2921' : '#fff1e5' }]}>
                    <Text style={[styles.chipText, { color: palette.text }]}>{skill}</Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyLine, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
                  No obvious missing skills were found.
                </Text>
              )}
            </View>
          </View>

          {result.sections_detected?.length ? (
            <View style={styles.resultSection}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="segment" size={18} color="#ff7a29" />
                <Text style={[styles.sectionTitle, { color: palette.text }]}>Detected sections</Text>
              </View>
              <View style={styles.chipWrap}>
                {result.sections_detected.map((section) => (
                  <View
                    key={section}
                    style={[styles.chip, { backgroundColor: isDark ? '#3d2921' : '#fff1e5' }]}>
                    <Text style={[styles.chipText, { color: palette.text }]}>{section}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {result.feedback ? (
            <View style={styles.resultSection}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="tips-and-updates" size={18} color="#ff7a29" />
                <Text style={[styles.sectionTitle, { color: palette.text }]}>LLM feedback</Text>
              </View>
              {parseFeedbackSections(result.feedback).map((section) => (
                <View
                  key={section.title}
                  style={[styles.feedbackCard, { backgroundColor: isDark ? '#2d221b' : '#fff8f3' }]}>
                  <Text style={[styles.feedbackTitle, { color: palette.text }]}>{section.title}</Text>
                  {section.points.map((point, index) => (
                    <View key={`${section.title}-${index}`} style={styles.feedbackPointRow}>
                      <View style={styles.feedbackDot} />
                      <Text style={[styles.feedbackPoint, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
                        {point}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
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
  textArea: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 160,
    fontSize: 15,
  },
  filePicker: {
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filePickerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  jobOptions: {
    gap: 10,
  },
  jobOption: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  jobOptionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  jobOptionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  jobOptionDescription: {
    fontSize: 13,
    lineHeight: 20,
  },
  tipCard: {
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  tipCopy: {
    fontSize: 14,
    lineHeight: 22,
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
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  resultTitleBlock: {
    gap: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  resultHeader: {
    gap: 12,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  metricsRow: {
    gap: 12,
  },
  metricCard: {
    borderRadius: 18,
    padding: 16,
    gap: 6,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  resultSection: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyLine: {
    fontSize: 14,
    lineHeight: 22,
  },
  feedbackCard: {
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  feedbackTitle: {
    fontSize: 17,
    fontFamily: Fonts.serif,
    fontWeight: '900',
  },
  feedbackPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  feedbackDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#ff7a29',
    marginTop: 7,
  },
  feedbackPoint: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },
});
