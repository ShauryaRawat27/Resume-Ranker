import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { API_BASE_URL } from '@/lib/api';

const benefits = [
  'Resume scoring against every job description',
  'Role-specific dashboards for candidates and recruiters',
  'Shortlists, notes, and fit explanations in one place',
];

export default function SignupScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const palette = Colors[scheme];
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'recruiter' | null>(null);
  const [fullName, setFullName] = useState('');
  const [email , setEmail] = useState('');
  const [password , setPassword] = useState('');


  // const handleSignup = () => {
  //   if (selectedRole === 'candidate') {
  //     router.replace('/(user-tabs)');
  //     return;
  //   }

  //   if (selectedRole === 'recruiter') {
  //     router.replace('/(recruiter-tabs)');
  //   }
  // };

  const handleSignup = async () => {
    if(!email.trim()){
      console.log('Email is Required')
      return
    }

    if(!password.trim()){
      console.log('Password is required')
      return
    }

    if (!selectedRole) {
    console.log('Please select a Role');
    return;
  }

  try{
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method:'POST',
      headers: {
        'Content-Type':'application/json',
      },
      body: JSON.stringify({
        email: email.trim(),
        password,
        role: selectedRole,
      }),
    });

    const raw = await response.text();
    console.log('Signup response: ',raw);

    if(!response.ok){
       console.log('Signup failed');
      return;
    }

    router.replace('/auth/login');
  } catch(error){
    console.log('Signup Error:',error);
  }
  } ;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: isDark ? '#31231b' : '#fff1e5' }]}>
        <Text style={[styles.kicker, { color: isDark ? '#ffd5bb' : '#a0541c' }]}>Create account</Text>
        <Text style={[styles.title, { color: palette.text }]}>Start as a candidate or a recruiter.</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#dcc7ba' : '#765c4d' }]}>
          Set up a profile once, then go straight into the flow that matches how you use the app.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? '#261d17' : '#fffdf9' }]}>
        <TextInput
          placeholder="Full name"
          value={fullName}
          onChangeText={setFullName}
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
          placeholder="Work email"
          value={email}
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
          placeholder="Create password"
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

        <View style={styles.benefits}>
          {benefits.map((item) => (
            <View key={item} style={styles.benefitRow}>
              <MaterialIcons name="check-circle" size={18} color="#ff7a29" />
              <Text style={[styles.benefitText, { color: palette.text }]}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.roleLabel, { color: palette.text }]}>Choose account type</Text>

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
            <Text style={[styles.roleTitle, { color: palette.text }]}>Job seeker</Text>
            <MaterialIcons
              name={selectedRole === 'candidate' ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={22}
              color={selectedRole === 'candidate' ? '#ff7a29' : isDark ? '#cfb8ab' : '#8e6e5b'}
            />
          </View>
          <Text style={[styles.roleCopy, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
            Build resumes, compare roles, and improve your fit score before applying.
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
            <Text style={[styles.roleTitle, { color: palette.text }]}>Recruiter</Text>
            <MaterialIcons
              name={selectedRole === 'recruiter' ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={22}
              color={selectedRole === 'recruiter' ? '#ff7a29' : isDark ? '#cfb8ab' : '#8e6e5b'}
            />
          </View>
          <Text style={[styles.roleCopy, { color: isDark ? '#d6c1b5' : '#7a6152' }]}>
            Manage openings, rank applicants, and shortlist the strongest candidates faster.
          </Text>
        </Pressable>

        <Pressable
          disabled={!selectedRole}
          onPress={handleSignup}
          style={[
            styles.primaryButton,
            { backgroundColor: selectedRole ? '#ff7a29' : isDark ? '#4f3c31' : '#ead9cd' },
          ]}>
          <Text style={[styles.primaryButtonText, { color: selectedRole ? '#fffaf5' : '#8f796b' }]}>
            Create account
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.secondaryButton,
            {
              borderColor: isDark ? '#6b5142' : '#ebc8b2',
              backgroundColor: isDark ? '#2c211a' : '#fff8f3',
            },
          ]}>
          <Text style={[styles.secondaryButtonText, { color: palette.text }]}>Continue with Google</Text>
        </Pressable>

        <Link href="/auth/login" asChild>
          <Pressable style={styles.footerLink}>
            <Text style={styles.footerLinkText}>Already have an account? Log in</Text>
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
    gap: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  benefits: {
    gap: 10,
    paddingVertical: 6,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  roleLabel: {
    marginTop: 4,
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
  },
  primaryButtonText: {
    color: '#fffaf5',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryButtonText: {
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
