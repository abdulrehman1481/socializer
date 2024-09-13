import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Bottomtabsicon = [
  {
    name: 'home-outline',
    text: 'Home',
    active: 'home',
    inactive: 'home-outline',
  },
  {
    name: 'search-outline',
    text: 'Search',
    active: 'search',
    inactive: 'search-outline',
  },
  {
    name: 'person-outline',
    text: 'Profile',
    active: 'person',
    inactive: 'person-outline',
  },
];

const BottomTabs = ({ state, descriptors, navigation }) => {
  const [activeTab, setActiveTab] = useState(state.routes[state.index].name);

  return (
    <View style={styles.container}>
      {Bottomtabsicon.map((icon, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.iconContainer,
            activeTab === icon.text && styles.activeTab,
          ]}
          onPress={() => {
            setActiveTab(icon.text);
            navigation.navigate(icon.text);
          }}
        >
          <Ionicons
            name={activeTab === icon.text ? icon.active : icon.inactive}
            size={28}
            color={activeTab === icon.text ? '#f18e37' : '#8e8e8e'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    backgroundColor: '#474747',
    borderTopWidth: 1,
    borderTopColor: '#474747',
    elevation: 5, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  activeTab: {
    backgroundColor: '#888888',
    borderRadius: 20,
    padding: 8,
  },
});

export default BottomTabs;