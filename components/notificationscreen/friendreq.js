import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { db, auth, firebase } from '../../firebase';

const FriendRequestsScreen = () => {
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null); // For pagination

  useEffect(() => {
    fetchFriendRequests();
    fetchFriends();
  }, []);

  const fetchFriendRequests = async () => {
    if (!auth.currentUser) {
      console.error("User is not authenticated");
      setLoading(false);
      return;
    }

    try {
      let query = db.collection('friendRequests')
        .where('to', '==', auth.currentUser.uid)
        .orderBy('createdAt', 'desc')
        .limit(10);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();
      const newRequests = await Promise.all(snapshot.docs.map(async doc => {
        const userDoc = await db.collection('users').doc(doc.data().from).get();
        return {
          id: doc.id,
          fromUserId: doc.data().from,
          fromUserName: userDoc.exists ? userDoc.data().name : 'Unknown User',
          status: doc.data().status,
          timestamp: doc.data().createdAt.toDate(),
        };
      }));

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]); // Update last doc
      setFriendRequests(prev => [...prev, ...newRequests]);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    if (!auth.currentUser) return;

    try {
      const userDoc = await db.collection('users').doc(auth.currentUser.uid).get();
      if (userDoc.exists) {
        const friendList = userDoc.data().friendList || []; // Ensure it is initialized
        const friendsData = await Promise.all(friendList.map(async friendId => {
          const friendDoc = await db.collection('users').doc(friendId).get();
          return {
            id: friendId,
            friendName: friendDoc.exists ? friendDoc.data().name : 'Unknown User',
          };
        }));
        setFriends(friendsData);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const acceptFriendRequest = async (requestId, fromUserId) => {
    try {
      const batch = db.batch();

      // Update the friend request status
      const friendRequestRef = db.collection('friendRequests').doc(requestId);
      batch.update(friendRequestRef, { status: 'accepted' });

      // Add both users as friends
      const friendRef = db.collection('friends').doc();
      batch.set(friendRef, {
        user1: auth.currentUser.uid,
        user2: fromUserId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      // Update user friend lists (using batched writes)
      const userDocRef1 = db.collection('users').doc(auth.currentUser.uid);
      batch.update(userDocRef1, {
        friendList: firebase.firestore.FieldValue.arrayUnion(fromUserId),
      });

      const userDocRef2 = db.collection('users').doc(fromUserId);
      batch.update(userDocRef2, {
        friendList: firebase.firestore.FieldValue.arrayUnion(auth.currentUser.uid),
      });

      await batch.commit();
      setFriendRequests(prev => prev.filter(request => request.id !== requestId));
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const declineFriendRequest = async (requestId) => {
    try {
      await db.collection('friendRequests').doc(requestId).delete();
      setFriendRequests(prev => prev.filter(request => request.id !== requestId));
    } catch (error) {
      console.error("Error declining friend request:", error);
    }
  };

  const renderFriendRequest = ({ item }) => (
    <View style={styles.requestItem} key={item.id}>
      <Text>{item.fromUserName}</Text>
      <View style={styles.requestButtons}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => acceptFriendRequest(item.id, item.fromUserId)}
        >
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => declineFriendRequest(item.id)}
        >
          <Text style={styles.buttonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFriend = ({ item }) => (
    <View style={styles.friendItem} key={item.id}>
      <Text>{item.friendName}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Friend Requests</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />
      ) : friendRequests.length === 0 ? (
        <Text style={styles.noRequestsText}>No friend requests</Text>
      ) : (
        <FlatList
          data={friendRequests}
          renderItem={renderFriendRequest}
          keyExtractor={(item) => item.id}
          onEndReached={() => fetchFriendRequests()}
          onEndReachedThreshold={0.5}
        />
      )}
      <Text style={styles.header}>Friends</Text>
      {friends.length === 0 ? (
        <Text style={styles.noRequestsText}>No friends yet</Text>
      ) : (
        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  requestItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 8,
    borderRadius: 5,
    backgroundColor: '#e3f2fd',
  },
  requestButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  declineButton: {
    backgroundColor: '#F44336',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  friendItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  noRequestsText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 20,
  },
});

export default FriendRequestsScreen;
