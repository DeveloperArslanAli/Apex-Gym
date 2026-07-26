import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import MealsScreen from '../screens/MealsScreen';
import CoachScreen from '../screens/CoachScreen';
import QrScreen from '../screens/QrScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          let icon = '🏠';
          if (route.name === 'Workout') icon = '💪';
          else if (route.name === 'Meals') icon = '🍎';
          else if (route.name === 'Coach') icon = '🤖';
          else if (route.name === 'QR Pass') icon = '🔲';
          return <Text style={{ fontSize: 20, color: focused ? '#10b981' : '#64748b' }}>{icon}</Text>;
        },
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#09090b',
          borderTopColor: '#1e293b',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: '#09090b',
          borderBottomColor: '#1e293b',
        },
        headerTitleStyle: {
          color: '#f8fafc',
          fontWeight: 'bold',
          fontSize: 15,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Workout" component={WorkoutScreen} options={{ title: 'Form HUD' }} />
      <Tab.Screen name="Meals" component={MealsScreen} options={{ title: 'Nutrition' }} />
      <Tab.Screen name="Coach" component={CoachScreen} options={{ title: 'Coach Arnold' }} />
      <Tab.Screen name="QR Pass" component={QrScreen} options={{ title: 'Pass Key' }} />
    </Tab.Navigator>
  );
}
