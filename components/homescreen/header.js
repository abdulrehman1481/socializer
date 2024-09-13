import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const Page = ({ searchTerm, setSearchTerm }) => {
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();

  // State to manage notifications
  const [hasNotifications, setHasNotifications] = useState(false);

  // Simulated profile picture URL
  const profilePictureUri = ''; // Replace with actual profile picture URL or an empty string if unavailable

  useEffect(() => {
    // Simulate a notification check
    // Replace this with real logic to fetch notifications
    const checkNotifications = () => {
      const random = Math.random() > 0.5;
      setHasNotifications(random);
    };

    checkNotifications();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Mark notifications as viewed when the notification screen is visited
      return () => {
        setHasNotifications(false);
      };
    }, [])
  );

  return (
    <View style={[styles.container, { paddingTop: headerHeight + 30 }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate("Profile")}>
          {profilePictureUri ? (
            <Image source={{ uri: profilePictureUri }} style={styles.profileImage} />
          ) : (
            <Ionicons name="person-circle" size={44} color="#ffc145" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate("Notification", { param: 'value' })} // Pass parameters here
        >
          <View style={styles.notificationIconContainer}>
            <Ionicons name="notifications" size={30} color={'#ffc145'} />
            {hasNotifications && <View style={styles.notificationDot} />}
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" style={styles.searchIcon} color={'black'} size={18} />
          <TextInput
            placeholder="Search societies..."
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={(text) => setSearchTerm(text)}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    shadowColor: 'black',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  profileButton: {
    marginLeft: 10,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  notificationButton: {
    marginRight: 10,
  },
  notificationIconContainer: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#888888',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginHorizontal: 15,
    borderColor: '#ffc145',
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchIcon: {
    marginRight: 5,
  },
});

export default Page;









