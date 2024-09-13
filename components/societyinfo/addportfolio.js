import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList, Image, SafeAreaView, RefreshControl } from 'react-native';
import { auth, db } from '../../firebase';
import { arrayUnion, arrayRemove } from 'firebase/firestore';
import debounce from 'lodash.debounce';
import { Ionicons } from '@expo/vector-icons';

const AddPortfolioScreen = ({ navigation, route }) => {
  const { societyId } = route.params;
  const [portfolioName, setPortfolioName] = useState('');
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [existingPortfolios, setExistingPortfolios] = useState([]);
  const [membersData, setMembersData] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [roles, setRoles] = useState({});


  
  useEffect(() => {
    fetchPortfolios();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearchDebounced(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);



  const fetchPortfolios = async () => {
    try {
      const societyDoc = await db.collection('societies').doc(societyId).get();
      if (societyDoc.exists) {
        const societyData = societyDoc.data();
        setExistingPortfolios(societyData.portfolios || []);
        setRoles(societyData.roles || {}); // Fetch roles
        
        if (societyData.portfolios) {
          const memberUids = societyData.portfolios.flatMap(portfolio => portfolio.members);
          const uniqueMemberUids = [...new Set(memberUids)];
          const membersData = {};
  
          for (const uid of uniqueMemberUids) {
            const userDoc = await db.collection('users').doc(uid).get();
            if (userDoc.exists) {
              membersData[uid] = userDoc.data();
            }
          }
          setMembersData(membersData);
        }
      } else {
        setExistingPortfolios([]);
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      Alert.alert('Error', 'Failed to fetch portfolios');
      setExistingPortfolios([]);
    }
  };
  
  const handleSearch = async (query) => {
    try {
      const snapshot = await db.collection('users')
        .where('username', '>=', query)
        .where('username', '<=', query + '\uf8ff')
        .get();

      const nameSnapshot = await db.collection('users')
        .where('name', '>=', query)
        .where('name', '<=', query + '\uf8ff')
        .get();

      const results = [
        ...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ...nameSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ];

      const uniqueResults = results.filter((item, index, self) =>
        index === self.findIndex((t) => (
          t.id === item.id
        ))
      );

      setSearchResults(uniqueResults);
    } catch (error) {
      console.error("Error searching for users:", error);
      Alert.alert('Error', 'Failed to search for users');
    }
  };

  const handleSearchDebounced = debounce((query) => handleSearch(query), 300);

  const handleAddPortfolio = async () => {
    try {
      if (!portfolioName.trim()) {
        Alert.alert('Error', 'Portfolio name is required');
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const newPortfolio = {
        name: portfolioName,
        members: [...members],
      };

      await db.collection('societies').doc(societyId).update({
        portfolios: arrayUnion(newPortfolio),
      });

      Alert.alert('Success', 'Portfolio added successfully');
      fetchPortfolios();
      navigation.goBack();
    } catch (error) {
      console.error('Error adding portfolio:', error);
      Alert.alert('Error', 'Failed to add portfolio');
    }
  };

  const handleAddMember = async (uid) => {
    if (uid.trim() && !members.includes(uid)) {
      setMembers([...members, uid.trim()]);
  
      try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          setMembersData((prevMembersData) => ({ ...prevMembersData, [uid]: userData }));
  
          // Add a notification to the user's database
          const notificationMessage = `You have been added to the portfolio "${portfolioName}" in society ${societyId}.`;
          await db.collection('users').doc(uid).collection('notifications').add({
            message: notificationMessage,
            timestamp: new Date(),
            read: false, // Mark as unread by default
          });
  
          Alert.alert("Success", "Member added and notification sent.");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }
  };
  
  const handleRemoveMember = async (portfolioName, memberUid) => {
    Alert.alert(
      'Confirm Removal',
      'Are you sure you want to remove this member?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            try {
              const societyDoc = await db.collection('societies').doc(societyId).get();
              if (!societyDoc.exists) {
                Alert.alert('Error', 'Society not found');
                return;
              }
  
              const societyData = societyDoc.data();
              const portfolios = societyData.portfolios || [];
              const roles = societyData.roles || {};
  
              // Remove the member from the roles
              Object.keys(roles).forEach((portfolioName) => {
                const portfolioRoles = roles[portfolioName];
                if (portfolioRoles) {
                  Object.keys(portfolioRoles).forEach((role) => {
                    const roleData = portfolioRoles[role];
                    if (Array.isArray(roleData)) {
                      roles[portfolioName][role] = roleData.filter((member) => member !== memberUid);
                      if (roles[portfolioName][role].length === 0) {
                        delete roles[portfolioName][role];
                      }
                    } else if (roleData === memberUid) {
                      delete roles[portfolioName][role];
                    }
                  });
                  // Remove the portfolio if there are no roles left
                  if (Object.keys(roles[portfolioName]).length === 0) {
                    delete roles[portfolioName];
                  }
                }
              });
  
              // Remove the member from the portfolios
              const updatedPortfolios = portfolios.map((portfolio) => {
                if (portfolio.name === portfolioName) {
                  return {
                    ...portfolio,
                    members: portfolio.members.filter((member) => member !== memberUid),
                  };
                }
                return portfolio;
              });
  
              await db.collection('societies').doc(societyId).update({
                portfolios: updatedPortfolios,
                roles: roles,
              });
  
              // Add a notification to the user's database
              const notificationMessage = `You have been removed from the portfolio "${portfolioName}" in society ${societyId}.`;
              await db.collection('users').doc(memberUid).collection('notifications').add({
                message: notificationMessage,
                timestamp: new Date(),
                read: false,
              });
  
              Alert.alert('Success', 'Member removed and notification sent.');
              fetchPortfolios();
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', 'Failed to remove member');
            }
          },
        },
      ]
    );
  };
  

  const handleDeletePortfolio = async (portfolioName) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this portfolio?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'OK',
          onPress: async () => {
            try {
              const societyDoc = await db.collection('societies').doc(societyId).get();
              if (societyDoc.exists) {
                const portfolios = societyDoc.data().portfolios || [];
                const updatedPortfolios = portfolios.filter(portfolio => portfolio.name !== portfolioName);
                await db.collection('societies').doc(societyId).update({
                  portfolios: updatedPortfolios,
                });

                Alert.alert('Success', 'Portfolio deleted successfully');
                fetchPortfolios();
              } else {
                Alert.alert('Error', 'Society not found');
              }
            } catch (error) {
              console.error('Error deleting portfolio:', error);
              Alert.alert('Error', 'Failed to delete portfolio');
            }
          }
        }
      ]
    );
  };

  const handleUnselectMember = (uid) => {
    setMembers(members.filter(member => member !== uid));
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPortfolios();
    setRefreshing(false);
  }, []);

  const renderPortfolioItem = ({ item }) => (
    <View style={styles.portfolioContainer}>
      <Text style={styles.portfolioName}>{item.name}</Text>
      {item.members.map((member, idx) => (
        <View key={idx} style={styles.portfolioMember}>
          <Text style={styles.memberItem}>{membersData[member] && membersData[member].name}</Text>
          <Text style={styles.memberItem}>{membersData[member] && membersData[member].cmsId}</Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveMember(item.name, member)}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        style={styles.addMemberButton}
        onPress={() => navigation.navigate('AddMemberScreen', { societyId, portfolioName: item.name })}
      >
        <Text style={styles.addMemberButtonText}>Add Member</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deletePortfolioButton}
        onPress={() => handleDeletePortfolio(item.name)}
      >
        <Ionicons name="trash-outline" size={24} color="red" />
      </TouchableOpacity>
    </View>
  );

  const renderSelectedMember = (member) => (
    <View key={member} style={styles.selectedMember}>
      <Text style={styles.selectedMemberName}>{membersData[member]?.name || member}</Text>
      <TouchableOpacity onPress={() => handleUnselectMember(member)}>
        <Ionicons name="close-circle-outline" size={20} color="red" />
      </TouchableOpacity>
    </View>
  );

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity onPress={() => handleAddMember(item.id)}      style={styles.searchResultItem}>
    <Text>{item.name} ({item.username})</Text>
  </TouchableOpacity>
);

return (
  <SafeAreaView style={styles.container}>
    <Text style={styles.heading}>Add New Portfolio</Text>
    <TextInput
      placeholder="Portfolio Name"
      value={portfolioName}
      onChangeText={setPortfolioName}
      style={styles.input}
    />
    <TextInput
      placeholder="Search Members"
      value={searchQuery}
      onChangeText={setSearchQuery}
      style={styles.input}
    />
    <FlatList
      data={searchResults}
      renderItem={renderSearchResult}
      keyExtractor={(item) => item.id}
      style={styles.searchResultsList}
    />
    <View style={styles.selectedMembersContainer}>
      {members.map(renderSelectedMember)}
    </View>
    <TouchableOpacity style={styles.button} onPress={handleAddPortfolio}>
      <Text style={styles.buttonText}>Add Portfolio</Text>
    </TouchableOpacity>
    <FlatList
      data={existingPortfolios}
      renderItem={renderPortfolioItem}
      keyExtractor={(item) => item.name}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      style={styles.portfolioList}
    />
   
    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('AssignRoles', { societyId })}>
      <Text style={styles.buttonText}>Assign Roles</Text>
    </TouchableOpacity>
  </SafeAreaView>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Light gray background
    padding: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3498db', // Bright blue color for headings
    marginVertical: 20,
    textAlign: 'center',
  },
  input: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginVertical: 12,
    backgroundColor: '#fff', // White background for inputs
    shadowColor: '#000', // Added shadow for better visibility on iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3, // Elevation for Android shadow
  },
  searchResultsList: {
    marginVertical: 10,
    height: 300,
    borderRadius: 20,
  },
  searchResultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#f9f9f9', // Light gray background for search results
  },
  selectedMembersContainer: {
    marginVertical: 20,
  },
  selectedMember: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff', // White background for selected members
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedMemberName: {
    fontSize: 16,
    color: '#333', // Darker color for better readability
  },
  button: {
    backgroundColor: '#3498db', // Bright blue color for buttons
    padding: 16,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  portfolioList: {
    marginVertical: 20,
    borderRadius: 10,
    backgroundColor: '#141414', // Light gray background for portfolios
    
  },
  portfolioContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#141414',
    backgroundColor: '#1e1e1e', // White background for portfolios
    borderRadius: 19,
    shadowColor: '#000',
    marginTop: 10,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  portfolioName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3498db', // Bright blue color for portfolio names
  },
  portfolioMember: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
  },
  memberItem: {
    fontSize: 16,
    color: '#cff', // Darker color for member details
  },
  removeButton: {
    backgroundColor: '#e74c3c', // Color for remove buttons
    padding: 8,
    borderRadius: 8,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addMemberButton: {
    backgroundColor: '#ffc145', // Green color for add member button
    padding: 8,
    borderRadius: 8,
  },
  addMemberButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deletePortfolioButton: {
    padding: 8,
    alignItems: 'center',
  },
});

export default AddPortfolioScreen;