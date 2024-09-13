import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, FlatList, RefreshControl, Modal, Dimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { db } from '../../firebase';
import { Picker } from '@react-native-picker/picker';
import { uniqBy } from 'lodash';

const AssignRolesScreen = ({ route, navigation }) => {
  const { societyId } = route.params;
  const [membersData, setMembersData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('Director'); // Default to Director
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState({});

  const handleSelectMember = (portfolioName, member) => {
    setSelectedMembers(prevSelectedMembers => ({
      ...prevSelectedMembers,
      [portfolioName]: {
        ...prevSelectedMembers[portfolioName],
        selectedMember: prevSelectedMembers[portfolioName]?.selectedMember === member ? null : member,
      },
    }));
    setSelectedUser(member); // Update selectedUser state
  };

  useEffect(() => {
    if (societyId) {
      fetchMembers();
    } else {
      console.warn('Society ID is undefined in AssignRolesScreen');
    }
  }, [societyId]);

  const fetchMembers = async () => {
    if (!societyId) {
      console.warn('Society ID is undefined');
      return;
    }

    console.log('Fetching members for Society ID:', societyId);
    setLoading(true);
    try {
      const societyDoc = await db.collection('societies').doc(societyId).get();
      if (societyDoc.exists) {
        console.log('Society data:', societyDoc.data());
        const societyData = societyDoc.data();
        const portfoliosWithMembers = [];

        if (societyData.portfolios) {
          societyData.portfolios.forEach(portfolio => {
            if (portfolio.members) {
              portfoliosWithMembers.push({
                portfolioName: portfolio.name,
                members: portfolio.members.map(memberId => ({
                  id: memberId,
                  name: '' // Placeholder for member name
                })) || [],
              });
            }
          });

          // Fetch member details
          const memberPromises = portfoliosWithMembers.flatMap(portfolio =>
            portfolio.members.map(async member => {
              const memberDoc = await db.collection('users').doc(member.id).get();
              if (memberDoc.exists) {
                return { ...member, name: memberDoc.data().name || 'Unknown' };
              }
              return { ...member, name: 'Unknown' };
            })
          );

          const members = await Promise.all(memberPromises);

          // Remove duplicates from members array
          const uniqueMembers = uniqBy(members, 'id');

          // Assign updated members with names to portfolios
          const updatedPortfolios = portfoliosWithMembers.map(portfolio => ({
            ...portfolio,
            members: uniqueMembers.filter(member => portfolio.members.some(m => m.id === member.id))
          }));

          setMembersData(updatedPortfolios);
        } else {
          console.warn('No members found in the society');
          setMembersData([]);
        }
      } else {
        console.warn('Society document does not exist');
        setMembersData([]);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      Alert.alert('Error', 'Failed to fetch members');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAssignRole = async () => {
    // Log the state of selectedUser for debugging
    console.log('Selected User:', selectedUser);
  
    if (!selectedUser || !selectedUser.id || !selectedUser.name) {
      Alert.alert('Error', 'Please select a user with a valid name.');
      console.error('Selected user is not defined correctly:', selectedUser);
      return;
    }
  
    const confirmRoleAssignment = () => {
      return new Promise((resolve, reject) => {
        Alert.alert(
          'Confirm Assignment',
          `Are you sure you want to assign ${selectedRole} role to ${selectedUser.name}?`,
          [
            { text: 'Cancel', onPress: () => reject(), style: 'cancel' },
            { text: 'OK', onPress: () => resolve() }
          ]
        );
      });
    };
  
    try {
      await confirmRoleAssignment();
      const societyDoc = await db.collection('societies').doc(societyId).get();
      if (societyDoc.exists) {
        const societyData = societyDoc.data();
        const roles = societyData.roles || {};
  
        const portfolioName = Object.keys(selectedMembers).find(portfolio => 
          selectedMembers[portfolio]?.selectedMember?.id === selectedUser.id
        );
  
        if (!portfolioName) {
          Alert.alert('Error', 'No portfolio selected.');
          return;
        }
  
        if (selectedRole === 'Director' && roles[portfolioName]?.Director) {
          Alert.alert('Error', 'Director role is already assigned in this portfolio.');
          return;
        }
  
        if (selectedRole === 'Deputy Director' && roles[portfolioName]?.DeputyDirector) {
          Alert.alert('Error', 'Deputy Director role is already assigned in this portfolio.');
          return;
        }
  
        const updatedRoles = { ...roles };
        if (!updatedRoles[portfolioName]) {
          updatedRoles[portfolioName] = {};
        }
  
        if (selectedRole === 'Executive') {
          updatedRoles[portfolioName].Executive = [...(updatedRoles[portfolioName].Executive || []), selectedUser.id];
        } else {
          updatedRoles[portfolioName][selectedRole] = selectedUser.id;
        }
  
        // Update the roles in the society document
        await db.collection('societies').doc(societyId).update({ roles: updatedRoles });
        // Update the role in the user's document
        await db.collection('users').doc(selectedUser.id).update({
          [`roles.${societyId}`]: selectedRole,
        });
  
        // Create a notification for the user
        const societyName = societyData.name || 'Unknown Society'; // Handle case where societyName might be missing
        const currentUser = await db.collection('users').doc('currentUserId').get(); // Replace 'currentUserId' with actual ID
        const currentUserName = currentUser.data()?.name || 'Unknown User';
  
        const notification = {
          message: `You have been assigned the role of ${selectedRole} in ${societyName} by ${currentUserName}.`,
          type: 'role-assignment',
          societyId: societyId,
          societyName: societyName,
          assignedBy: currentUserName,
          role: selectedRole,
          timestamp: new Date(),
        };
  
        // Store the notification in the selected user's notifications collection
        await db.collection('users').doc(selectedUser.id).collection('notifications').add(notification);
  
        // Also store a notification for the current user if needed
        const currentUserNotification = {
          message: `You assigned ${selectedRole} role to ${selectedUser.name} in ${societyName}.`,
          type: 'role-assignment',
          societyId: societyId,
          societyName: societyName,
          assignedUser: selectedUser.name,
          role: selectedRole,
          timestamp: new Date(),
        };
  
        await db.collection('users').doc('currentUserId').collection('notifications').add(currentUserNotification); // Replace 'currentUserId' with actual ID
  
        Alert.alert('Success', `${selectedUser.name} has been assigned as ${selectedRole}`);
        fetchMembers(); // Refresh members to reflect the new assignment
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Society document does not exist');
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      Alert.alert('Error', 'Failed to assign role');
    }
  };
  
  
  

  const onRefresh = () => {
    setRefreshing(true);
    fetchMembers();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assign Roles</Text>
      </View>

      <FlatList
        data={membersData}
        renderItem={({ item }) => (
          <View style={styles.portfolioContainer} key={item.portfolioName}>
            <Text style={styles.portfolioTitle}>{item.portfolioName}</Text>
            {item.members && item.members.length > 0 ? (
              item.members.map((member, memberIndex) => (
                <TouchableOpacity
                  key={memberIndex}
                  onPress={() => handleSelectMember(item.portfolioName, member)}
                  style={[
                    styles.memberItem,
                    selectedMembers[item.portfolioName]?.selectedMember === member ? styles.selectedMemberItem : null,
                  ]}
                >
                  <Text style={styles.memberName}>{member.name}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text>No members available</Text>
            )}
          </View>
        )}
        keyExtractor={(item) => item.portfolioName}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        ListEmptyComponent={<Text>No members found</Text>}
      />
      <TouchableOpacity
        style={[styles.assignButton, !selectedUser && styles.disabledButton]}
        onPress={() => setRoleModalVisible(true)}
        disabled={!selectedUser} // Disable button if no user is selected
      >
        <Text style={styles.assignButtonText}>Assign Role</Text>
      </TouchableOpacity>

      <Modal
        visible={roleModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Role</Text>
            <Picker
              selectedValue={selectedRole}
              onValueChange={(itemValue) => setSelectedRole(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Executive" value="Executive" />
              <Picker.Item label="Director" value="Director" />
              <Picker.Item label="Deputy Director" value="Deputy Director" />
            </Picker>
            <TouchableOpacity style={styles.confirmButton} onPress={handleAssignRole}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, styles.cancelButton]}
              onPress={() => setRoleModalVisible(false)}
            >
              <Text style={[styles.confirmButtonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#0088cc',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  backButton: { marginRight: 15 },
  headerTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  portfolioContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  portfolioTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  memberItem: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    marginBottom: 5,
    borderRadius: 5,
  },
  selectedMemberItem: {
    backgroundColor: '#c0e0ff',
  },
  memberName: {
    fontSize: 16,
  },
  assignButton: {
    backgroundColor: '#0088cc',
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    borderRadius: 5,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  assignButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  confirmButton: {
    backgroundColor: '#0088cc',
    padding: 15,
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 10,
  },
  confirmButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  cancelButtonText: {
    color: '#333',
  },
});

export default AssignRolesScreen;
