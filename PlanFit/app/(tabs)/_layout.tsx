import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#1A1A1A', borderTopColor: '#2D2D2D', height: 70, paddingBottom: 10, paddingTop: 8 },
        tabBarActiveTintColor: '#4A90FF',
        tabBarInactiveTintColor: '#666',
      }}
    >
        <Tabs.Screen name="index" options={{ tabBarLabel: 'Inicio', tabBarIcon: () => <TabIcon label="🏠" /> }} />
        <Tabs.Screen name="exercises" options={{ tabBarLabel: 'Ejercicios', tabBarIcon: () => <TabIcon label="💪" /> }} />
        <Tabs.Screen name="warmup" options={{ tabBarLabel: 'Calentar', tabBarIcon: () => <TabIcon label="🧘" /> }} />
        <Tabs.Screen name="more" options={{ tabBarLabel: 'Más', tabBarIcon: () => <TabIcon label="⚙️" /> }} />
    </Tabs>
  );
}

import { Text } from 'react-native';

function TabIcon({ label, focused }: { label: string; focused?: boolean }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{label}</Text>;
}
