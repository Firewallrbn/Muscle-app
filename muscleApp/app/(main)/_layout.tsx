import { Tabs } from 'expo-router';
import { Image } from 'react-native';
const ICONS = {
  routines: require('../../icons/line-axis.png'),
  muscle: require('../../icons/crown.png'),
  exercises: require('../../icons/dumbell.png'),
  max: require('../../icons/chat-round.png'),
  profile: require('../../icons/profile-person.png'),
} as const;
function TabBarIcon({ color, source }: { color: string; source: any }) {
  return (
    <Image
      source={source}
      style={{ width: 24, height: 24, tintColor: color }}
      resizeMode="contain"
    />
  );
}
export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#111827',
        tabBarInactiveTintColor: '#9CA3AF',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Routines',
          tabBarIcon: ({ color }) => <TabBarIcon color={color} source={ICONS.routines} />,
        }}
      />
      <Tabs.Screen
        name="muscle"
        options={{
          title: 'Muscle',
          tabBarIcon: ({ color }) => <TabBarIcon color={color} source={ICONS.muscle} />,
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Exercises',
          tabBarIcon: ({ color }) => <TabBarIcon color={color} source={ICONS.exercises} />,
        }}
      />
      <Tabs.Screen
        name="max"
        options={{
          title: 'Max',
          tabBarIcon: ({ color }) => <TabBarIcon color={color} source={ICONS.max} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon color={color} source={ICONS.profile} />,
        }}
      />
    </Tabs>
  );
}