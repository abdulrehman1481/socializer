import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform } from 'react-native';
import { firebase } from '../../firebase'; // Adjust import as needed
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons'; // Added more icons

const AboutSection = ({ route, navigation }) => {
  const { societyId } = route.params;
  const [aboutInfo, setAboutInfo] = useState([]); // Initialize as an array
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchAboutInfo = async () => {
      try {
        const societyDoc = await firebase.firestore().collection('societies').doc(societyId).get();
        if (societyDoc.exists) {
          const data = societyDoc.data().aboutInfo || [];
          setAboutInfo(data);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching About info:", error);
      }
    };

    const checkAdminStatus = async () => {
      const user = firebase.auth().currentUser;
      const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      setIsAdmin(userData?.isAdmin || false);
    };

    fetchAboutInfo();
    checkAdminStatus();
  }, [societyId]);

  const handleEditPress = (info) => {
    navigation.navigate('AddAbout', { societyId, info });
  };

  const handleDeletePress = async (info) => {
    try {
      const societyRef = firebase.firestore().collection('societies').doc(societyId);
      await societyRef.update({
        aboutInfo: firebase.firestore.FieldValue.arrayRemove(info)
      });
      // Remove the deleted card from state
      setAboutInfo((prevInfo) => prevInfo.filter((item) => item !== info));
    } catch (error) {
      console.error("Error deleting About info:", error);
    }
  };

  const handleAddNewPress = () => {
    navigation.navigate('AddAbout', { societyId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fffffb" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About the Society</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        {aboutInfo.length > 0 ? (
          aboutInfo.map((info, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.logoContainer}>
                {info.logo ? (
                  <Image source={{ uri: info.logo }} style={styles.logoImage} />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <FontAwesome name="image" size={50} color="#d3d3d3" />
                  </View>
                )}
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardRow}>
                  <MaterialIcons name="work-outline" size={20} color="#ffc145" />
                  <Text style={styles.cardTitle}>Role:</Text>
                  <Text style={styles.cardText}>{info.role || 'N/A'}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Ionicons name="person-outline" size={20} color="#ffc145" />
                  <Text style={styles.cardTitle}>Name:</Text>
                  <Text style={styles.cardText}>{info.name || 'N/A'}</Text>
                </View>
                <View style={styles.cardRow}>
                  <MaterialIcons name="format-quote" size={20} color="#ffc145" />
                  <Text style={styles.cardTitle}>Quote:</Text>
                  <Text style={styles.cardText}>{info.quote || 'N/A'}</Text>
                </View>
              </View>

              {isAdmin && (
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.editButton} onPress={() => handleEditPress(info)}>
                    <Ionicons name="create-outline" size={20} color="#333" />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeletePress(info)}>
                    <Ionicons name="trash-outline" size={20} color="black" />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.noInfoText}>No information available</Text>
        )}
      </ScrollView>
      {isAdmin && (
        <TouchableOpacity style={styles.addButton} onPress={handleAddNewPress}>
          <Ionicons name="add-circle-outline" size={20} color="#333" />
          <Text style={styles.addButtonText}>Add New Card</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    backgroundColor: '#474747',
    flexDirection: 'row',
    paddingVertical: Platform.OS === 'ios' ? 20 : 15,
    paddingHorizontal: 10,
    borderRadius: 80,
    marginBottom: Platform.OS === 'ios' ? 20 : 15,
    width: '70%',
    alignSelf: 'center',
    justifyContent: 'flex-start',
    marginTop: Platform.OS === 'ios' ? 0 : 40,
  },
  backButton: {
    paddingHorizontal: 10,
  },
  headerTitle: {
    color: '#fffffb',
    fontSize: 20,
    marginRight: 'auto',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  scrollViewContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 15,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    width: '100%',
    paddingHorizontal: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 5,
  },
  cardText: {
    fontSize: 16,
    color: '#d3d3d3',
    marginLeft: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#ffc145',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    marginRight: 5,
  },
  deleteButton: {
    backgroundColor: '#ff4d4d',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 5,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 5,
  },
  addButton: {
    backgroundColor: '#ffc145',
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  noInfoText: {
    color: '#d3d3d3',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default AboutSection;
