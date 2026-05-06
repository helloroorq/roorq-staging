import { Tabs } from 'expo-router'
import { Colors } from '@/theme'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   Colors.RED,
        tabBarInactiveTintColor: Colors.MUTED,
        tabBarStyle: {
          backgroundColor:  Colors.WHITE,
          borderTopColor:   Colors.BORDER,
          borderTopWidth:   1,
          height:           64,
          paddingBottom:    10,
        },
        tabBarLabelStyle: {
          fontSize:   11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <TabIcon name="⊞" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="listings"
        options={{
          title: 'Listings',
          tabBarIcon: ({ color }) => (
            <TabIcon name="▤" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <TabIcon name="◎" color={color} />
          ),
        }}
      />
    </Tabs>
  )
}

// Simple text-based icon until we wire up vector icons
function TabIcon({ name, color }: { name: string; color: string }) {
  const { Text } = require('react-native')
  return <Text style={{ fontSize: 20, color }}>{name}</Text>
}
