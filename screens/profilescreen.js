import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Image, Alert,
  TouchableWithoutFeedback, Keyboard, ScrollView, Modal, Pressable, ActivityIndicator, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db, storage } from '../firebase';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = () => {
  const [userData, setUserData] = useState(null);
  const [editable, setEditable] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [newName, setNewName] = useState('');
  const [newBio, setNewBio] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [optionModalVisible, setOptionModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await db.collection('users').doc(user.uid).get();
          if (userDoc.exists) {
            const data = userDoc.data();
            setUserData(data);
            setNewName(data.name || '');
            setNewBio(data.bio || '');
            setProfilePicture(data.profile_picture || '');
            setNewPhone(data.phoneNumber || '');
          } else {
            Alert.alert("No user data found!");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          Alert.alert("Error", "Failed to fetch user data.");
        }
      } else {
        Alert.alert("User not authenticated");
      }
      setLoading(false);
    };
    fetchUserData();
  }, []);

  const selectProfileImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission result:', permissionResult);

      if (!permissionResult.granted) {
        Alert.alert("Permission required", "You've refused to allow this app to access your photos!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 4],
        quality: 1,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfilePicture(result.assets[0].uri);
        uploadProfileImage(result.assets[0].uri, auth.currentUser.email); // Upload new picture
      }
    } catch (error) {
      console.error('Error selecting profile image:', error);
    }
    setOptionModalVisible(false); // Close option modal
  };

  const removeProfilePicture = async () => {
    try {
      const user = auth.currentUser;
      const ref = storage.ref().child(`profile_pictures/${user.email}`);
      await ref.delete(); // Delete from storage
      setProfilePicture(null); // Update state
      await db.collection('users').doc(user.uid).update({ profile_picture: null }); // Update Firestore
      Alert.alert('Profile picture removed');
    } catch (error) {
      console.error('Error removing profile picture:', error);
      Alert.alert('Error', 'Failed to remove profile picture.');
    }
    setOptionModalVisible(false); // Close option modal
  };

  const uploadProfileImage = async (uri, email) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const ref = storage.ref().child(`profile_pictures/${email}`);
      await ref.put(blob);
      const downloadURL = await ref.getDownloadURL();
      console.log('Uploaded profile picture URL:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Error', 'Failed to upload profile picture.');
      return null;
    }
  };

  const updateProfile = async () => {
    const user = auth.currentUser;
    try {
      if (user) {
        let profilePicUrl = profilePicture ? await uploadProfileImage(profilePicture, user.email) : userData.profile_picture;
        profilePicUrl = profilePicUrl || userData.profile_picture;

        await db.collection('users').doc(user.uid).update({
          name: newName,
          bio: newBio,
          profile_picture: profilePicUrl,
          phoneNumber: newPhone,
        });

        Alert.alert('Profile updated successfully');
        setEditable(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error updating profile', error.message);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await auth.signOut();
              navigation.navigate('Login');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out.');
            }
          },
        },
      ]
    );
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={30} color={colors.headerText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButtonHeader}>
            <Ionicons name="log-out-outline" size={30} color={colors.headerText} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {userData ? (
            <View style={styles.profileContainer}>
              <TouchableOpacity onPress={() => setOptionModalVisible(true)}>
                {profilePicture ? (
                  <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
                ) : (
                  <Ionicons name="person-circle" size={120} color={colors.primary} />
                )}
                <Ionicons name="camera" size={30} color={colors.secondary} style={styles.cameraIcon} />
              </TouchableOpacity>
              <View style={styles.infoContainer}>
                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={16} color={colors.icon} style={styles.icon} />
                  <Text style={styles.label}>Username:</Text>
                  <Text style={styles.text}>{userData.username}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="id-card-outline" size={16} color={colors.icon} style={styles.icon} />
                  <Text style={styles.label}>Name:</Text>
                  <TextInput
                    style={styles.input}
                    value={newName}
                    onChangeText={setNewName}
                    editable={editable}
                    placeholderTextColor={colors.placeholder}
                  />
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.icon} style={styles.icon} />
                  <Text style={styles.label}>Bio:</Text>
                  <TextInput
                    style={[styles.input, styles.bioInput]}
                    value={newBio}
                    onChangeText={setNewBio}
                    editable={editable}
                    multiline
                    numberOfLines={3}
                    placeholderTextColor={colors.placeholder}
                    maxLength={150} // Approximate length for 3 lines
                  />
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="call-outline" size={16} color={colors.icon} style={styles.icon} />
                  <Text style={styles.label}>Phone Number:</Text>
                  <TextInput
                    style={styles.input}
                    value={newPhone}
                    onChangeText={setNewPhone}
                    editable={editable}
                    placeholderTextColor={colors.placeholder}
                  />
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="school-outline" size={16} color={colors.icon} style={styles.icon} />
                  <Text style={styles.label}>Batch:</Text>
                  <Text style={styles.text}>{userData.batch}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={16} color={colors.icon} style={styles.icon} />
                  <Text style={styles.label}>Campus:</Text>
                  <Text style={styles.text}>{userData.campus}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="home-outline" size={16} color={colors.icon} style={styles.icon} />
                  <Text style={styles.label}>Department:</Text>
                  <Text style={styles.text}>{userData.department}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="card-outline" size={16} color={colors.icon} style={styles.icon} />
                  <Text style={styles.label}>CMS ID:</Text>
                  <Text style={styles.text}>{userData.cmsId}</Text>
                </View>
              </View>
              <View style={styles.buttonContainer}>
                {editable ? (
                  <>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={() => setEditable(false)}
                    >
                      <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.updateButton]}
                      onPress={updateProfile}
                    >
                      <Text style={styles.buttonText}>Save Changes</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={[styles.button, styles.updateButton]}
                    onPress={() => setEditable(true)}
                  >
                    <Text style={styles.buttonText}>Edit Profile</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <Text>No user data available.</Text>
          )}
        </ScrollView>

        {/* Modal for profile picture options */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={optionModalVisible}
          onRequestClose={() => setOptionModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setOptionModalVisible(false)}>
            <Pressable style={styles.modalContent}>
              <TouchableOpacity onPress={selectProfileImage} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Change Profile Picture</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={removeProfilePicture} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Remove Profile Picture</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setOptionModalVisible(false)} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121212',
    padding: 20,
    marginTop: Platform.OS === 'ios' ? 30 : 0,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 30,
    color: '#fffffb',
    fontWeight: 'bold',
  },
  logoutButtonHeader: {
    marginLeft: 15,
  },
  scrollContainer: {
    padding: 15,
  },
  profileContainer: {
    alignItems: 'center',
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  infoContainer: {
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  icon: {
    marginRight: 10,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    width: 120,
  },
  text: {
    fontSize: 16,
    color: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    color: '#333',
    borderRadius: 5,
    padding: 10,
  },
  bioInput: {
    height: 100,
  },
  button: {
    borderRadius: 5,
    padding: 15,
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  updateButton: {
    backgroundColor: '#ffc145',
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: '#5b5f97',
    marginVertical: 5,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

const colors = {
  primary: '#5b5f97',
  secondary: '#ffc145',
  background: '#f5f5f5',
  text: '#333',
  placeholder: '#888',
  inputBorder: '#ccc',
  button: '#ffc145',
  buttonText: '#fff',
  buttonLogout: '#e74c3c',
  headerBackground: '#5b5f97',
  headerText: '#fffffb',
  icon: '#e74c3c',
};

export default ProfileScreen;
