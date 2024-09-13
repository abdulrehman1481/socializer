import { View, Image, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import SignUpBasicInfo from '../components/signupscreen/signupform';

const SignupScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={30} color="white" />
          </TouchableOpacity>
        </View>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
        <SignUpBasicInfo navigation={navigation} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
    paddingHorizontal: 10,
    paddingVertical: 2, // Consistent with SignUpAdditionalInfo screen
    backgroundColor: '#121212',
    elevation: 4,
    shadowOffset: { width: 3, height: 5 },
    shadowOpacity: 0.4,
  },
  headerButton: {
    padding: 10,
    borderRadius: 8,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginVertical: 20,
  },
});

export default SignupScreen;
