// Firebase configuration configuration for Forge Fitness
// Replace these placeholder values with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyAPfU4ceJBidpUxqb5jYmr22bQlCCd97u0",
  authDomain: "forge-2b12e.firebaseapp.com",
  projectId: "forge-2b12e",
  storageBucket: "forge-2b12e.firebasestorage.app",
  messagingSenderId: "449987004071",
  appId: "1:449987004071:web:b9992502fbf1048dc33d82",
  measurementId: "G-30XPLB0BDM"
};

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();
