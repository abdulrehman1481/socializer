const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.setCustomClaims = functions.https.onCall(async (data, context) => {
  const uid = data.uid;

  if (context.auth.token.isAdmin !== true) {
    return { error: 'Only admin users can set custom claims.' };
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { isAdmin: true });
    return { message: `Custom claims set for user ${uid}` };
  } catch (error) {
    return { error: error.message };
  }
});
