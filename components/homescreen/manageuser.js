import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import { db } from '../../firebase';

const ManageUsersScreen = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userSnapshot = await db.collection('users').get();
        const usersData = userSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const assignAdmin = async (userId, societyId) => {
    try {
      const userDocRef = db.collection('users').doc(userId);
      const updateData = {};
  
      if (societyId) {
        updateData.assignedSociety = societyId;
      } else {
        updateData.assignedSociety = null; // or some default value
      }
  
      await userDocRef.update(updateData);
      console.log('Admin assigned successfully');
    } catch (error) {
      console.error('Error assigning admin:', error);
    }
  };
  

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <Text>{item.name}</Text>
            <Text>{item.email}</Text>
            <Button title="Assign as Admin" onPress={() => assignAdmin(item.id, item.assignedSociety)} />
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  userCard: {
    padding: 20,
    marginVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
});

export default ManageUsersScreen;
