// import { boot } from 'quasar/wrappers'
// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
// export default boot(async (/* { app, router, ... } */) => {
  // something to do
// })
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/database';
import { getAuth } from "firebase/auth"
import { GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBNSrd06hE3vNobyR9uvT6nciyyCHcojd4",
  authDomain: "machtagram.firebaseapp.com",
  projectId: "machtagram",
  storageBucket: "machtagram.appspot.com",
  messagingSenderId: "678715541682",
  appId: "1:678715541682:web:5c4f220a2ac01388b221ab"
};


// Initialize Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig);

// Use these for db & auth
const firebaseDb = firebaseApp.database();
const firebaseAuth = firebase.auth();

export default  {
  firebaseAuth, firebaseDb, getAuth, GoogleAuthProvider
}
