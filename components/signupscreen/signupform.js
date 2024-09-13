import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Dimensions, Pressable, Alert } from 'react-native';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { auth, db } from '../../firebase';

// List of allowed email domains
const allowedDomains = [
  'gmail.com', 
  'outlook.com', 
  'student.nust.edu.pk', 
  'nust.edu.pk', 
  'seecs.edu.pk', 
  'smme.edu.pk', 
  's3h.edu.pk'
];

const emailValidation = Yup.string()
  .email('Invalid email format')
  .test('is-valid-domain', 'Email must be from an allowed domain', (value) => {
    if (!value) return false;
    const domain = value.split('@')[1];
    return allowedDomains.includes(domain);
  })
  .required('Email is required');

const SignupBasicSchema = Yup.object().shape({
  email: emailValidation,
  name: Yup.string().required('Name is required'),
  cmsId: Yup.string().required('CMS ID is required'),
});

const SignUpBasicInfo = ({ navigation }) => {
  const [isStudent, setIsStudent] = useState(true);

  const checkEmailInUse = async (email) => {
    try {
      // Fetch sign-in methods associated with the email
      const signInMethods = await auth.fetchSignInMethodsForEmail(email);
      console.log('Sign-in methods:', signInMethods); // Log the result for debugging
      return signInMethods.length > 0; // If methods exist, the email is in use
    } catch (error) {
      console.error('Error checking email in use:', error);
      throw error; // Re-throw the error to be caught in the onContinue function
    }
  };
  
  

  const onContinue = async (values) => {
    try {
      const emailInUse = await checkEmailInUse(values.email);
      console.log('Email in use:', emailInUse); // Log the result for debugging
      if (emailInUse) {
        Alert.alert('Error', 'Email is already in use');
        return;
      }
      navigation.navigate('SignUpAdditionalInfo', { ...values, isStudent });
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Sign-up error:', error); // Log the error for debugging
    }
  };
  
  

  return (
    <Formik
      initialValues={{ email: '', name: '', cmsId: '' }}
      onSubmit={(values) => onContinue(values)}
      validationSchema={SignupBasicSchema}
      validateOnMount={true}
    >
      {({ handleChange, handleBlur, handleSubmit, values, isValid }) => (
        <View style={styles.container}>
          <Text style={styles.title}>Sign Up</Text>
          <View style={styles.toggleContainer}>
            <Pressable onPress={() => setIsStudent(true)} style={[styles.toggleButton, isStudent && styles.activeToggle]}>
              <Text style={styles.toggleText}>Student</Text>
            </Pressable>
            <Pressable onPress={() => setIsStudent(false)} style={[styles.toggleButton, !isStudent && styles.activeToggle]}>
              <Text style={styles.toggleText}>Faculty</Text>
            </Pressable>
          </View>
          <TextInput
            placeholder='Name'
            autoCapitalize='words'
            placeholderTextColor='gray'
            style={[styles.input, { borderColor: values.name ? '#CCC' : 'red' }]}
            onChangeText={handleChange('name')}
            onBlur={handleBlur('name')}
            color='white'
            value={values.name}
          />
          <TextInput
            placeholder='Gmail/NUST Email'
            autoCapitalize='none'
            keyboardType='email-address'
            textContentType='emailAddress'
            placeholderTextColor='gray'
            style={[styles.input, { borderColor: values.email && emailValidation.isValidSync(values.email) ? '#CCC' : 'red' }]}
            onChangeText={handleChange('email')}
            color='white'
            onBlur={handleBlur('email')}
            value={values.email}
          />
          <TextInput
            placeholder='CMS ID'
            autoCapitalize='none'
            placeholderTextColor='gray'
            style={[styles.input, { borderColor: values.cmsId ? '#CCC' : 'red' }]}
            onChangeText={handleChange('cmsId')}
            onBlur={handleBlur('cmsId')}
            value={values.cmsId}
            color='white'
          />
          <Pressable style={styles.buttonStyle(isValid)} onPress={handleSubmit} disabled={!isValid}>
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
        </View>
      )}
    </Formik>
  );
};

const Width = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    
  },
  toggleButton: {
    width: Width / 2 - 40,
    height: 40,
    color: '#ffc145',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  activeToggle: {
    borderColor: '#ffc145',
  },
  toggleText: {
    fontSize: 16,
    color: 'white',
  },
  input: {
    width: Width - 40,

    height: 50,
    borderWidth: 1,
    borderColor: '#CCC',
    marginTop: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  buttonStyle: (isValid) => ({
    width: Width - 40,
    height: 50,
    backgroundColor: isValid ? '#5b58f5' : '#a5a5a5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  }),
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SignUpBasicInfo;
