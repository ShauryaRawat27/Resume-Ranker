import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/lib/api';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as DocumentPicker from 'expo-document-picker';



type BackendJob = {
  ID: string;
  Title: string;
  Description: string;
  RecruiterID: string;
  Status: string;
  Deadline: string;
  CreatedAt: string;
};

type BackendApplication = {
  ID: string;
  JobID: string;
  CandidateID: string;
  AppliedAt: string;
  ResumeUrl?: string;
  Status: string;
};

export default function MatchesScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const palette = Colors[scheme];
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [applicationStatusByJobId, setApplicationStatusByJobId] = useState<Record<string, string>>({});
  const [submittingJobId, setSubmittingJobId] = useState<string | null>(null);
  const [applicationIdByJobId, setApplicationIdByJobId] = useState<Record<string, string>>({});
  const [uploadingJobId, setUploadingJobId] = useState<string | null>(null);


  const loadApplications = async (token: string, savedRole: string | null) => {
    if (savedRole !== 'candidate') {
      setAppliedJobIds([]);
      setApplicationIdByJobId({});
      setApplicationStatusByJobId({});
      return;
    }

    const response = await fetch(`${API_BASE_URL}/applications`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const raw = await response.text();

    console.log('Applications status:', response.status);
    console.log('Applications response:', raw);

    if (!response.ok) {
      return;
    }

    const data = (JSON.parse(raw) ?? []) as BackendApplication[];
    setAppliedJobIds(data.map((application) => application.JobID));
    setApplicationIdByJobId(
      Object.fromEntries(data.map((application) => [application.JobID, application.ID]))
    );
    setApplicationStatusByJobId(
      Object.fromEntries(data.map((application) => [application.JobID, application.Status]))
    );
  };

  const loadJobs = async () => {
    try{
      setLoading(true);
      setError('');

      const token = await AsyncStorage.getItem('token');
      const savedRole = await AsyncStorage.getItem('role');
      setRole(savedRole);

      if(!token){
        setError('NO TOKEN FOUNDD');
        return;
      }

     const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const raw = await response.text();

    console.log('Jobs status:', response.status);
    console.log('Jobs response:', raw);

    if (!response.ok) {
      setError('Failed to fetch jobs');
      return;
    }

    const data = JSON.parse(raw);
    setJobs(data);
    await loadApplications(token, savedRole);
  } catch (err) {
    console.log('Jobs error:', err);
    setError('Something went wrong');
  } finally {
    setLoading(false);
  }
  };

  useEffect(() => {
    loadJobs();
  },[]);

    if (loading) {
    return (
      <View>
        <Text>Loading jobs...</Text>
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

 const applyToJob = async (jobId: string) => {
  try {
    const token = await AsyncStorage.getItem('token');

    if (!token) {
      console.log('No token found');
      return;
    }

    if (appliedJobIds.includes(jobId)) {
      return;
    }

    setSubmittingJobId(jobId);

    const response = await fetch(`${API_BASE_URL}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        job_id: jobId,
      }),
    });

    const raw = await response.text();

    console.log('Apply status:', response.status);
    console.log('Apply response:', raw);

    if (!response.ok) {
      if (raw.includes('applications_job_id_candidate_id_key')) {
        setAppliedJobIds((current) => (current.includes(jobId) ? current : [...current, jobId]));
        setApplicationStatusByJobId((current) => ({
          ...current,
          [jobId]: current[jobId] ?? 'resume_pending',
        }));
      }
      console.log('Apply failed');
      return;
    }

    setAppliedJobIds((current) => (current.includes(jobId) ? current : [...current, jobId]));
    setApplicationStatusByJobId((current) => ({
      ...current,
      [jobId]: 'resume_pending',
    }));
    console.log('Applied successfully');
  } catch (error) {
    console.log('Apply error:', error);
  } finally {
    setSubmittingJobId(null);
  }
};

const pickResumeAndUpload = async (jobId: string) => {
  try {
    const applicationId = applicationIdByJobId[jobId];

    if (!applicationId) {
      console.log('No application ID found for this job');
      return;
    }

    const token = await AsyncStorage.getItem('token');

    if (!token) {
      console.log('No token found');
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) {
      return;
    }

    const file = result.assets[0];

    if (!file) {
      console.log('No file selected');
      return;
    }

    setUploadingJobId(jobId);

    const presignResponse = await fetch(
      `${API_BASE_URL}/applications/${applicationId}/resume/presign`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const presignRaw = await presignResponse.text();

    console.log('Presign status:', presignResponse.status);
    console.log('Presign response:', presignRaw);

    if (!presignResponse.ok) {
      console.log('Presign failed');
      return;
    }

    const presignData = JSON.parse(presignRaw);

    const uploadUrl = presignData.upload_url;

    if (!uploadUrl) {
      console.log('No upload URL returned');
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

    const uploadText = await uploadResponse.text();

    console.log('Upload status:', uploadResponse.status);
    console.log('Upload response:', uploadText);

    if (!uploadResponse.ok) {
      console.log('S3 upload failed');
      return;
    }

    const confirmResponse = await fetch(
      `${API_BASE_URL}/applications/${applicationId}/resume/confirm`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const confirmRaw = await confirmResponse.text();

    console.log('Confirm status:', confirmResponse.status);
    console.log('Confirm response:', confirmRaw);

    if (!confirmResponse.ok) {
      console.log('Confirm failed');
      return;
    }

    setApplicationStatusByJobId((current) => ({
      ...current,
      [jobId]: 'resume_uploaded',
    }));

    console.log('Resume uploaded successfully');

    await loadJobs();
  } catch (error) {
    console.log('Resume upload error:', error);
  } finally {
    setUploadingJobId(null);
  }
};



  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.text }]}>Jobs</Text>
        <Text style={[styles.helper, { color: isDark ? '#cfbcb0' : '#846b5d' }]}>
          Candidates see all jobs. Recruiters see only their own postings.
        </Text>
      </View>

      {jobs.map((job) => (
        (() => {
          const isApplied = appliedJobIds.includes(job.ID);
          const isSubmitting = submittingJobId === job.ID;
          const isUploading = uploadingJobId === job.ID;
          const showApplyButton = role === 'candidate';
          const applicationStatus = applicationStatusByJobId[job.ID];
          const showUploadButton = applicationStatus === 'resume_pending';
          const statusLabel =
            applicationStatus === 'resume_uploaded'
              ? 'Resume uploaded'
              : applicationStatus === 'resume_pending'
                ? 'Resume upload pending'
                : null;

          return (
        <View key={job.ID} style={[styles.jobCard, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
          <View style={styles.jobHeader}>
            <View style={styles.jobCopy}>
              <Text style={[styles.company, { color: isDark ? '#e8d5c8' : '#9a4d16' }]}>
                {job.Status}
              </Text>
              <Text style={[styles.role, { color: palette.text }]}>{job.Title}</Text>
            </View>
            <View
              style={[
                styles.scorePill,
                { backgroundColor: isDark ? '#3d2921' : '#fff1e5' },
              ]}>
              <Text style={[styles.scoreText, { color: '#d9480f' }]}>
                {new Date(job.Deadline).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.group}>
            <View style={styles.groupHeader}>
              <MaterialIcons name="description" size={18} color="#2f9e44" />
              <Text style={[styles.groupTitle, { color: palette.text }]}>Description</Text>
            </View>
            <Text style={[styles.bodyText, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
              {job.Description}
            </Text>
          </View>

          <View style={styles.group}>
            <View style={styles.groupHeader}>
              <MaterialIcons name="person-outline" size={18} color="#d9480f" />
              <Text style={[styles.groupTitle, { color: palette.text }]}>Recruiter ID</Text>
            </View>
            <Text style={[styles.bodyText, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
              {job.RecruiterID}
            </Text>
          </View>

          {showApplyButton ? (
            <View style={styles.actionBlock}>
              <Pressable
                disabled={isApplied || isSubmitting}
                onPress={() => applyToJob(job.ID)}
                style={[
                  styles.applyButton,
                  isApplied && styles.appliedButton,
                  isSubmitting && styles.pendingButton,
                ]}>
                <Text style={styles.applyButtonText}>
                  {isApplied ? 'Applied' : isSubmitting ? 'Applying...' : 'Apply'}
                </Text>
              </Pressable>
              {statusLabel ? (
                <Text style={[styles.applicationNote, { color: isApplied && applicationStatus === 'resume_uploaded' ? '#2f9e44' : isDark ? '#d6c1b5' : '#7a6152' }]}>
                  {statusLabel}
                </Text>
              ) : null}
              {showUploadButton ? (
                <Pressable
                  disabled={isUploading}
                  onPress={() => pickResumeAndUpload(job.ID)}
                  style={[styles.uploadButton, isUploading && styles.pendingButton]}>
                  <Text style={styles.uploadButtonText}>
                    {isUploading ? 'Uploading...' : 'Upload Resume'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
          );
        })()
      ))}
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
  jobCard: {
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  jobCopy: {
    flex: 1,
    gap: 4,
  },
  company: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  role: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  scorePill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '900',
  },
  group: {
    gap: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
  },
  actionBlock: {
    gap: 8,
  },
  applyButton: {
    marginTop: 8,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#ff7a29',
  },
  appliedButton: {
    backgroundColor: '#2f9e44',
  },
  pendingButton: {
    opacity: 0.75,
  },
  applyButtonText: {
    color: '#fffaf5',
    fontSize: 15,
    fontWeight: '800',
  },
  uploadButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#22577a',
  },
  uploadButtonText: {
    color: '#f4fbff',
    fontSize: 15,
    fontWeight: '800',
  },
  applicationNote: {
    fontSize: 13,
    fontWeight: '700',
  },
});
