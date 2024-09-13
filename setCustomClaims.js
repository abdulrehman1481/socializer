const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://socializer-88147.firebaseio.com' // Replace with your database URL
});

const setCustomUserClaims = async (uid) => {
  await admin.auth().setCustomUserClaims(uid, { isAdmin: true });
  console.log('Custom claims set for user', uid);
};

// Replace 'user-uid' with the actual user UID
setCustomUserClaims('actual-user-uid'); // Replace with the correct UID
