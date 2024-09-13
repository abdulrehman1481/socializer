import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MainTabs from './MainTabs'; // Adjust path if necessary
import UserProfileScreen from '../components/searchandinteractionscreen/searchprofile';
import NotificationScreen from '../components/notificationscreen/notification';
import AddSocietyScreen from '../components/homescreen/addsocity';
import ManageUsersScreen from '../components/homescreen/manageuser';
import SocietyDetailScreen from '../components/societyinfo/societydetail';
import EditSocietyScreen from '../components/societyinfo/editsociety';
import AddPortfolioScreen from '../components/societyinfo/addportfolio';
import AddEventScreen from '../components/societyinfo/addevent';
import AssignAdminScreen from '../components/societyinfo/assignadmin';
import AddMemberScreen from '../components/societyinfo/editexistportfolio';
import EditEventScreen from '../components/societyinfo/editevent';
import EditAboutScreen from '../components/societyinfo/addabout';
import AboutSection from '../components/societyinfo/aboutsection';
import AssignRolesScreen from '../components/societyinfo/assignroles';
import BroadcastScreen from '../components/broadcast';

const Stack = createStackNavigator();

const MainNavigator = () => (
  <Stack.Navigator initialRouteName="MainTabs" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen name="UserProfile" component={UserProfileScreen} />
    <Stack.Screen name="Notification" component={NotificationScreen} />
    <Stack.Screen name="AddSociety" component={AddSocietyScreen} />
    <Stack.Screen name="ManageUsers" component={ManageUsersScreen} />
    <Stack.Screen name="SocietyDetail" component={SocietyDetailScreen} />
    <Stack.Screen name="EditSociety" component={EditSocietyScreen} />
    <Stack.Screen name="AddPortfolio" component={AddPortfolioScreen} />
    <Stack.Screen name="AddEvent" component={AddEventScreen} />
    <Stack.Screen name="AssignAdmin" component={AssignAdminScreen} />
    <Stack.Screen name="AddMemberScreen" component={AddMemberScreen} />
    <Stack.Screen name="EditEvent" component={EditEventScreen} />
    <Stack.Screen name="AddAbout" component={EditAboutScreen} />
    <Stack.Screen name="AboutSection" component={AboutSection} />
    <Stack.Screen name="AssignRoles" component={AssignRolesScreen} />
    <Stack.Screen name="Broadcast" component={BroadcastScreen} />
  </Stack.Navigator>
);

export default MainNavigator;
