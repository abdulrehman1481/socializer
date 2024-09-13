import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Image, TouchableOpacity, Alert, KeyboardAvoidingView, ScrollView, Text } from 'react-native';
import { db, auth } from '../../firebase';
import { Ionicons } from '@expo/vector-icons';

const AddSocietyScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [logo, setLogo] = useState('');
  const [description, setDescription] = useState('');
  const [mainWork, setMainWork] = useState('');
  const [isOpenForInterviews, setIsOpenForInterviews] = useState(false);
  const [loading, setLoading] = useState(false);

  const addSociety = async () => {
    if (!name || !slogan || !logo || !description || !mainWork) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch user document
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (!userDoc.exists || !userDoc.data().isAdmin) {
        throw new Error('User does not have admin privileges');
      }

      const societyData = {
        name,
        slogan,
        logo,
        description,
        mainWork,
        isOpenForInterviews,
      };

      await db.collection('societies').add(societyData);
      Alert.alert('Success', 'Society added successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding society:', error.message);
      Alert.alert('Error', `Failed to add society: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
      </View>
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <TextInput
            placeholder="Society Name"
            value={name}
            onChangeText={(text) => setName(text)}
            style={styles.input}
          />
          <TextInput
            placeholder="Slogan"
            value={slogan}
            onChangeText={(text) => setSlogan(text)}
            style={styles.input}
          />
          <TextInput
            placeholder="Logo URL"
            value={logo}
            onChangeText={(text) => setLogo(text)}
            style={styles.input}
          />
          <TextInput
            placeholder="Description"
            value={description}
            onChangeText={(text) => setDescription(text)}
            style={styles.input}
          />
          <TextInput
            placeholder="Main Work"
            value={mainWork}
            onChangeText={(text) => setMainWork(text)}
            style={styles.input}
          />
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[styles.checkbox, isOpenForInterviews && styles.checkboxChecked]}
              onPress={() => setIsOpenForInterviews(!isOpenForInterviews)}
            >
              {isOpenForInterviews && <Ionicons name="checkmark" size={24} color="white" />}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>Open for Interviews</Text>
          </View>
          <Button title="Add Society" onPress={addSociety} disabled={loading} color="#f18e37" />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f18e37',
    padding: 10,
    paddingTop: 40,
  },
  headerButton: {
    padding: 10,
  },
  logo: {
    width: 100,
    height: 30,
    resizeMode: 'contain',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#1e90ff',
    borderColor: '#1e90ff',
  },
  checkboxLabel: {
    fontSize: 16,
  },
});

export default AddSocietyScreen;
