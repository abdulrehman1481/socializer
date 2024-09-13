import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, KeyboardAvoidingView, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './homescreen';
import Profile from './profilescreen';
import SearchScreen from '../components/searchandinteractionscreen/searchscreen';

const Tab = createBottomTabNavigator();

const Bottomtabsicon = [
  { text: 'Home', active: 'home', inactive: 'home-outline' },
  { text: 'Search', active: 'search', inactive: 'search-outline' },
  { text: 'Profile', active: 'person', inactive: 'person-outline' },
];

const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.container}>
      {Bottomtabsicon.map((icon, index) => {
        const isActive = state.index === index;
        return (
          <TouchableOpacity
            key={index}
            style={[styles.iconContainer, isActive && styles.activeTab]}
            onPress={() => {
              if (state.index !== index) {
                navigation.navigate(icon.text);
              }
            }}
          >
            <Ionicons
              name={isActive ? icon.active : icon.inactive}
              size={28}
              color={isActive ? '#ffc145' : '#8e8e8e'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const MainTabs = () => {
  const screenHeight = Dimensions.get('window').height;
  const [keyboardVisible, setKeyboardVisible] = React.useState(false);

  const onLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    if (height < screenHeight) {
      setKeyboardVisible(true);
    } else {
      setKeyboardVisible(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1 }} onLayout={onLayout}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: '#ffc145', // Active icon color
            tabBarInactiveTintColor: '#8e8e8e', // Inactive icon color
            tabBar: (props) => <CustomTabBar {...props} />,
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={30} color={color} />,
            }}
          />
          <Tab.Screen
            name="Search"
            component={SearchScreen}
            options={{
              tabBarIcon: ({ color }) => (
                <View style={styles.searchIconContainer}>
                  <Ionicons name="search" size={30} color="#fff" />
                </View>
              ),
            }}
          />
          <Tab.Screen
            name="Profile"
            component={Profile}
            options={{
              tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={30} color={color} />,
            }}
          />
        </Tab.Navigator>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 80,
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  activeTab: {
    backgroundColor: '#888888',
    borderRadius: 20,
    padding: 8,
  },
  tabBar: {
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
  },
  searchIconContainer: {
    backgroundColor: 'orange',
    paddingHorizontal: 16,
    paddingVertical: 3,
    borderRadius: 15,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MainTabs;
