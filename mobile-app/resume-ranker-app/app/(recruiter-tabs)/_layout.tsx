import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RecruiterTabsLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: palette.tint,
        tabBarInactiveTintColor: palette.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#261d17' : '#fffdf9',
          borderTopColor: colorScheme === 'dark' ? '#3a2c24' : '#f0ddd0',
          height: Platform.select({ ios: 88, default: 72 }),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pipeline',
          tabBarIcon: ({ color }) => <MaterialIcons size={26} name="view-kanban" color={color} />,
        }}
      />
      <Tabs.Screen
        name="candidates"
        options={{
          title: 'Applicants',
          tabBarIcon: ({ color }) => <MaterialIcons size={26} name="groups" color={color} />,
        }}
      />
      <Tabs.Screen
        name="create-job"
        options={{
          title: 'Create',
          tabBarIcon: ({ color }) => <MaterialIcons size={26} name="post-add" color={color} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Ranking',
          tabBarIcon: ({ color }) => <MaterialIcons size={26} name="leaderboard" color={color} />,
        }}
      />
      <Tabs.Screen
        name="authentication"
        options={{
          title: 'Auth',
          tabBarIcon: ({ color }) => <MaterialIcons size={26} name="verified-user" color={color} />,
        }}
      />
      <Tabs.Screen
        name="company"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
