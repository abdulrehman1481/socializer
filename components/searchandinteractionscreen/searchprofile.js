import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
import { db, storage } from '../../firebase'; // Ensure these are correctly imported from your Firebase setup
import Icon from 'react-native-vector-icons/Ionicons'; // Import Ionicons for icons

const UserProfileScreen = ({ route }) => {
  const { userId } = route.params;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Fetch user data from Firestore
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          console.log('User data fetched:', userData);

          // Fetch profile picture from Firebase Storage
          if (userData.profile_picture) {
            try {
              const profilePicRef = storage.refFromURL(userData.profile_picture);
              const profilePicUrl = await profilePicRef.getDownloadURL();
              console.log('Resolved profile picture URL:', profilePicUrl);
              userData.profile_picture = profilePicUrl;
            } catch (error) {
              console.error('Error fetching profile picture:', error);
              userData.profile_picture = null; // Set to null if fetching fails
            }
          } else {
            userData.profile_picture = null; // Set to null if no profile picture exists
          }

          setUser(userData);
        } else {
          setError("User does not exist");
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError("Error fetching user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>User not found.</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerText}>User Profile</Text>
      </View>
      <View style={styles.container}>
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            {user.profile_picture ? (
              <Image
                source={{ uri: user.profile_picture }}
                style={styles.profilePicture}
                onError={() => setUser({ ...user, profile_picture: null })} // Reset if image fails to load
              />
            ) : (
              <Icon name="person-circle" size={120} color={colors.primary} />
            )}
          </TouchableOpacity>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.username}>@{user.username}</Text>
        </View>
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Icon name="id-card-outline" size={16} color={colors.error} style={styles.icon} />
            <Text style={styles.detail}>CMS ID: {user.cmsId || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="calendar-outline" size={16} color={colors.error} style={styles.icon} />
            <Text style={styles.detail}>Batch: {user.batch || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="briefcase-outline" size={16} color={colors.error} style={styles.icon} />
            <Text style={styles.detail}>Department: {user.department || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="location-outline" size={16} color={colors.error} style={styles.icon} />
            <Text style={styles.detail}>Campus: {user.campus || 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.bioCard}>
          <View style={styles.bioHeader}>
            <Icon name="person" size={24} color={colors.error} />
            <Text style={styles.bioHeading}>Bio</Text>
            <Icon name="person" size={24} color={colors.error} />
          </View>
          <Text style={styles.bioText}>{user.bio || 'No bio available'}</Text>
        </View>
      </View>

      {/* Modal for Zooming Profile Picture */}
      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
        animationType="fade"
      >
        <TouchableOpacity style={styles.modalContainer} onPress={() => setModalVisible(false)}>
          <Image
            source={{ uri: user.profile_picture }}
            style={styles.modalImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const colors = {
  primary: '#121212',
  background: '#121212',
  text: '#ffffff',
  error: '#e74c3c',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingVertical: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#474747',
  },
  headerText: {
    fontSize: 30,
    marginTop: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 10,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: colors.text,
    textTransform: 'capitalize',
  },
  username: {
    fontSize: 18,
    color: colors.error,
    marginBottom: 20,
  },
  detailsContainer: {
    paddingHorizontal: 20,
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  detail: {
    fontSize: 16,
    color: colors.text,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    marginRight: 10,
  },
  bioCard: {
    marginTop: 20,
    paddingHorizontal: 20,
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  bioHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  bioText: {
    fontSize: 16,
    color: colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalImage: {
    width: '90%',
    height: '90%',
  },
});

export default UserProfileScreen;
