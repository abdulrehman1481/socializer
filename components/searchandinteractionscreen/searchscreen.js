import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { db } from '../../firebase'; 
import BottomTabs from '../homescreen/bottomtabs';

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery) {
        try {
          const usersSnapshot = await db.collection('users')
            .where('name', '>=', searchQuery)
            .where('name', '<=', searchQuery + '\uf8ff')
            .get();

          const usersData = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setResults(usersData);
        } catch (error) {
          console.error("Error fetching search results:", error);
        }
      } else {
        setResults([]);
      }
    };

    fetchResults();
  }, [searchQuery]);

  const handlePress = (user) => {
    navigation.navigate('UserProfile', { userId: user.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search-outline" size={24} color="#888" style={styles.searchIcon} />
        <TextInput
          placeholder="Search by name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>
      <FlatList
        data={results}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => handlePress(item)}>
            <Text style={styles.itemText}>{item.name}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
      />

    </SafeAreaView>
  );
};

const colors = {
  primary: '#474747', // Primary color
  secondary: '#ffc145', // Secondary color
  background: '#474747', // Background color for the screen
  cardBackground: '#fff', // Card background color
  border: '#333', // Border color
  textPrimary: '#fffffb', // Primary text color
  textSecondary: '#333', // Secondary text color
  searchIcon: '#888', // Search icon color
  headerBackground: '#474747', // Header background color
  headerText: '#fffffb', // Header text color
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    paddingVertical: Platform.OS === 'ios' ? 15 : 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 20,
  },
  headerTitle: {
    fontSize: 30,

    fontWeight: 'bold',
    color: colors.headerText,
    flex: 1,
    marginTop: Platform.OS === 'ios' ? -10 : 5,
  
   textAlign: 'center',

  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    margin: 15,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontSize: 16,
    color: 'black',
    // backgroundColor: '#f0f0f0', // Changed to a light gray for better contrast
    borderRadius: 5, // Rounded corners for consistency
  },
  searchIcon: {
    marginRight: 10,
  },
  item: {
    padding: 15,
    backgroundColor: '#e0e0e0', // Changed to a light gray for better contrast
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemText: {
    fontSize: 18,
    color: colors.textSecondary, // Changed to a darker color for better readability
  },
});


export default SearchScreen;
