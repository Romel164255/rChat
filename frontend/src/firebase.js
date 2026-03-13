// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCs3P3uxtXFeTqyEYmCzlPp1J0lg8sc_j8",
  authDomain: "rchat-b0e2c.firebaseapp.com",
  projectId: "rchat-b0e2c",
  storageBucket: "rchat-b0e2c.firebasestorage.app",
  messagingSenderId: "847888507400",
  appId: "1:847888507400:web:d92eb2eb77820e6f7b67bd",
  measurementId: "G-8F2FDRYPQL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);