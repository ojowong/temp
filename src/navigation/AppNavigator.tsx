import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import AvailabilityScreen from '../screens/availability/AvailabilityScreen';
import CreateGroupScreen from '../screens/groups/CreateGroupScreen';
import GroupDetailScreen from '../screens/groups/GroupDetailScreen';
import HomeScreen from '../screens/groups/HomeScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ScheduleRequestScreen from '../screens/schedule/ScheduleRequestScreen';
import SuggestionsScreen from '../screens/schedule/SuggestionsScreen';

export type HomeStackParamList = {
  Home: undefined;
  GroupDetail: undefined;
  CreateGroup: undefined;
  ScheduleRequest: undefined;
  Suggestions: undefined;
};

export type AppTabParamList = {
  HomeTab: undefined;
  Availability: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <HomeStack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={{ title: 'Group Detail' }}
      />
      <HomeStack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{ title: 'Create Group' }}
      />
      <HomeStack.Screen
        name="ScheduleRequest"
        component={ScheduleRequestScreen}
        options={{ title: 'Schedule Request' }}
      />
      <HomeStack.Screen
        name="Suggestions"
        component={SuggestionsScreen}
        options={{ title: 'Suggestions' }}
      />
    </HomeStack.Navigator>
  );
}

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

function getTabIcon(routeName: keyof AppTabParamList): TabIconName {
  switch (routeName) {
    case 'HomeTab':
      return 'home';
    case 'Availability':
      return 'calendar';
    case 'Profile':
      return 'person';
    default:
      return 'ellipse';
  }
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={getTabIcon(route.name)} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ title: 'Home' }}
      />
      <Tab.Screen name="Availability" component={AvailabilityScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
