import React, { useState, useEffect } from 'react';
import { View, Button, StyleSheet, Alert, Text, ScrollView, TextInput, TouchableOpacity , Platform} from 'react-native';
import { db, auth } from '../../firebase';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

const EditSocietyScreen = ({ route, navigation }) => {
  const { societyId } = route.params;
  const [society, setSociety] = useState(null);
  const [originalInterviewStatus, setOriginalInterviewStatus] = useState(null);
  const [locations, setLocations] = useState([{ id: 0, name: '' }]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await db.collection('users').doc(user.uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData.isAdmin || userData.societyId === societyId) {
              fetchSociety();
            } else {
              Alert.alert("Access Denied", "You do not have permission to edit societies.");
              navigation.goBack();
            }
          }
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      }
    };

    const fetchSociety = async () => {
      try {
        const societyDoc = await db.collection('societies').doc(societyId).get();
        if (societyDoc.exists) {
          const societyData = societyDoc.data();
          setSociety(societyData);
          setOriginalInterviewStatus(societyData.isOpenForInterviews);
          if (societyData.locations) {
            setLocations(societyData.locations.map((loc, index) => ({ id: index, name: loc })));
          }
        }
      } catch (error) {
        console.error("Error fetching society details:", error);
      }
    };

    checkAdminStatus();
  }, [societyId]);

  const handleSave = async () => {
    try {
      const updatedSociety = { ...society };

      if (society.isOpenForInterviews) {
        updatedSociety.locations = locations.map(location => location.name).filter(name => name);
      } else {
        updatedSociety.locations = [];
      }

      await db.collection('societies').doc(societyId).update(updatedSociety);

      if (society.isOpenForInterviews !== originalInterviewStatus) {
        notifyUsers();
      }

      Alert.alert('Success', 'Society updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error("Error updating society:", error);
      Alert.alert('Error', `Could not update society: ${error.message}`);
    }
  };

  const notifyUsers = async () => {
    try {
      const usersSnapshot = await db.collection('users').get();
      usersSnapshot.forEach(async (userDoc) => {
        await db.collection('notifications').add({
          userId: userDoc.id,
          message: `The interview status for ${society.name} has changed to ${society.isOpenForInterviews ? 'open' : 'closed'}.`,
          createdAt: new Date()
        })
      });
    } catch (error) {
      console.error("Error notifying users:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setSociety(prevState => ({ ...prevState, [field]: value }));
  };

  const handleLocationChange = (id, value) => {
    const updatedLocations = locations.map(location =>
      location.id === id ? { ...location, name: value } : location
    );
    setLocations(updatedLocations);
  };

  const addLocationField = () => {
    setLocations([...locations, { id: locations.length, name: '' }]);
  };

  const toggleInterviewStatus = () => {
    const newStatus = !society.isOpenForInterviews;
    setSociety(prevState => ({ ...prevState, isOpenForInterviews: newStatus }));
    if (!newStatus) {
      setLocations([{ id: 0, name: '' }]);
    }
  };

  if (!society) {
    return <Text style={styles.loadingText}>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
       <Ionicons name="arrow-back" size={24} color="#F2F2F2" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Edit Society</Text>
    </View>
    <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <TextInput
          style={styles.input}
          value={society.name}
          onChangeText={(value) => handleInputChange('name', value)}
        />
        <Text style={styles.label}>Slogan:</Text>
        <TextInput
          style={styles.input}
          value={society.slogan}
          onChangeText={(value) => handleInputChange('slogan', value)}
        />
        <Text style={styles.label}>Description:</Text>
        <TextInput
          style={styles.input}
          value={society.description}
          onChangeText={(value) => handleInputChange('description', value)}
          multiline
        />
        <Text style={styles.label}>Main Work:</Text>
        <TextInput
          style={styles.input}
          value={society.mainWork}
          onChangeText={(value) => handleInputChange('mainWork', value)}
        />
        <Text style={styles.label}>Instagram (optional):</Text>
        <TextInput
          style={styles.input}
          value={society.instagram || ''}
          onChangeText={(value) => handleInputChange('instagram', value)}
        />
               <Text style={styles.label}>Open for Interviews:</Text>
        <TouchableOpacity
          onPress={toggleInterviewStatus}
          style={society.isOpenForInterviews ? styles.openForInterviewButton : styles.notOpenForInterviewButton}
        >
          <Text style={styles.openForInterviewButtonText}>{society.isOpenForInterviews ? 'Yes' : 'No'}</Text>
        </TouchableOpacity>
        {society.isOpenForInterviews && (
          <View>
            <Text style={styles.label}>Interview Locations (optional):</Text>
            {locations.map(location => (
              <TextInput
                key={location.id}
                style={styles.input}
                value={location.name}
                onChangeText={(value) => handleLocationChange(location.id, value)}
                placeholder={`Location ${location.id + 1}`}
              />
            ))}
            <TouchableOpacity onPress={addLocationField} style={styles.addLocationButton}>
              <Text style={styles.addLocationButtonText}>Add Location</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.saveButtonContainer}>
          <Button title="Save" onPress={handleSave} color="#2196F3" />
        </View>
      </ScrollView>
    </View>
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
    width: 300,
    alignSelf: 'center',
    justifyContent: 'flex-start',
    marginTop: Platform.OS === 'ios' ? 0 : 40,
  },
  backButton: {
    paddingHorizontal: 10,
  },
  headerTitle: {
    color: '#F2F2F2ffb',
    fontSize: Platform.OS === 'ios' ? 20 : 20,
    fontWeight: 'bold',
    marginLeft: Platform.OS === 'ios' ? 30 : 30,
  },
  scrollViewContainer: {
    padding: 20,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 18,
    color: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#fff',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  openForInterviewButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  notOpenForInterviewButton: {
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  openForInterviewButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  addLocationButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  addLocationButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  saveButtonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
});

export default EditSocietyScreen;