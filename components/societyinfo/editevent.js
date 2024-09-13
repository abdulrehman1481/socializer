import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db, firebase } from '../../firebase';
import { Ionicons } from '@expo/vector-icons';

const EditEventScreen = ({ route, navigation }) => {
  const { societyId, event } = route.params;
  const [eventName, setEventName] = useState(event.name);
  const [eventDate, setEventDate] = useState(new Date(event.date));
  const [eventDescription, setEventDescription] = useState(event.description);
  const [eventLink, setEventLink] = useState(event.link || '');
  const [preEventNotificationTime, setPreEventNotificationTime] = useState(event.preEventNotificationTime || 24);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || eventDate;
    setShowDatePicker(false);
    setEventDate(currentDate);
  };

  const handleUpdateEvent = async () => {
    if (!eventName || !eventDate || !eventDescription) {
      Alert.alert("Please fill in all required fields.");
      return;
    }

    const updatedEvent = {
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
      const societyDoc = await societyRef.get();
      const updatedEvents = societyDoc.data().events.map(e =>
        e.name === event.name ? updatedEvent : e
      );
      await societyRef.update({
        events: updatedEvents,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      Alert.alert("Event updated successfully!");
      navigation.goBack(); // Go back to the previous screen
    } catch (error) {
      console.error("Error updating event:", error);
      Alert.alert("Error updating event. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Event</Text>
      </View>

      <Text style={styles.label}>Event Name</Text>
      <TextInput
        style={styles.input}
        value={eventName}
        onChangeText={setEventName}
        placeholder="Enter event name"
      />

      <Text style={styles.label}>Event Date</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
        <Text>{eventDate.toDateString()}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={eventDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      <Text style={styles.label}>Event Description</Text>
      <TextInput
        style={styles.input}
        value={eventDescription}
        onChangeText={setEventDescription}
        placeholder="Enter event description"
      />

      <Text style={styles.label}>Event Link</Text>
      <TextInput
        style={styles.input}
        value={eventLink}
        onChangeText={setEventLink}
        placeholder="Enter event link (optional)"
      />

      <Text style={styles.label}>Notify Users Before (hours)</Text>
      <TextInput
        style={styles.input}
        value={preEventNotificationTime.toString()}
        onChangeText={(value) => setPreEventNotificationTime(parseInt(value))}
        keyboardType="numeric"
        placeholder="Enter hours before event"
      />

      <TouchableOpacity style={styles.addButton} onPress={handleUpdateEvent}>
        <Text style={styles.addButtonText}>Update Event</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f0f0f0',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#ccc',
    },
    backButton: {
      marginRight: 10,
      backgroundColor: '#f18e37',
      borderRadius: 50,
      padding: 10,
    },
    headerTitle: {
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
    },
    deleteButtonText: {
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
export default EditEventScreen;
