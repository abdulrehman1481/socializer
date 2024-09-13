import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert, Text, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { auth, db } from '../firebase';
import Page from '../components/homescreen/header';
import ContentCard from '../components/homescreen/content';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
  const [societies, setSocieties] = useState([]);
  const [filteredSocieties, setFilteredSocieties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const societySnapshot = await db.collection('societies').get();
        const societiesData = societySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSocieties(societiesData);
        setFilteredSocieties(societiesData);

        const user = auth.currentUser;
        if (user) {
          const userDoc = await db.collection('users').doc(user.uid).get();
          if (userDoc.exists) {
            setIsAdmin(userDoc.data().isAdmin);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        Alert.alert('Error', 'Could not fetch societies.');
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSocieties(societies);
    } else {
      const filtered = societies.filter(society => 
        society.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSocieties(filtered);
    }
  }, [searchTerm, societies]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const societySnapshot = await db.collection('societies').get();
      const societiesData = societySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSocieties(societiesData);
      setFilteredSocieties(societiesData);
    } catch (error) {
      console.error("Error refreshing data:", error);
      Alert.alert('Error', 'Could not refresh societies.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>  
      <Page searchTerm={searchTerm} setSearchTerm={setSearchTerm} navigation={navigation} />
    
      <View style={styles.container}>
        
        {isAdmin && (
          <View style={styles.adminPanel}>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => navigation.navigate('AddSociety')}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.contentContainer}>
          <FlatList
            data={filteredSocieties}
            renderItem={({ item }) => (
              <ContentCard
                logo={{ uri: item.logo || ' ' }}
                name={item.name}
                slogan={item.slogan}
                societyId={item.id}
                description={item.description}
                mainWork={item.mainWork || 'Not available'}
                isOpenForInterviews={item.isOpenForInterviews || false}
                isAdmin={true}
                onDelete={(id) => {
                  Alert.alert(
                    'Delete Society',
                    'Are you sure you want to delete this society?',
                    [
                      {
                        text: 'Cancel',
                        onPress: () => console.log('Cancel Pressed'),
                        style: 'cancel',
                      },
                      {
                        text: 'OK',
                        onPress: () => {
                          db.collection('societies').doc(id).delete()
                            .then(() => {
                              console.log(`Society with ID ${id} deleted successfully`);
                            })
                            .catch((error) => {
                              console.error(`Error deleting society with ID ${id}:`, error);
                            });
                        },
                      },
                    ],
                    { cancelable: false },
                  );
                }}
              />
            )}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.noSocietyText}>No society found.</Text>}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            }
          />
        </View>
        
      </View>
      
    </View>
  );
};

const deviceWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  contentContainer: {
    flex: 5,
  },
  adminPanel: {
    margin: 5,
    backgroundColor: '#121212',
    borderTopWidth: 0.1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#f18e37',  // Slightly brighter orange color
    padding: deviceWidth * 0.02,  // Dynamic padding
    borderRadius: 50,
    width: deviceWidth * 0.9,
    marginBottom: 0,
    marginLeft: deviceWidth * .04,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,  // For Android shadow
  },
  noSocietyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 18,
    color: '#333',
  },
});

export default HomeScreen;
