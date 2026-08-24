// Real Firebase Configuration for Balaji Enterprises & Restaurant
const firebaseConfig = window.FIREBASE_CONFIG || {
  apiKey: "AIzaSyA_yuS6OTRPu9doh2cgXaC9kMlks5r2VGc",
  authDomain: "balaji-enterprises-restaurant.firebaseapp.com",
  projectId: "balaji-enterprises-restaurant",
  storageBucket: "balaji-enterprises-restaurant.firebasestorage.app",
  messagingSenderId: "995568519192",
  appId: "1:995568519192:web:aad002de08857df1c1db6d",
  measurementId: "G-Q7GB3YZ9D2"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  window.db = firebase.firestore();
  window.auth = firebase.auth();
  window.storage = firebase.storage();
  window.functions = firebase.functions();
} else {
  console.warn('Firebase SDK script not loaded yet.');
}
