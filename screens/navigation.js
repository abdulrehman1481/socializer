import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';  // Import AuthNavigator
import MainNavigator from './MainNavigator';  // Import MainNavigator
import { auth } from '../firebase';  // Import your Firebase auth instance

const Navigation = () => {
  const [currentUser, setCurrentUser] = useState(null);

  // Handler to manage authentication state changes
  const userHandler = user => {
    console.log('User state changed:', user);
    setCurrentUser(user ? user : null);
  };

  useEffect(() => {
    console.log('Setting up auth state change listener');
    const unsubscribe = auth.onAuthStateChanged(userHandler);
    return () => {
      console.log('Cleaning up auth state change listener');
      unsubscribe();
    };
  }, []);

  console.log('Current user:', currentUser);

  return (
    <NavigationContainer>
      {currentUser ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default Navigation;
