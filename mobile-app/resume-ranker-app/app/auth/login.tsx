import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/lib/api';

const formatNameFromEmail = (email: string) =>
  email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export default function LoginScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const palette = Colors[scheme];
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'recruiter' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');


  // const handleLogin = () => {
  //   if (selectedRole === 'candidate') {
  //     router.replace('/(user-tabs)');
  //     return;
  //   }

  //   if (selectedRole === 'recruiter') {
  //     router.replace('/(recruiter-tabs)');
  //   }
  // };

  const handleLogin = async () => {
    if(!email.trim()){
      console.log("EMAIL IS REQUIRED!!!");
      return;
    }
    if(!password.trim()){
      console.log("PASSWORD IS REQUIRED");
      return;
    }

    if(!selectedRole){
      console.log("PLEASE SELECT A ROLE!!!");
      return;
    }

    const response = await fetch(`${API_BASE_URL}/auth/login`,{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
      },
      body: JSON.stringify({
        email: email.trim(),
        password,
      }),
    });

const raw = await response.text();
console.log('Login status:', response.status);
console.log('Login response:', raw);

if (!response.ok) {
  console.log('Login failed');
  return;
}

const data = JSON.parse(raw);

await AsyncStorage.setItem('token', data.token);
await AsyncStorage.setItem('role', selectedRole);
await AsyncStorage.setItem('profile_email', email.trim());

const storedName = await AsyncStorage.getItem('profile_name');
if (!storedName) {
  await AsyncStorage.setItem('profile_name', formatNameFromEmail(email.trim()));
}

const savedToken = await AsyncStorage.getItem('token');
console.log('Saved token:', savedToken);

if (selectedRole === 'candidate'){
  router.replace('/(user-tabs)');
  return; 
}

if (selectedRole === 'recruiter'){
  router.replace('/(recruiter-tabs)');
  return;
}
};

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: isDark ? '#31231b' : '#fff1e5' }]}>
        <Text style={[styles.kicker, { color: isDark ? '#ffd5bb' : '#a0541c' }]}>Resume Ranker</Text>
        <Text style={[styles.title, { color: palette.text }]}>Log in and choose your hiring flow.</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#dcc7ba' : '#765c4d' }]}>
          Candidates review matches and improve resumes. Recruiters review applicants and shortlist faster.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Welcome back</Text>
        <TextInput
          placeholder="Email address"
          value = {email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
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
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          placeholderTextColor={isDark ? '#a69082' : '#9f8373'}
          secureTextEntry
          style={[
            styles.input,
            {
              backgroundColor: isDark ? '#332720' : '#fff5ee',
              color: palette.text,
              borderColor: isDark ? '#4a392f' : '#f1ddd0',
            },
          ]}
        />

        <Text style={[styles.roleLabel, { color: palette.text }]}>Continue as</Text>

        <Pressable
          onPress={() => setSelectedRole('candidate')}
          style={[
            styles.roleCard,
            {
              backgroundColor: isDark ? '#2d221b' : '#fff6ef',
              borderColor: selectedRole === 'candidate' ? '#ff7a29' : isDark ? '#3a2b22' : '#f3dfd1',
            },
          ]}>
            <View style={styles.roleHeader}>
              <View style={[styles.iconBadge, { backgroundColor: 'rgba(47, 158, 68, 0.14)' }]}>
                <MaterialIcons name="person" size={20} color="#2f9e44" />
              </View>
              <MaterialIcons
                name={selectedRole === 'candidate' ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={22}
                color={selectedRole === 'candidate' ? '#ff7a29' : isDark ? '#cfb8ab' : '#8e6e5b'}
              />
            </View>
            <Text style={[styles.roleTitle, { color: palette.text }]}>Job seeker</Text>
            <Text style={[styles.roleCopy, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
              See score breakdowns, improve missing skills, and tailor resumes for each job.
            </Text>
        </Pressable>

        <Pressable
          onPress={() => setSelectedRole('recruiter')}
          style={[
            styles.roleCard,
            {
              backgroundColor: isDark ? '#2d221b' : '#fff6ef',
              borderColor: selectedRole === 'recruiter' ? '#ff7a29' : isDark ? '#3a2b22' : '#f3dfd1',
            },
          ]}>
            <View style={styles.roleHeader}>
              <View style={[styles.iconBadge, { backgroundColor: 'rgba(255, 122, 41, 0.14)' }]}>
                <MaterialIcons name="business-center" size={20} color="#ff7a29" />
              </View>
              <MaterialIcons
                name={
                  selectedRole === 'recruiter' ? 'radio-button-checked' : 'radio-button-unchecked'
                }
                size={22}
                color={selectedRole === 'recruiter' ? '#ff7a29' : isDark ? '#cfb8ab' : '#8e6e5b'}
              />
            </View>
            <Text style={[styles.roleTitle, { color: palette.text }]}>Recruiter</Text>
            <Text style={[styles.roleCopy, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
              Track openings, compare applicants, and move the strongest candidates into shortlist views.
            </Text>
        </Pressable>

        <Pressable
          disabled={!selectedRole}
          onPress={handleLogin}
          style={[
            styles.primaryButton,
            {
              backgroundColor: selectedRole ? '#ff7a29' : isDark ? '#4f3c31' : '#ead9cd',
            },
          ]}>
          <Text style={[styles.primaryButtonText, { color: selectedRole ? '#fffaf5' : '#8f796b' }]}>
            Log in
          </Text>
        </Pressable>

        <Link href="/auth/signup" asChild>
          <Pressable style={styles.footerLink}>
            <Text style={styles.footerLinkText}>Need an account? Create one</Text>
          </Pressable>
        </Link>
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
    fontSize: 36,
    lineHeight: 42,
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
    gap: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  roleLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '800',
  },
  roleCard: {
    borderWidth: 1.5,
    borderRadius: 22,
    padding: 18,
    gap: 10,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  roleCopy: {
    fontSize: 14,
    lineHeight: 21,
  },
  primaryButton: {
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  footerLink: {
    paddingTop: 8,
    alignSelf: 'center',
  },
  footerLinkText: {
    color: '#ff7a29',
    fontSize: 15,
    fontWeight: '800',
  },
});
