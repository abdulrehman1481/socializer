import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../firebase';

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seenNotifications, setSeenNotifications] = useState(new Set());

  useEffect(() => {
    const fetchNotifications = async () => {
      const userId = auth.currentUser.uid;

      try {
        // Fetch user notifications
        const userNotificationsPromise = db
          .collection('users')
          .doc(userId)
          .collection('notifications')
          .orderBy('createdAt', 'desc')
          .get();

        // Fetch societies the user belongs to
        const userSocietiesSnapshot = await db.collection('societies')
          .where('members', 'array-contains', userId)
          .get();

        const societyNotificationPromises = userSocietiesSnapshot.docs.map(async (societyDoc) => {
          return db.collection('societies')
            .doc(societyDoc.id)
            .collection('notifications')
            .orderBy('createdAt', 'desc')
            .get();
        });

        // Resolve all promises
        const [userNotificationsSnapshot, ...societyNotificationsSnapshots] = await Promise.all([
          userNotificationsPromise,
          ...societyNotificationPromises,
        ]);

        // Map and format user notifications
        const userNotifications = await Promise.all(
          userNotificationsSnapshot.docs.map(async (doc) => {
            const notificationData = doc.data();
            let notificationDetails = {
              id: doc.id,
              type: notificationData.type,
              timestamp: notificationData.createdAt.toDate(),
            };

            // Fetch society data if applicable
            if (notificationData.societyId) {
              const societyDoc = await db.collection('societies').doc(notificationData.societyId).get();
              notificationDetails.societyName = societyDoc.exists ? societyDoc.data().name : 'Unknown Society';
            }

            // Fetch assignedBy user data if applicable
            if (notificationData.assignedBy) {
              const assignedByDoc = await db.collection('users').doc(notificationData.assignedBy).get();
              notificationDetails.assignedByName = assignedByDoc.exists ? assignedByDoc.data().name : 'Unknown User';
            }

            // Handle different types of notifications
            switch (notificationData.type) {
              case 'broadcast':
                notificationDetails.message = `Broadcast from ${notificationDetails.societyName}: ${notificationData.message}`;
                break;
              case 'adminAssigned':
                notificationDetails.message = `You have been assigned as an admin in ${notificationDetails.societyName} by ${notificationDetails.assignedByName}.`;
                break;
              case 'roleAssigned':
                notificationDetails.message = `You have been assigned the role of ${notificationData.role} in ${notificationDetails.societyName} by ${notificationDetails.assignedByName}.`;
                break;
              case 'eventCreated':
                notificationDetails.message = `New event "${notificationData.eventName}" has been created in ${notificationDetails.societyName} on ${notificationData.eventDate}.`;
                break;
              case 'eventUpdated':
                notificationDetails.message = `Event "${notificationData.eventName}" in ${notificationDetails.societyName} has been updated.`;
                break;
              default:
                notificationDetails.message = `You have a new notification in ${notificationDetails.societyName}.`;
            }

            return notificationDetails;
          })
        );

        // Map and format society notifications
        const societyNotifications = await Promise.all(
          societyNotificationsSnapshots.flatMap((snapshot) =>
            snapshot.docs.map(async (doc) => {
              const notificationData = doc.data();
              let notificationDetails = {
                id: doc.id,
                type: notificationData.type,
                timestamp: notificationData.createdAt.toDate(),
              };

              const societyDoc = await db.collection('societies').doc(notificationData.societyId).get();
              notificationDetails.societyName = societyDoc.exists ? societyDoc.data().name : 'Unknown Society';

              // Handle different types of notifications
              switch (notificationData.type) {
                case 'broadcast':
                  notificationDetails.message = `Broadcast from ${notificationDetails.societyName}: ${notificationData.message}`;
                  break;
                case 'eventCreated':
                  notificationDetails.message = `New event "${notificationData.eventName}" has been created in ${notificationDetails.societyName} on ${notificationData.eventDate}.`;
                  break;
                case 'eventUpdated':
                  notificationDetails.message = `Event "${notificationData.eventName}" in ${notificationDetails.societyName} has been updated.`;
                  break;
                default:
                  notificationDetails.message = `New notification from ${notificationDetails.societyName}.`;
              }

              return notificationDetails;
            })
          )
        );

        // Combine user and society notifications
        const allNotifications = [...userNotifications, ...societyNotifications];

        // Sort notifications by timestamp (newest first)
        const sortedNotifications = allNotifications.sort((a, b) => b.timestamp - a.timestamp);

        // Filter out duplicate IDs and update state
        const uniqueNotifications = sortedNotifications.filter(
          (notification) => !seenNotifications.has(notification.id)
        );

        setNotifications(uniqueNotifications);
        setSeenNotifications((prev) => new Set([...prev, ...uniqueNotifications.map((n) => n.id)]));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const renderNotification = ({ item }) => (
    <View style={styles.notificationCard}>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationText}>{item.message}</Text>
      </View>
      <View style={styles.notificationMeta}>
        <Text style={styles.notificationTimestamp}>{item.timestamp.toLocaleString()}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fffffb" />
        </TouchableOpacity>
        <Text style={styles.header}>Notifications</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={styles.loadingIndicator} />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notificationList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 35,
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fffffb',
    flex: 1,
    textAlign: 'center',
  },
  loadingIndicator: {
    marginTop: 20,
  },
  notificationList: {
    paddingBottom: 10,
  },
  notificationCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 10,
    marginVertical: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  notificationContent: {
    marginBottom: 10,
  },
  notificationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffc145',
  },
  notificationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notificationTimestamp: {
    fontSize: 14,
    color: '#ccc',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
  },
});

export default NotificationScreen;
