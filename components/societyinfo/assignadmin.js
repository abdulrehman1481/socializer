import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList, Image } from 'react-native';
import { firebase } from '../../firebase';
import debounce from 'lodash.debounce';
import Ionicons from '@expo/vector-icons/Ionicons';

const AssignAdminScreen = ({ route, navigation }) => {
  const { societyId } = route.params;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [societyAdmins, setSocietyAdmins] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSocietyAdmin, setIsSocietyAdmin] = useState(false);

  const fetchSocietyData = async () => {
    try {
      const societyDoc = await firebase.firestore().collection('societies').doc(societyId).get();
      const admins = societyDoc.data().societyAdmins || [];

      if (admins.length > 0) {
        const adminUsers = await Promise.all(admins.map(adminId =>
          firebase.firestore().collection('users').doc(adminId).get()
        ));

        setSocietyAdmins(adminUsers.map(admin => ({
          id: admin.id,
          ...admin.data(),
        })));
      }
    } catch (error) {
      console.error('Error fetching society admins:', error);
      Alert.alert('Error', 'An error occurred while fetching society admins.');
    }
  };

  const checkAdmin = async () => {
    const user = firebase.auth().currentUser;
    console.log(isAdmin, isSocietyAdmin);
    if (user) {
      try {
        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          setIsAdmin(userData.isAdmin || false); // Ensure default is false
          setIsSocietyAdmin(userData.societyAdmins && userData.societyAdmins.includes(societyId));
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        Alert.alert('Error', 'An error occurred while checking admin status.');
      }
    }
  };
  
  useEffect(() => {
    fetchSocietyData();
    checkAdmin();
  }, [societyId]);

  useEffect(() => {
    const searchUsers = debounce(async (query) => {
      if (query.length < 3) {
        setSearchResults([]);
        return;
      }

      setLoading(true);

      try {
        const querySnapshot = await firebase.firestore()
          .collection('users')
          .where('name', '>=', query)
          .where('name', '<=', query + '\uf8ff')
          .limit(10)
          .get();

        const users = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setSearchResults(users);
      } catch (error) {
        console.error('Error searching users:', error);
        Alert.alert('Error', 'An error occurred while searching users.');
      }

      setLoading(false);
    }, 300);

    searchUsers(searchQuery);

    return () => {
      searchUsers.cancel();
    };
  }, [searchQuery]);

  const handleAssignAdmin = async () => {
    // Check if the user has either admin or society admin permissions
    if (!isAdmin && !isSocietyAdmin) {
      Alert.alert('Permission Denied', 'You do not have permission to perform this action.');
      return;
    }
  
    if (!selectedUser) {
      Alert.alert('Error', 'No user selected.');
      return;
    }
  
    try {
      // Add the user to the societyAdmins array in the society document
      await firebase.firestore().collection('societies').doc(societyId).update({
        societyAdmins: firebase.firestore.FieldValue.arrayUnion(selectedUser.id),
      });
  
      // Update the user document to reflect the new society admin role
      await firebase.firestore().collection('users').doc(selectedUser.id).update({
        societyAdmins: firebase.firestore.FieldValue.arrayUnion(societyId),
      });
  
      Alert.alert('Success', `${selectedUser.name} has been added as a society admin.`);
      navigation.goBack();
    } catch (error) {
      console.error('Error assigning society admin:', error);
      Alert.alert('Error', 'An error occurred while assigning the society admin.');
    }
  };
  
  

  const handleRemoveAdmin = async (adminId) => {
    try {
      // Remove from societyAdmins in the society document
      await firebase.firestore().collection('societies').doc(societyId).update({
        societyAdmins: firebase.firestore.FieldValue.arrayRemove(adminId),
      });

      // Remove from societyAdmins in the user document
      await firebase.firestore().collection('users').doc(adminId).update({
        societyAdmins: firebase.firestore.FieldValue.arrayRemove(societyId),
      });

      setSocietyAdmins(societyAdmins.filter(admin => admin.id !== adminId));
      Alert.alert('Success', 'Society admin removed successfully.');
    } catch (error) {
      console.error('Error removing society admin:', error);
      Alert.alert('Error', 'An error occurred while removing the society admin.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.title}>Assign Society Admin</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by name"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.userItem} onPress={() => setSelectedUser(item)}>
              <Image source={{ uri: item.profilePictureUrl }} style={styles.profilePicture} />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userDepartment}>{item.department}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.noResultsText}>No users found.</Text>}
        />
      )}
      {selectedUser && (
        <View style={styles.userDetails}>
          <Text style={styles.userDetailsText}>Name: {selectedUser.name}</Text>
          <Text style={styles.userDetailsText}>Department: {selectedUser.department}</Text>
          <Text style={styles.userDetailsText}>Email: {selectedUser.email}</Text>

          <TouchableOpacity style={styles.confirmButton} onPress={handleAssignAdmin}>
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      )}
      <Text style={styles.subTitle}>Current Society Admins</Text>
      <FlatList
        data={societyAdmins}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.adminItem}>
            <Image source={{ uri: item.profilePictureUrl }} style={styles.profilePicture} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userDepartment}>{item.department}</Text>
            </View>
            {isAdmin && (
              <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveAdmin(item.id)}>
                <Ionicons name="trash" size={24} color="#ff0000" />
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchInput: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  loadingText: {
    textAlign: 'center',
    marginVertical: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDepartment: {
    fontSize: 14,
    color: '#555',
  },
  noResultsText: {
    textAlign: 'center',
    marginVertical: 16,
  },
  userDetails: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 16,
  },
  userDetailsText: {
    fontSize: 16,
    marginBottom: 8,
  },
  confirmButton: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  subTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  adminItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  removeButton: {
    marginLeft: 16,
  },
});

export default AssignAdminScreen;