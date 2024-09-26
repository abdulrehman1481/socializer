import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, FlatList, SafeAreaView, RefreshControl } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db, firebase } from '../../firebase';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

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
const AddEventScreen = ({ route, navigation }) => {
  const { societyId, event } = route.params || {};
  const [events, setEvents] = useState([]);
  const [eventName, setEventName] = useState(event ? event.name : '');
  const [eventDate, setEventDate] = useState(event ? new Date(event.date) : new Date());
  const [eventDescription, setEventDescription] = useState(event ? event.description : '');
  const [eventLink, setEventLink] = useState(event ? event.link || '' : '');
  const [preEventNotificationTime, setPreEventNotificationTime] = useState(event ? event.preEventNotificationTime || 24 : 24);
  const [selectedLocation, setSelectedLocation] = useState(event ? event.location : '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const societyDoc = await db.collection('societies').doc(societyId).get();
      if (societyDoc.exists) {
        setEvents(societyDoc.data().events || []);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert('Error', 'Failed to fetch events');
    }
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || eventDate;
    setShowDatePicker(false);
    setEventDate(currentDate);
  };

  const handleAddOrUpdateEvent = async () => {
    if (!eventName || !eventDate || !eventDescription || !selectedLocation) {
        Alert.alert("Please fill in all required fields.");
        return;
    }

    // Find the coordinates for the selected location
    const selectedBuilding = nustBuildings.find(building => building.name === selectedLocation);
    const coordinates = selectedBuilding ? selectedBuilding.coordinates : [null, null]; // Default to [null, null] if not found

    const newEvent = {
        name: eventName,
        date: eventDate.toISOString(),
        description: eventDescription,
        link: eventLink || '',
        updatedBy: firebase.auth().currentUser.uid,
        updatedAt: new Date().toISOString(),
        preEventNotificationTime,
        location: selectedLocation,
        coordinates: coordinates, // Add coordinates to the event
    };

    try {
        const societyRef = db.collection('societies').doc(societyId);

        if (event) {
            const societyDoc = await societyRef.get();
            const updatedEvents = societyDoc.data().events.map(e =>
                e.name === event.name ? newEvent : e
            );
            await societyRef.update({
                events: updatedEvents,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
            Alert.alert("Event updated successfully!");
            await notifyUsers(`The event "${eventName}" was updated by ${firebase.auth().currentUser.displayName}.`);
        } else {
            await societyRef.update({
                events: firebase.firestore.FieldValue.arrayUnion(newEvent),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
            Alert.alert("Event added successfully!");
            await notifyUsers(`A new event "${eventName}" was added by ${firebase.auth().currentUser.displayName}.`);
        }

        fetchEvents();
        resetForm();
    } catch (error) {
        console.error("Error adding/updating event:", error);
        Alert.alert("Error adding/updating event. Please try again.");
    }
};


  const notifyUsers = async (message) => {
    const usersSnapshot = await db.collection('users').where('societies', 'array-contains', societyId).get();
    usersSnapshot.forEach(async (userDoc) => {
      await db.collection('notifications').add({
        userId: userDoc.id,
        message,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        read: false,
      });
    });
  };

  const handleDeleteEvent = async (eventName) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const societyDoc = await db.collection('societies').doc(societyId).get();
              const updatedEvents = societyDoc.data().events.filter(e => e.name !== eventName);
              await db.collection('societies').doc(societyId).update({
                events: updatedEvents,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
              });
              Alert.alert("Event deleted successfully!");
              fetchEvents();
            } catch (error) {
              console.error("Error deleting event:", error);
              Alert.alert("Error deleting event. Please try again.");
            }
          }
        }
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, []);

  const resetForm = () => {
    setEventName('');
    setEventDate(new Date());
    setEventDescription('');
    setEventLink('');
    setPreEventNotificationTime(24);
    setSelectedLocation('');
  };

  const handleEditEvent = (item) => {
    navigation.navigate('EditEvent', { event: item, societyId });
  };

  const renderEventItem = ({ item }) => (
    <View style={styles.eventContainer}>
      <Text style={styles.eventName}>{item.name}</Text>
      <Text style={styles.eventDate}>{new Date(item.date).toDateString()}</Text>
      <Text style={styles.eventDescription}>{item.description}</Text>
      {item.link ? (
        <Text style={styles.eventLink}>Link: {item.link}</Text>
      ) : null}
      <Text style={styles.eventLocation}>Location: {item.location}</Text>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => handleEditEvent(item)}
      >
        <Text style={styles.editButtonText}>Edit Event</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteEvent(item.name)}
      >
        <Text style={styles.deleteButtonText}>Delete Event</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{event ? "Edit Event" : "Add Event"}</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Event Name:</Text>
        <TextInput
          style={styles.input}
          value={eventName}
          onChangeText={setEventName}
          placeholder="Enter event name"
        />

        <Text style={styles.label}>Event Date:</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
          <Text>{eventDate.toDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={eventDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        <Text style={styles.label}>Event Description:</Text>
        <TextInput
          style={styles.input}
          value={eventDescription}
          onChangeText={setEventDescription}
          placeholder="Enter event description"
        />

        <Text style={styles.label}>Event Link (optional):</Text>
        <TextInput
          style={styles.input}
          value={eventLink}
          onChangeText={setEventLink}
          placeholder="Enter event link"
        />

        <Text style={styles.label}>Notify Users Before (hours):</Text>
        <TextInput
          style={styles.input}
          value={String(preEventNotificationTime)}
          onChangeText={text => setPreEventNotificationTime(Number(text))}
          placeholder="Enter hours"
          keyboardType="numeric"
        />
        
        <Text style={styles.label}>Select Location:</Text>
        <Picker
          selectedValue={selectedLocation}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedLocation(itemValue)}
        >
          <Picker.Item label="Select Location" value="" />
          {nustBuildings.map((building, index) => (
            <Picker.Item key={index} label={building.name} value={building.name} />
          ))}
        </Picker>

        <TouchableOpacity style={styles.submitButton} onPress={handleAddOrUpdateEvent}>
          <Text style={styles.submitButtonText}>{event ? "Update Event" : "Add Event"}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={item => item.name}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
    justifyContent: 'center',
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  eventContainer: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 8,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventDate: {
    fontSize: 14,
    color: '#555',
  },
  eventDescription: {
    fontSize: 14,
    marginVertical: 4,
  },
  eventLink: {
    fontSize: 14,
    color: '#007BFF',
  },
  eventLocation: {
    fontSize: 14,
    color: '#777',
  },
  editButton: {
    backgroundColor: '#FFC107',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AddEventScreen;
