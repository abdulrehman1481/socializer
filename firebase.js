import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB53hXJmyxWA92b3H3QAe5KslMcxRRKpWQ",
  authDomain: "socializer-88147.firebaseapp.com",
  projectId: "socializer-88147",
  storageBucket: "socializer-88147.appspot.com",
  messagingSenderId: "797660080254",
  appId: "1:797660080254:web:3773a7ec102d0e8338102f",
  measurementId: "G-MGY11PRDH9"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  } else {
    firebase.app();
  }
  
  // Initialize Firebase Auth and Firestore
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();
  
  export { auth, db, firebase , storage};
  