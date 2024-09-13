import { View, Text, TextInput, StyleSheet, TouchableOpacity, Pressable, Platform, KeyboardAvoidingView, ScrollView, Alert } from 'react-native';
import React from 'react';
import * as Yup from 'yup';
import { Formik } from 'formik';
import Validator from 'email-validator';
import { auth } from '../../firebase';

const Loginform = ({ navigation }) => {
  const LoginFormSchema = Yup.object().shape({
    email: Yup.string().email().required('Email is required'),
    password: Yup.string().required('Password is required').min(6, 'Password is too short'),
  });

  const onLogin = async (email, password) => {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      console.log('Logged in successfully:', userCredential.user.email);
      navigation.navigate('MainTabs');
    } catch (error) {
      let errorMessage = '';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid password';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Account does not exist';
      } else {
        errorMessage = error.message;
      }
      Alert.alert(
        'Login Error',
        errorMessage,
        [
          {
            text: 'OK',
            onPress: () => console.log('OK'),
            style: 'cancel',
          },
          {
            text: 'Sign Up',
            onPress: () => navigation.push('Signup'),
          },
        ]
      );
    }
  };

  return (
    <Formik
      initialValues={{ email: '', password: '' }}
      onSubmit={(values) => { onLogin(values.email, values.password); }}
      validationSchema={LoginFormSchema}
      validateOnMount={true}
    >
      {({ handleChange, handleBlur, handleSubmit, values, isValid }) => (
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            keyboardShouldPersistTaps='handled'
          >
            <View style={styles.inputContainer}>
              <TextInput
                placeholder='Email'
                autoCapitalize='none'
                keyboardType='email-address'
                textContentType='emailAddress'
                autoFocus={false}
                placeholderTextColor={'#888888'}
                style={[
                  styles.input, 
                  { 
                    borderColor: values.email.length < 1 || Validator.validate(values.email) ? '#CCC' : 'red',
                  }
                ]}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                value={values.email}
              />
              <TextInput
                placeholder='Password'
                autoCapitalize='none'
                autoCorrect={false}
                placeholderTextColor={'#888888'}
                style={[
                  styles.input, 
                  { 
                    borderColor: values.password.length < 1 || values.password.length >= 6 ? '#CCC' : 'red',
                  }
                ]}
                secureTextEntry={true}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                value={values.password}
              />
              <View style={styles.forgotPasswordContainer}>
                <TouchableOpacity>
                  <Text style={styles.forgpasstext}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.buttonContainer}>
              <Pressable style={styles.buttonstyle(isValid)} onPress={handleSubmit} disabled={!isValid}>
                <Text style={styles.buttonText}>Log in</Text>
              </Pressable>
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => navigation.push('Signup')}>
                  <Text style={styles.signupLink}> Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </Formik>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    backgroundColor: '#333',
    color: '#fff',
    fontSize: 16,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: 5,
  },
  forgpasstext: {
    color: '#ffc145',
    fontSize: 14,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  buttonstyle: (isValid) => ({
    width: '100%',
    height: 50,
    backgroundColor: isValid ? '#5b58f5' : '#a5a5a5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  }),
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    marginTop: 15,
    alignItems: 'center',
  },
  signupText: {
    color: '#ffc145',
    fontSize: 14,
  },
  signupLink: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Loginform;
