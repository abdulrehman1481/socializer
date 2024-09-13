import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image } from 'react-native';
import { firebase } from '../../firebase'; // Adjust import as needed
import { Picker } from '@react-native-picker/picker';

const EditAboutScreen = ({ route, navigation }) => {
  const { societyId, info } = route.params;
  const [aboutInfo, setAboutInfo] = useState({
    role: '',
    name: '',
    quote: '',
    logo: '',
  });
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    if (info) {
      // If editing an existing card, set the initial state with provided info
      setAboutInfo(info);
    }

    setRoles(['President', 'Vice President', 'Secretary', 'Treasurer', 'Member']);
  }, [info]);

  const handleSave = async () => {
    try {
      const societyRef = firebase.firestore().collection('societies').doc(societyId);

      if (info) {
        // Update existing card
        await societyRef.update({
          aboutInfo: firebase.firestore.FieldValue.arrayRemove(info)
        });
        await societyRef.update({
          aboutInfo: firebase.firestore.FieldValue.arrayUnion(aboutInfo)
        });
      } else {
        // Add new card
        await societyRef.update({
          aboutInfo: firebase.firestore.FieldValue.arrayUnion(aboutInfo)
        });
      }
      navigation.goBack();
    } catch (error) {
      console.error("Error saving About info:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <Text style={styles.title}>{info ? 'Edit About Info' : 'Add New About Info'}</Text>

        <Text style={styles.label}>Role</Text>
        <Picker
          selectedValue={aboutInfo.role}
          style={styles.picker}
          onValueChange={(itemValue) => setAboutInfo({ ...aboutInfo, role: itemValue })}
        >
          {roles.map((role) => (
            <Picker.Item key={role} label={role} value={role} />
          ))}
        </Picker>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={aboutInfo.name}
          onChangeText={(text) => setAboutInfo({ ...aboutInfo, name: text })}
          placeholder="Enter name"
        />

        <Text style={styles.label}>Quote</Text>
        <TextInput
          style={styles.input}
          value={aboutInfo.quote}
          onChangeText={(text) => setAboutInfo({ ...aboutInfo, quote: text })}
          placeholder="Enter quote"
        />

        <Text style={styles.label}>Logo URL</Text>
        <TextInput
          style={styles.input}
          value={aboutInfo.logo}
          onChangeText={(text) => setAboutInfo({ ...aboutInfo, logo: text })}
          placeholder="Enter logo URL"
        />
        
        {/* Only display image if logo URL is provided */}
        {aboutInfo.logo ? (
          <Image source={{ uri: aboutInfo.logo }} style={styles.logoImage} />
        ) : null}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollViewContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fffffb',
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    color: '#fffffb',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#ffc145',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginVertical: 20,
    alignSelf: 'center',
  },
});

export default EditAboutScreen;
