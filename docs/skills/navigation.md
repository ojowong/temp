# Navigation Patterns

## Navigate to a Screen
import { useNavigation } from '@react-navigation/native';
const navigation = useNavigation();
navigation.navigate('GroupDetail', { groupId: '123' });

## Get Route Params
import { useRoute } from '@react-navigation/native';
const route = useRoute();
const { groupId } = route.params as { groupId: string };

## Go Back
navigation.goBack();

## Replace Current Screen (used after login)
navigation.reset({
  index: 0,
  routes: [{ name: 'Home' }],
});

## Screen Names
Auth Stack: Login, Register
App Tabs: Home, Availability, Profile
App Stack (pushed over tabs): 
  GroupDetail, CreateGroup, ScheduleRequest, Suggestions