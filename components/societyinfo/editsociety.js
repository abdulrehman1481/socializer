import React, { useState, useEffect } from 'react';
import { View, Button, StyleSheet, Alert, Text, ScrollView, TextInput, TouchableOpacity, Platform } from 'react-native';
import { db, auth } from '../../firebase';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

// NUST building locations with coordinates
const nustBuildings = [
  { name: 'Concordia 1', coordinates: [33.6416, 72.9934] },
  { name: 'Concordia 2', coordinates: [33.6411, 72.9938] },
  { name: 'SMME (School of Mechanical and Manufacturing Engineering)', coordinates: [33.6470, 72.9906] },
  { name: 'SEECS (School of Electrical Engineering and Computer Science)', coordinates: [33.6449, 72.9902] },
  { name: 'NBS (NUST Business School)', coordinates: [33.6445, 72.9887] },
  { name: 'NIT (National Institute of Transportation)', coordinates: [33.6451, 72.9862] },
  { name: 'CIPS (Center for Innovation and Policy Studies)', coordinates: [33.6472, 72.9937] },
  { name: 'RCMS (Research Center for Modeling and Simulation)', coordinates: [33.6487, 72.9945] },
  { name: 'PNEC (Pakistan Navy Engineering College)', coordinates: [24.9056, 67.1167] },
];

const EditSocietyScreen = ({ route, navigation }) => {
  const { societyId } = route.params;
  const [society, setSociety] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [originalInterviewStatus, setOriginalInterviewStatus] = useState(null);

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
            setLocations(societyData.locations.map((loc, index) => ({ id: index, name: loc.name, coordinates: loc.coordinates })));
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
        updatedSociety.locations = locations
          .filter(loc => loc.name && loc.coordinates.length === 2)
          .map(location => ({
            name: location.name,
            coordinates: location.coordinates,
          }));
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
        });
      });
    } catch (error) {
      console.error("Error notifying users:", error);
    }
  };

  const handleLocationSelect = (name) => {
    const selected = nustBuildings.find(location => location.name === name);
    if (selected) {
      setSelectedLocation(selected);
      setLocations([...locations, { id: locations.length, name: selected.name, coordinates: selected.coordinates }]);
    }
  };

  const addLocationField = () => {
    setLocations([...locations, { id: locations.length, name: '', coordinates: [] }]);
  };

  const toggleInterviewStatus = () => {
    const newStatus = !society.isOpenForInterviews;
    setSociety(prevState => ({ ...prevState, isOpenForInterviews: newStatus }));
    if (!newStatus) {
      setLocations([{ id: 0, name: '', coordinates: [] }]);
    }
  };

  const handleInputChange = (field, value) => {
    setSociety(prevState => ({ ...prevState, [field]: value }));
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
          placeholder="Society Name"
          placeholderTextColor="#A9A9A9"
        />
        <Text style={styles.label}>Slogan:</Text>
        <TextInput
          style={styles.input}
          value={society.slogan}
          onChangeText={(value) => handleInputChange('slogan', value)}
          placeholder="Slogan"
          placeholderTextColor="#A9A9A9"
        />
        <Text style={styles.label}>Description:</Text>
        <TextInput
          style={styles.input}
          value={society.description}
          onChangeText={(value) => handleInputChange('description', value)}
          placeholder="Description"
          placeholderTextColor="#A9A9A9"
          multiline
        />
        <Text style={styles.label}>Main Work:</Text>
        <TextInput
          style={styles.input}
          value={society.mainWork}
          onChangeText={(value) => handleInputChange('mainWork', value)}
          placeholder="Main Work"
          placeholderTextColor="#A9A9A9"
        />
        <Text style={styles.label}>Instagram (optional):</Text>
        <TextInput
          style={styles.input}
          value={society.instagram || ''}
          onChangeText={(value) => handleInputChange('instagram', value)}
          placeholder="Instagram"
          placeholderTextColor="#A9A9A9"
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
            <Picker
              selectedValue={selectedLocation?.name}
              style={styles.picker}
              onValueChange={(itemValue) => handleLocationSelect(itemValue)}
            >
              {nustBuildings.map((building, index) => (
                <Picker.Item key={index} label={building.name} value={building.name} />
              ))}
            </Picker>

            {locations.map((location, index) => (
              <View key={index} style={styles.locationContainer}>
                <Text style={styles.locationText}>{location.name} (Lat: {location.coordinates[0]}, Lng: {location.coordinates[1]})</Text>
              </View>
            ))}

            <TouchableOpacity onPress={addLocationField} style={styles.addLocationButton}>
              <Text style={styles.addLocationButtonText}>Add Custom Location</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
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
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    color: '#F2F2F2',
    fontWeight: 'bold',
  },
  scrollViewContainer: {
    paddingHorizontal: 10,
    paddingBottom: 30,
  },
  label: {
    fontSize: 18,
    color: '#F2F2F2',
    marginVertical: 10,
  },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#F2F2F2',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginVertical: 10,
  },
  openForInterviewButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  notOpenForInterviewButton: {
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  openForInterviewButtonText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
  },
  picker: {
    backgroundColor: '#1E1E1E',
    color: '#F2F2F2',
    marginVertical: 10,
  },
  locationContainer: {
    backgroundColor: '#1E1E1E',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  locationText: {
    color: '#F2F2F2',
  },
  addLocationButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  addLocationButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    margin: 20,
  },
  saveButtonText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#F2F2F2',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
});

export default EditSocietyScreen;
