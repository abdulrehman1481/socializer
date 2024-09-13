const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://socializer-88147.firebaseio.com' // Replace with your database URL
});

const setUserAdmin = async (uid) => {
  try {
    // Set the custom user claim
    await admin.auth().setCustomUserClaims(uid, { isAdmin: true });
    console.log(`User ${uid} is now an admin.`);
  } catch (error) {
    console.error('Error setting admin claim:', error);
  }
};

// Example usage: Set user with UID '1SMJCZOZ9AcBqeZ2SYawRpbNhFl1' as an admin
setUserAdmin('1SMJCZOZ9AcBqeZ2SYawRpbNhFl1');
