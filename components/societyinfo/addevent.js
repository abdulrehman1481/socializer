import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, FlatList, SafeAreaView, RefreshControl } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db, firebase } from '../../firebase';
import { Ionicons } from '@expo/vector-icons';

const AddEventScreen = ({ route, navigation }) => {
  const { societyId, event } = route.params || {};
  const [events, setEvents] = useState([]);
  const [eventName, setEventName] = useState(event ? event.name : '');
  const [eventDate, setEventDate] = useState(event ? new Date(event.date) : new Date());
  const [eventDescription, setEventDescription] = useState(event ? event.description : '');
  const [eventLink, setEventLink] = useState(event ? event.link || '' : '');
  const [preEventNotificationTime, setPreEventNotificationTime] = useState(event ? event.preEventNotificationTime || 24 : 24);
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
    if (!eventName || !eventDate || !eventDescription) {
      Alert.alert("Please fill in all required fields.");
      return;
    }

    const newEvent = {
      name: eventName,
      date: eventDate.toISOString(),
      description: eventDescription,
      link: eventLink || '',
      updatedBy: firebase.auth().currentUser.uid,
      updatedAt: new Date().toISOString(),
      preEventNotificationTime,
    };

    try {
      const societyRef = db.collection('societies').doc(societyId);

      if (event) {
        // Update existing event
        const societyDoc = await societyRef.get();
        const updatedEvents = societyDoc.data().events.map(e =>
          e.name === event.name ? newEvent : e
        );
        await societyRef.update({
          events: updatedEvents,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        Alert.alert("Event updated successfully!");

        // Notify users
        await notifyUsers(`The event "${eventName}" was updated by ${firebase.auth().currentUser.displayName}.`);

      } else {
        // Add new event
        await societyRef.update({
          events: firebase.firestore.FieldValue.arrayUnion(newEvent),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        Alert.alert("Event added successfully!");

        // Notify users
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
          value={preEventNotificationTime.toString()}
          onChangeText={(value) => setPreEventNotificationTime(parseInt(value))}
          keyboardType="numeric"
          placeholder="Enter hours before event"
        />

        <TouchableOpacity style={styles.addButton} onPress={handleAddOrUpdateEvent}>
          <Text style={styles.addButtonText}>{event ? "Update Event" : "Add Event"}</Text>
        </TouchableOpacity>

        {event && (
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteEvent(event.name)}>
            <Text style={styles.deleteButtonText}>Delete Event</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.name}
        renderItem={renderEventItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.eventsContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  backButton: {
    marginRight: 0,
    backgroundColor: '#f18e37',
    borderRadius: 50,
    padding: 10,
  },
  headerTitle: {
    marginRight: 'auto',
    marginLeft: 'auto',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  inputContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  dateInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: '#f18e37',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#d9534f',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  editButton: {
    backgroundColor: '#5bc0de',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  eventsContainer: {
    padding: 20,
  },
  eventContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  eventDate: {
    fontSize: 16,
    marginBottom: 5,
  },
  eventDescription: {
    fontSize: 16,
    marginBottom: 5,
  },
  eventLink: {
    fontSize: 16,
    color: '#007bff',
  },
});

export default AddEventScreen;
