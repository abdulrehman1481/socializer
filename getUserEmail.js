const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize the Firebase Admin SDK with the service account key
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://socializer-88147.firebaseio.com'
});

const getUserEmailByUid = async (uid) => {
  try {
    const userRecord = await admin.auth().getUser(uid);
    console.log(`Email for UID ${uid}: ${userRecord.email}`);
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
};

// Example usage: Get email for user with UID '1SMJCZOZ9AcBqeZ2SYawRpbNhFl1'
getUserEmailByUid('v2AlcOKhWoW7uMqHkzoIwsNR5tw2');

