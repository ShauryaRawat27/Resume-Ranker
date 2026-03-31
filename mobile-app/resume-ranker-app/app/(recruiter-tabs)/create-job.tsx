import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/lib/api';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';


export default function CreateJobScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const palette = Colors[scheme];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('open');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreateJob = async () => {
    if (!title.trim()) {
      setMessage("JOB TITLE IS REQUIRED!!!");
      return;
    }

    if (!description.trim()){
      setMessage("DESCRIPTION IS REQUIRED!!!");
      return;
    }

    if (!status.trim()){
      setMessage("STATUS IS REQUIRED!!!!");
      return;
    }

    if (!deadline.trim()){
      setMessage("DEADLINE IS REQUIRED!!!");
      return;
    }
try{
    setIsSubmitting(true);
    setMessage('');

    const token = await AsyncStorage.getItem('token');

    if (!token){
      setMessage("NO TOKEN FOUND!!!");
      setIsSubmitting(false);
      return;
    }

    const response = await fetch(`${API_BASE_URL}/jobs`,{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        status: status.trim(),
        deadline: deadline.trim()
      })
    })

    const raw = await response.text();

    console.log("CREATE JOB STATUS:",response.status);
    console.log("CREATE JOB RESPONSE:",raw);

    if(!response.ok){
      setMessage("FAILED TO CREATE JOB");
      setIsSubmitting(false);
      return
    }

    setMessage("JOB CREATED SUCCESSFULLY");
    setTitle('');
    setDescription('');
    setStatus('open');
    setDeadline('');
  }catch (error){
    console.log("CREATE JOB ERRPR:",error);
    setMessage("SOMETHING WENT WRONG");
  }finally{
    setIsSubmitting(false);
  }
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: isDark ? '#31231b' : '#fff1e5' }]}>
        <Text style={[styles.kicker, { color: isDark ? '#ffd5bb' : '#a0541c' }]}>Recruiter tools</Text>
        <Text style={[styles.title, { color: palette.text }]}>Create a new job opening.</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#dcc7ba' : '#765c4d' }]}>
          Add the role details here, then we&apos;ll wire the form to the backend submit flow next.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
        <View style={styles.section}>
          <Text style={[styles.label, { color: palette.text }]}>Job title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Senior Frontend Engineer"
            placeholderTextColor={isDark ? '#a69082' : '#9f8373'}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#332720' : '#fff5ee',
                color: palette.text,
                borderColor: isDark ? '#4a392f' : '#f1ddd0',
              },
            ]}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: palette.text }]}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Write a short overview of the role, responsibilities, and stack."
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
          <Text style={[styles.label, { color: palette.text }]}>Status</Text>
          <TextInput
            value={status}
            onChangeText={setStatus}
            placeholder="open"
            placeholderTextColor={isDark ? '#a69082' : '#9f8373'}
            autoCapitalize="none"
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#332720' : '#fff5ee',
                color: palette.text,
                borderColor: isDark ? '#4a392f' : '#f1ddd0',
              },
            ]}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: palette.text }]}>Deadline</Text>
          <TextInput
            value={deadline}
            onChangeText={setDeadline}
            placeholder="2026-12-31T00:00:00Z"
            placeholderTextColor={isDark ? '#a69082' : '#9f8373'}
            autoCapitalize="none"
            style={[
              styles.input,
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
            <MaterialIcons name="tips-and-updates" size={18} color="#ff7a29" />
            <Text style={[styles.tipTitle, { color: palette.text }]}>Testing tip</Text>
          </View>
          <Text style={[styles.tipCopy, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
            Use an ISO date like `2026-12-31T00:00:00Z` for the deadline so it matches the backend format.
          </Text>
        </View>

        <Pressable
          onPress={handleCreateJob}
          disabled={isSubmitting}
          style={[styles.primaryButton, isSubmitting && styles.disabledButton]}>
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? 'Creating...' : 'Create Job'}
          </Text>
        </Pressable>

        {message ? (
          <Text style={[styles.messageText, { color: palette.text }]}>{message}</Text>
        ) : null}
      </View>
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
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 140,
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
  messageText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
