import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Pressable, Image, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { firebase } from '../firebase';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';

const colors = {
  primary: '#5b5f97',
  secondary: '#ffc145',
  background: '#121212',
  text: '#fff',
  placeholder: '#888',
  inputBorder: '#ccc',
  button: '#ffc145',
  buttonText: '#fff',
  buttonLogout: '#e74c3c',
  headerBackground: '#121212',
  headerText: '#fffffb',
};

const BroadcastScreen = ({ route }) => {
  const navigation = useNavigation();
  const [societyId] = useState(route.params.societyId);
  const [messages, setMessages] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSocietyAdmin, setIsSocietyAdmin] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [societyInfo, setSocietyInfo] = useState(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const unsubscribeMessages = firebase.firestore()
      .collection('societies')
      .doc(societyId)
      .collection('broadcasts')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        snapshot => {
          const fetchedMessages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
          }));
          setMessages(fetchedMessages);
        },
        error => {
          console.error('Error fetching messages:', error);
          Alert.alert('Error', 'An error occurred while fetching messages.');
        }
      );

    const fetchSocietyInfo = async () => {
      try {
        const societyDoc = await firebase.firestore().collection('societies').doc(societyId).get();
        if (societyDoc.exists) {
          setSocietyInfo(societyDoc.data());
        }
      } catch (error) {
        console.error('Error fetching society info:', error);
        Alert.alert('Error', 'An error occurred while fetching society info.');
      }
    };

    fetchSocietyInfo();

    const checkRoles = async () => {
      try {
        const userId = firebase.auth().currentUser.uid;
        const userDoc = await firebase.firestore().collection('users').doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          setIsJoined(userData.isJoinedForBroadcast || false);
          setIsAdmin(userData.isAdmin || false);

          const societyAdminDoc = await firebase.firestore()
            .collection('societies')
            .doc(societyId)
            .collection('societyAdmins')
            .doc(userId)
            .get();
          setIsSocietyAdmin(societyAdminDoc.exists);
        }
      } catch (error) {
        console.error('Error checking roles:', error);
        Alert.alert('Error', 'An error occurred while checking your roles.');
      }
    };

    checkRoles();

    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      unsubscribeMessages();
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [societyId]);

  const handleJoinLeave = async () => {
    try {
      const userId = firebase.auth().currentUser.uid;
      await firebase.firestore().collection('users').doc(userId).update({ isJoinedForBroadcast: !isJoined });
      setIsJoined(!isJoined);
    } catch (error) {
      console.error('Error updating join status:', error);
      Alert.alert('Error', 'An error occurred while updating your status.');
    }
  };

  const handleBroadcast = async () => {
    try {
      if (!newMessage.trim()) {
        Alert.alert('Error', 'Please enter a message.');
        return;
      }
  
      const userId = firebase.auth().currentUser.uid;
      const timestamp = firebase.firestore.FieldValue.serverTimestamp();
  
      // Save the broadcast message to Firestore
      await firebase.firestore()
        .collection('societies')
        .doc(societyId)
        .collection('broadcasts')
        .add({
          message: newMessage,
          sender: userId,
          createdAt: timestamp,
        });
  
      // Fetch users who have joined the broadcast
      const usersSnapshot = await firebase.firestore()
        .collection('users')
        .where('isJoinedForBroadcast', '==', true)
        .get();
  
      const notificationPromises = usersSnapshot.docs.map((userDoc) => {
        const userData = userDoc.data();
        return firebase.firestore()
          .collection('users')
          .doc(userDoc.id)
          .collection('notifications')
          .add({
            type: 'broadcast',
            message: `New broadcast: ${newMessage}`,
            createdAt: timestamp,
            societyId,
            senderId: userId,
            read: false, // Unread by default
          });
      });
  
      await Promise.all(notificationPromises);
  
      Alert.alert('Success', 'Broadcast sent successfully!');
      setNewMessage('');
    } catch (error) {
      console.error('Error sending broadcast:', error);
      Alert.alert('Error', 'An error occurred while sending the broadcast.');
    }
    };        
  const handleUserPress = (userId) => {
    navigation.navigate('UserProfileScreen', { userId });
  };

  const renderItem = ({ item }) => (
    <Pressable style={{ marginVertical: 10 }}>
      <View
        style={[
          styles.TriangleShapeCSS,
          item.sender === firebase.auth().currentUser.uid ? styles.right : styles.left,
        ]}
      />
      <View
        style={[
          styles.masBox,
          {
            alignSelf: item.sender === firebase.auth().currentUser.uid ? 'flex-end' : 'flex-start',
            backgroundColor: item.sender === firebase.auth().currentUser.uid ? colors.primary : colors.background,
          },
        ]}
      >
        <View style={styles.messageHeader}>
          {item.senderProfilePic ? (
            <TouchableOpacity onPress={() => handleUserPress(item.sender)}>
              <Image source={{ uri: item.senderProfilePic }} style={styles.profilePic} />
            </TouchableOpacity>
          ) : (
            <View style={styles.profilePicPlaceholder} />
          )}
          <Text
            style={{
              paddingLeft: 5,
              color: item.sender === firebase.auth().currentUser.uid ? colors.buttonText : colors.text,
              fontSize: 16,
              fontWeight: '500',
            }}
          >
            {item.message}
          </Text>
        </View>
        <Text style={styles.messageDate}>{item.createdAt ? moment(item.createdAt).format('MMMM Do YYYY, h:mm:ss a') : ''}</Text>
      </View>
    </Pressable>
  );

  if (!societyInfo) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  

    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Image source={{ uri: societyInfo.logo }} style={styles.logo} />
          <Text style={styles.societyName}>{societyInfo.name}</Text>
          <Text style={styles.headerText}>Broadcast</Text>
        </View>
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: keyboardVisible ? 300 : 0 },
          ]}
          ListEmptyComponent={<Text style={styles.emptyText}>No messages yet.</Text>}
        />
        <TouchableOpacity style={styles.joinButton} onPress={handleJoinLeave}>
          <Text style={styles.joinButtonText}>
            {isJoined ? 'Leave Broadcast Notifications' : 'Join to be Notified'}
          </Text>
        </TouchableOpacity>
        {(isAdmin || isSocietyAdmin) && (
          <View style={styles.broadcastContainer}>
            <TextInput
              style={[styles.broadcastInput, { backgroundColor: colors.background }]}
              placeholder="Type a message..."
              placeholderTextColor={colors.placeholder}
              value={newMessage}
              onChangeText={(text) => setNewMessage(text)}
              onSubmitEditing={handleBroadcast}
            />
            <TouchableOpacity style={styles.broadcastButton} onPress={handleBroadcast}>
              <Ionicons name="send" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 0,
      paddingBottom: 0,
    },
    header: {
      paddingVertical: 15,
      paddingHorizontal: 20,
      backgroundColor: colors.headerBackground,
      alignItems: 'center',
      flexDirection: 'row',
      borderBottomColor: colors.inputBorder,
      borderBottomWidth: 1,
      elevation: 4, // Add shadow for elevation
    },
    headerText: {
      fontSize: 16,
      color: colors.headerText,
      textAlign: 'center',
    },
    logo: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 10,
    },
    societyName: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.headerText,
      flex: 1,
    },
    listContainer: {
      paddingHorizontal: 10,
    },
    TriangleShapeCSS: {
      width: 0,
      height: 0,
      borderStyle: 'solid',
      borderWidth: 10,
      borderLeftWidth: 20,
      borderLeftColor: 'transparent',
      borderRightWidth: 20,
      borderRightColor: 'transparent',
      position: 'absolute',
    },
    left: {
      borderBottomWidth: 20,
      borderBottomColor: colors.background,
      borderTopWidth: 20,
      borderTopColor: 'transparent',
      borderLeftWidth: 0,
      borderRightWidth: 0,
      right: 0,
      top: 10,
    },
    right: {
      borderBottomWidth: 20,
      borderBottomColor: colors.primary,
      borderTopWidth: 20,
      borderTopColor: 'transparent',
      borderLeftWidth: 0,
      borderRightWidth: 0,
      left: 0,
      top: 10,
    },
    masBox: {
      maxWidth: '80%',
      padding: 10,
      borderRadius: 10,
      marginBottom: 10,
    },
    messageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    profilePic: {
      width: 30,
      height: 30,
      borderRadius: 15,
    },
    profilePicPlaceholder: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.placeholder,
    },
    messageDate: {
      color: colors.placeholder,
      fontSize: 12,
      marginTop: 5,
    },
    loadingText: {
      color: colors.text,
      textAlign: 'center',
      marginTop: 20,
    },
    emptyText: {
      color: colors.text,
      textAlign: 'center',
      marginTop: 20,
    },
    joinButton: {
      backgroundColor: colors.button,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5,
      margin: 20,
      alignItems: 'center',
    },
    joinButtonText: {
      color: colors.buttonText,
      fontSize: 16,
    },
    broadcastContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      backgroundColor: colors.background,
      borderTopColor: colors.inputBorder,
      borderTopWidth: 1,
    },
    broadcastInput: {
      flex: 1,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      padding: 10,
      color: colors.text,
      marginRight: 10,
    },
    broadcastButton: {
      padding: 10,
    },
  });
  
  export default BroadcastScreen;
  
