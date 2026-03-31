import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { NLP_BASE_URL } from '@/lib/api';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const MASTER_SKILL_SET = [
  'python',
  'java',
  'c',
  'c++',
  'c#',
  'javascript',
  'typescript',
  'go',
  'golang',
  'rust',
  'ruby',
  'php',
  'kotlin',
  'swift',
  'r',
  'matlab',
  'scala',
  'perl',
  'bash',
  'machine learning',
  'deep learning',
  'artificial intelligence',
  'data science',
  'data analysis',
  'statistical analysis',
  'supervised learning',
  'unsupervised learning',
  'reinforcement learning',
  'feature engineering',
  'model evaluation',
  'hyperparameter tuning',
  'natural language processing',
  'nlp',
  'text classification',
  'sentiment analysis',
  'named entity recognition',
  'transformers',
  'bert',
  'gpt',
  'large language models',
  'llm',
  'prompt engineering',
  'rag',
  'information retrieval',
  'semantic search',
  'computer vision',
  'image processing',
  'object detection',
  'image classification',
  'segmentation',
  'opencv',
  'mediapipe',
  'yolo',
  'yolov8',
  'pose estimation',
  'optical flow',
  'feature extraction',
  'tensorflow',
  'keras',
  'pytorch',
  'scikit-learn',
  'xgboost',
  'lightgbm',
  'catboost',
  'hugging face',
  'transformers library',
  'numpy',
  'pandas',
  'scipy',
  'matplotlib',
  'seaborn',
  'plotly',
  'cufflinks',
  'statsmodels',
  'sql',
  'mysql',
  'postgresql',
  'sqlite',
  'mongodb',
  'dynamodb',
  'redis',
  'cassandra',
  'elasticsearch',
  'aws',
  'ec2',
  's3',
  'lambda',
  'ecs',
  'eks',
  'gcp',
  'azure',
  'docker',
  'kubernetes',
  'terraform',
  'ci/cd',
  'github actions',
  'jenkins',
  'rest api',
  'graphql',
  'fastapi',
  'flask',
  'django',
  'gin',
  'fiber',
  'node.js',
  'express',
  'microservices',
  'react',
  'next.js',
  'vue',
  'angular',
  'react native',
  'flutter',
  'html',
  'css',
  'tailwind css',
  'bootstrap',
  'data structures',
  'algorithms',
  'object oriented programming',
  'oop',
  'system design',
  'design patterns',
  'operating systems',
  'computer networks',
  'dbms',
  'software engineering',
  'git',
  'github',
  'gitlab',
  'linux',
  'unix',
  'jupyter',
  'notebook',
  'hugging face spaces',
  'gradio',
  'streamlit',
];

type AnalysisResult = {
  skill_match: number;
  semantic_score: number;
  final_score: number;
  matched_skills: string[];
  missing_skills: string[];
};

export default function AnalysisScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const palette = Colors[scheme];

  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      setError('Resume text is required');
      return;
    }

    if (!jobDescription.trim()) {
      setError('Job description is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);

      const response = await fetch(`${NLP_BASE_URL}/rank`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume_text: resumeText.trim(),
          job_description: jobDescription.trim(),
          skills: MASTER_SKILL_SET,
        }),
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

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: isDark ? '#31231b' : '#fff1e5' }]}>
        <Text style={[styles.kicker, { color: isDark ? '#ffd5bb' : '#a0541c' }]}>Candidate tools</Text>
        <Text style={[styles.title, { color: palette.text }]}>Analyze your resume against a job.</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#dcc7ba' : '#765c4d' }]}>
          Paste resume text and a job description to get a quick fit score, matched skills, and gaps to improve.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
        <View style={styles.section}>
          <Text style={[styles.label, { color: palette.text }]}>Resume text</Text>
          <TextInput
            value={resumeText}
            onChangeText={setResumeText}
            placeholder="Paste your resume text here..."
            placeholderTextColor={isDark ? '#a69082' : '#9f8373'}
            multiline
            textAlignVertical="top"
            style={[
              styles.textArea,
              {
                backgroundColor: isDark ? '#332720' : '#fff5ee',
                color: palette.text,
                borderColor: isDark ? '#4a392f' : '#f1ddd0',
              },
            ]}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: palette.text }]}>Job description</Text>
          <TextInput
            value={jobDescription}
            onChangeText={setJobDescription}
            placeholder="Paste the job description here..."
            placeholderTextColor={isDark ? '#a69082' : '#9f8373'}
            multiline
            textAlignVertical="top"
            style={[
              styles.textArea,
              {
                backgroundColor: isDark ? '#332720' : '#fff5ee',
                color: palette.text,
                borderColor: isDark ? '#4a392f' : '#f1ddd0',
              },
            ]}
          />
        </View>

        <View style={[styles.tipCard, { backgroundColor: isDark ? '#2d221b' : '#fff8f3' }]}>
          <View style={styles.tipHeader}>
            <MaterialIcons name="auto-awesome" size={18} color="#ff7a29" />
            <Text style={[styles.tipTitle, { color: palette.text }]}>Current setup</Text>
          </View>
          <Text style={[styles.tipCopy, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
            This test flow uses pasted resume text for now. Later, the same input can come from extracted PDF text after upload.
          </Text>
        </View>

        <Pressable
          onPress={handleAnalyze}
          disabled={loading}
          style={[styles.primaryButton, loading && styles.disabledButton]}>
          <Text style={styles.primaryButtonText}>
            {loading ? 'Analyzing...' : 'Analyze Resume'}
          </Text>
        </Pressable>

        {error ? (
          <Text style={[styles.errorText, { color: '#d9480f' }]}>{error}</Text>
        ) : null}
      </View>

      {result ? (
        <View style={[styles.card, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
          <Text style={[styles.resultTitle, { color: palette.text }]}>Analysis Result</Text>

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
});
