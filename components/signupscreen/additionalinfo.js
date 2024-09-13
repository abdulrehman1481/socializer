import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Dimensions, TouchableOpacity, Alert, Image, ScrollView } from 'react-native';
import * as Yup from 'yup';
import { Formik } from 'formik';
import * as ImagePicker from 'expo-image-picker';
import RNPickerSelect from 'react-native-picker-select';
import { auth, db, storage } from '../../firebase';
import { Ionicons } from '@expo/vector-icons';

const SignUpAdditionalInfo = ({ navigation, route }) => {
  const { email, name, cmsId, isStudent } = route.params;

  const SignupAdditionalSchema = Yup.object().shape({
    username: Yup.string().required('Username is required').min(3, 'Username is too short'),
    password: Yup.string().required('Password is required').min(6, 'Password is too short'),
    retypePassword: Yup.string().oneOf([Yup.ref('password'), null], 'Passwords must match').required('Retype Password is required'),
    department: Yup.string().when('isStudent', {
      is: true,
      then: Yup.string().required('Department is required'),
    }),
    batch: Yup.string().when('isStudent', {
      is: true,
      then: Yup.string().required('Batch is required'),
    }),
    occupation: Yup.string().when('isStudent', {
      is: false,
      then: Yup.string().required('Occupation is required'),
    }),
    bio: Yup.string().when('isStudent', {
      is: false,
      then: Yup.string(),
    }),
    phoneNumber: Yup.string().matches(/^\d+$/, 'Phone number is not valid').nullable(),
    campus: Yup.string().required('Campus is required'),
  });

  const departments = [
    { label: 'IGIS', value: 'IGIS' },
    { label: 'NICE', value: 'NICE' },
    { label: 'ASAB', value: 'ASAB' },
    { label: 'SEECS', value: 'SEECS' },
    { label: 'IESE', value: 'IESE' },
    { label: 'SMME', value: 'SMME' },
    { label: 'SADA', value: 'SADA' },
    { label: 'SINES', value: 'SINES' },
    { label: 'NSHS', value: 'NSHS' },
    { label: 'NBS', value: 'NBS' },
    { label: 'S3H', value: 'S3H' },
  ];

  const batches = [
    { label: '2021', value: '2021' },
    { label: '2022', value: '2022' },
    { label: '2023', value: '2023' },
    { label: '2024', value: '2024' },
  ];

  const campuses = [
    { label: 'H12 Main Campus', value: 'H12' },
    { label: 'CEME', value: 'CEME' },
    { label: 'MCS', value: 'MCS' },
    { label: 'PNEC', value: 'PNEC' },
  ];

  const [profileImage, setProfileImage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);

  const selectProfileImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission result:', permissionResult); // Log permission result

      if (!permissionResult.granted) {
        Alert.alert("Permission required", "You've refused to allow this app to access your photos!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 4],
        quality: 1,
      });

      console.log('Image picker result:', result); // Log picker result

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting profile image:', error);
    }
  };

  const uploadProfileImage = async (uri, email) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const ref = storage.ref().child(`profile_pictures/${email}`);
      await ref.put(blob);
      const downloadURL = await ref.getDownloadURL();
      console.log('Uploaded profile picture URL:', downloadURL); // Log the URL
      return downloadURL;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Error', 'Failed to upload profile picture.');
      return null;
    }
  };

  const onSignup = async (values, { setSubmitting }) => {
    setSubmitting(true);
    try {
      await auth.createUserWithEmailAndPassword(email, values.password);
      const authUser = auth.currentUser;
  
      let profilePictureUrl = '';
      if (profileImage) {
        profilePictureUrl = await uploadProfileImage(profileImage, email);
      }
  
      await db.collection('users').doc(authUser.uid).set({
        owner_uid: authUser.uid,
        email: authUser.email,
        name: name,
        cmsId: cmsId,
        isStudent: isStudent,
        username: values.username,
        department: isStudent ? values.department : '',
        batch: isStudent ? values.batch : '',
        occupation: isStudent ? '' : values.occupation,
        bio: isStudent ? '' : values.bio,
        phoneNumber: values.phoneNumber || '',
        campus: values.campus,
        profile_picture: profilePictureUrl,
      });
  
      navigation.push('MainTabs' );
    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'The email address is already in use by another account.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'The email address is not valid.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password accounts are not enabled.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'The password is too weak.';
      } else if (error.code === 'auth/username-already-in-use') {
        errorMessage = 'Username already in use';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message) {
        // Generic error message for any other errors
        errorMessage = error.message;
      }
      
      Alert.alert('Sign Up Error', errorMessage, [
        {
          text: 'OK',
          style: 'cancel',
          onPress: () => navigation.goBack(), // Navigate back to the previous screen
        },
      ]);
    } finally {
      setSubmitting(false);
    }
  };
  

  return (
    <>  
    <View style={styles.container} >
          <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      </View>
    <ScrollView contentContainerStyle={styles.screen}>

      <View style={styles.logoContainer}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
      </View>
      <Formik
        initialValues={{
          username: '',
          password: '',
          retypePassword: '',
          department: isStudent ? '' : undefined,
          batch: isStudent ? '' : undefined,
          occupation: isStudent ? undefined : '',
          bio: isStudent ? undefined : '',
          phoneNumber: '',
          campus: '',
        }}
        onSubmit={onSignup}
        validationSchema={SignupAdditionalSchema}
        validateOnMount={true}
      >
        {({ handleChange, handleBlur, handleSubmit, values, isValid, isSubmitting }) => (
          <View style={styles.container}>
            <TextInput
              placeholder="Username"
              autoCapitalize="none"
              textContentType="username"
              placeholderTextColor="gray"
              style={[styles.input, { borderColor: values.username ? '#E8E8E8' : 'red' }]}
              onChangeText={handleChange('username')}
              onBlur={handleBlur('username')}
              value={values.username}
            />
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Password"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="gray"
                style={[styles.input, { borderColor: values.password ? '#E8E8E8' : 'red' }]}
                secureTextEntry={!showPassword}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                value={values.password}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color="gray" />
              </TouchableOpacity>
            </View>
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Retype Password"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="gray"
                style={[styles.input, { borderColor: values.retypePassword ? '#E8E8E8' : 'red' }]}
                secureTextEntry={!showRetypePassword}
                onChangeText={handleChange('retypePassword')}
                onBlur={handleBlur('retypePassword')}
                value={values.retypePassword}
              />
              <TouchableOpacity onPress={() => setShowRetypePassword(!showRetypePassword)} style={styles.eyeIcon}>
                <Ionicons name={showRetypePassword ? 'eye-off' : 'eye'} size={24} color="gray" />
              </TouchableOpacity>
            </View>
            {isStudent ? (
              <>
<RNPickerSelect
  placeholder={{ label: 'Select Department...', value: null }}
  items={departments}
  onValueChange={handleChange('department')}
  onBlur={handleBlur('department')}
  value={values.department}
  style={pickerStyles} // corrected from 'pickerStyle' to 'pickerStyles'
/>
<RNPickerSelect
  placeholder={{ label: 'Select Batch...', value: null }}
  items={batches}
  onValueChange={handleChange('batch')}
  onBlur={handleBlur('batch')}
  value={values.batch}
  style={pickerStyles} // corrected from 'pickerStyle' to 'pickerStyles'
/>

              </>
            ) : (
              <>
                <TextInput
                  placeholder="Occupation"
                  autoCapitalize="none"
                  textContentType="jobTitle"
                  placeholderTextColor="gray"
                  style={[styles.input, { borderColor: values.occupation ? '#E8E8E8' : 'red' }]}
                  onChangeText={handleChange('occupation')}
                  onBlur={handleBlur('occupation')}
                  value={values.occupation}
                />
                <TextInput
                  placeholder="Bio"
                  autoCapitalize="none"
                  textContentType="none"
                  placeholderTextColor="gray"
                  style={[styles.input, { borderColor: values.bio ? '#E8E8E8' : 'red' }]}
                  onChangeText={handleChange('bio')}
                  onBlur={handleBlur('bio')}
                  value={values.bio}
                />
              </>
            )}
            <TextInput
              placeholder="Phone Number (optional)"
              autoCapitalize="none"
              keyboardType="numeric"
              placeholderTextColor="gray"
              style={[styles.input, { borderColor: values.phoneNumber ? '#E8E8E8' : 'red' }]}
              onChangeText={handleChange('phoneNumber')}
              onBlur={handleBlur('phoneNumber')}
              value={values.phoneNumber}
            />

<RNPickerSelect
  placeholder={{ label: 'Select Campus...', value: null }}
  items={campuses}
  onValueChange={handleChange('campus')}
  onBlur={handleBlur('campus')}
  value={values.campus}
  style={pickerStyles} // corrected from 'pickerStyle' to 'pickerStyles'
/>


            <TouchableOpacity style={styles.profileImageContainer} onPress={selectProfileImage}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <Ionicons style={styles.imagePickerButton} name="camera" size={100} color="#E8E8E8" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              
              style={[styles.signupButton, { backgroundColor: '#0066CC'  }]}
            >
              <Text style={styles.signupButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </ScrollView>
    </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    
  },
  screen: {
   padding: 20,
    position: 'relative',
    backgroundColor: '#121212',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: '#121212',
    height: 90,
    borderBottomWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,

  },
  headerButton: {
    padding: 10,
    marginTop: 25,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  logo: {
    width: 150,
    height: 50,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: 'white',
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    top: 12,
  },
  pickerStyles: {
    inputIOS: {
      height: 50,
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 10,
      marginBottom: 15,
      backgroundColor: 'white',
      borderColor: '#E8E8E8',
    },
    inputAndroid: {
      height: 50,
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 10,
      marginBottom: 15,
      backgroundColor: 'white',
      borderColor: '#E8E8E8',
    },
  },
  imagePickerButton: {
    color: 'white',
    
    borderRadius: 5,
    marginBottom: 20,
    borderRadius: 50,
    alignSelf: 'center',
  },
  imagePickerText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 20,
  },
  signupButton: {
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    borderRadius: 10,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 20,
    alignContent: 'center',
    
    fontWeight: 'bold',
  },
});

const pickerStyles = StyleSheet.create({
  inputIOS: {
    height: 50,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: 'white',
    borderColor: '#E8E8E8',
  },
  inputAndroid: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: 'white',
    borderColor: '#E8E8E8',
  },
});

export default SignUpAdditionalInfo;
