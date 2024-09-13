import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, Image } from 'react-native';
import { db, firebase } from '../../firebase'; // Ensure this import is correct
import debounce from 'lodash.debounce';

const AddMemberScreen = ({ route, navigation }) => {
  const { portfolioName, societyId } = route.params;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [portfolioMembers, setPortfolioMembers] = useState([]);

  useEffect(() => {
    fetchPortfolioMembers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearchDebounced(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchPortfolioMembers = async () => {
    try {
      const societyDoc = await db.collection('societies').doc(societyId).get();
      if (societyDoc.exists) {
        const societyData = societyDoc.data();
        const portfolio = societyData.portfolios.find(p => p.name === portfolioName);
        if (portfolio) {
          setPortfolioMembers(portfolio.members || []);
        }
      } else {
        Alert.alert('Error', 'Society document not found');
      }
    } catch (error) {
      console.error('Error fetching portfolio members:', error);
      Alert.alert('Error', 'Failed to fetch portfolio members');
    }
  };

  const handleSearch = async (query) => {
    try {
      const userSnapshot = await db.collection('users')
        .where('username', '>=', query)
        .where('username', '<=', query + '\uf8ff')
        .get();

      const nameSnapshot = await db.collection('users')
        .where('name', '>=', query)
        .where('name', '<=', query + '\uf8ff')
        .get();

      const results = [
        ...userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ...nameSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ];

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching for users:', error);
      Alert.alert('Error', 'Failed to search for users');
    }
  };

  const handleSearchDebounced = debounce((query) => handleSearch(query), 300);

  const handleAddMember = async (uid, username, name, department, cmsId) => {
    if (!uid.trim() || portfolioMembers.includes(uid)) {
      Alert.alert('Error', 'Member already added or invalid UID');
      return;
    }
  
    try {
      const societyDocRef = db.collection('societies').doc(societyId);
      const societyDoc = await societyDocRef.get();
  
      if (!societyDoc.exists) {
        throw new Error('Society not found');
      }
  
      const societyData = societyDoc.data();
  
      // Make sure portfolioName exists and is a string
      if (!portfolioName || typeof portfolioName !== 'string') {
        throw new Error('Invalid portfolio name');
      }
  
      const updatedPortfolios = societyData.portfolios.map((portfolio) => {
        // Make sure portfolio.name exists and is a string
        if (portfolio.name && typeof portfolio.name === 'string' && portfolio.name.trim() === portfolioName.trim()) {
          // Add the new member UID to the members array
          const updatedMembers = [...portfolio.members, uid.trim()];
          return {
            ...portfolio,
            members: updatedMembers,
          };
        }
        return portfolio;
      });
  
      await societyDocRef.update({
        portfolios: updatedPortfolios,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(), // Optional: update timestamp
      });
  
      console.log('Member added:', { uid, username, name, department, cmsId });
      Alert.alert('Success', `Member ${name} added successfully`);

      // Refresh data after the update
      fetchPortfolioMembers();
      navigation.goBack(); // Navigate back to the previous screen
    } catch (error) {
      console.error('Error adding member:', error);
      Alert.alert('Error', `Failed to add member: ${error.message}`);
    }
  };
  

  const renderSearchResultItem = ({ item }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleAddMember(item.id, item.username, item.name, item.department, item.cmsId)}
    >
      <Image
        source={{ uri: item.profilePictureUrl || 'https://via.placeholder.com/40' }} // Fallback image URL
        style={styles.profilePicture}
      />
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.details}>{item.name} - {item.department} {item.cmsId}</Text>
        <Text style={styles.details}>Email: {item.email}</Text>
        <Text style={styles.details}>Phone: {item.phone}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Search Members:</Text>
      <TextInput
        style={styles.input}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Enter username or name to search"
      />
      {searchResults.length > 0 && (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={renderSearchResultItem}
          style={styles.searchResultsList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  details: {
    fontSize: 14,
    color: '#666',
  },
  searchResultsList: {
    marginTop: 16,
  },
});

export default AddMemberScreen;